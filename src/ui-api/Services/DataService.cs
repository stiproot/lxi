using Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;

namespace Services;

public class DataService(
  ILogger<DataService> logger,
  IOptions<ApiOptions> options,
  IHubContext<RepositoryStatusHub> hubContext,
  IRepoService repoService,
  IAiService aiService,
  IRepositoryClient repositoryClient
) : IDataService
{
  private readonly ILogger<DataService> _logger = logger;
  private readonly IOptions<ApiOptions> _options = options;
  private readonly IRepositoryClient _repositoryClient = repositoryClient;
  private readonly IAiService _aiService = aiService;
  private readonly IRepoService _repoService = repoService;
  private readonly IHubContext<RepositoryStatusHub> _hubContext = hubContext;

  public async Task SyncRepositoriesAsync()
  {
    IEnumerable<RepositorySummary> repos = await _repositoryClient.GetRepositoriesAsync();

    var keyValuePairs = repos.ToDictionary(r => r.Name, r => r);

    await _repoService.AddReposAsync(keyValuePairs);
  }

  public async Task ResetEmbeddingStatusAsync()
  {
    IDictionary<string, RepositorySummary> keyValuePairs = await _repoService.GetRepositoriesAsync();

    foreach ((string _, RepositorySummary repo) in keyValuePairs)
    {
      bool embeddingTimedOut = repo.EmbeddingStatus == EmbeddingStatuses.InProgress && DateTime.UtcNow.Subtract(repo.LastModified).Minutes > Limits.DefaultEmbeddingTimeoutMinutes;
      if (!embeddingTimedOut)
      {
        continue;
      }
      repo.EmbeddingStatus = EmbeddingStatuses.Error;
    }

    await _repoService.AddReposAsync(keyValuePairs);
  }

  public async Task<IEnumerable<RepositorySummary>> GetRepositoriesAsync()
  {
    IDictionary<string, RepositorySummary> keyValuePairs = await _repoService.GetRepositoriesAsync();
    return keyValuePairs.Values;
  }

  public async Task TryEmbedRepositoryAsync(
    RepositorySummary repository,
    CancellationToken cancellationToken
  )
  {
    _logger.LogMethodStart(nameof(TryEmbedRepositoryAsync));
    cancellationToken.ThrowIfCancellationRequested();

    repository = await _repoService.GetRepositoryAsync(repository.Name);

    try
    {
      bool canEmbed = repository.EmbeddingStatus is EmbeddingStatuses.Error
        || repository.EmbeddingStatus is EmbeddingStatuses.NotStarted
        || (
            repository.EmbeddingStatus is EmbeddingStatuses.InProgress
            && DateTime.UtcNow.Subtract(repository.LastModified).Minutes > Limits.DefaultEmbeddingTimeoutMinutes
        );
      if (!canEmbed)
      {
        return;
      }

      repository.EmbeddingStatus = EmbeddingStatuses.InProgress;
      repository.LastModified = DateTime.UtcNow;

      await _repoService.UpdateRepositoryAsync(repository);

      var cmdRequest = new CmdRequest
      {
        CmdType = CmdTypes.EmbedRepo,
        CmdMetadata = new CmdMetadata
        {
          RepoName = repository.Name,
          CmdPostOp = new()
          {
            CmdResultBroadCasts = [
              new ()
              {
                Url = $"{_options.Value.HostUrl}/api/repositories/{repository.Name}/broadcast",
                StaticPayload = new()
                {
                  RepositoryName = repository.Name,
                  Message = $"Embedding of {repository.Name} is complete",
                  Status = "Success"
                }
              }
            ]
          }
        },
        CmdData = new CmdData(),
        CmdResult = []
      };

      await _aiService.EmbedRepositoryAsync(cmdRequest, cancellationToken);

      await BroadcastEmbeddingStatusChangeAsync(
        repository,
        EmbeddingStatuses.InProgress,
        $"Starting embedding process for {repository.Name}...",
        cancellationToken
      );
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(TryEmbedRepositoryAsync), $"Failed to initiate embedding for repository {repository.Name}", ex);

      repository.EmbeddingStatus = EmbeddingStatuses.Error;
      await _repoService.UpdateRepositoryAsync(repository);

      await BroadcastEmbeddingStatusChangeAsync(
        repository,
        EmbeddingStatuses.Error,
        $"Failed to initiate embedding for {repository.Name}: {ex.Message}",
        cancellationToken
      );

      throw;
    }
  }

  public async Task<string> GetRepositoryEmbeddingStatusAsync(string repositoryName)
  {
    RepositorySummary repository = await _repoService.GetRepositoryAsync(repositoryName);
    return repository.EmbeddingStatus;
  }

  public async Task<IEnumerable<RepositorySummary>> GetRepositoriesEmbeddingStatusAsync(List<string> repoNames)
  {
    IDictionary<string, RepositorySummary> keyValuePairs = await _repoService.GetRepositoriesAsync();
    return keyValuePairs.Where(kv => repoNames.Exists(k => kv.Key == k)).Select(kv => kv.Value);
  }

  public async Task BroadcastRepositoryStatusAsync(
    string repositoryName,
    string status,
    string? message = null
  )
  {
    _logger.LogGenericInformation(nameof(BroadcastRepositoryStatusAsync), $"Broadcasting status update for repository {repositoryName}: {status}");

    await _hubContext.Clients.All.SendAsync(
        "EmbeddingStatusChanged",
        repositoryName,
        status,
        message ?? $"Repository {repositoryName} status changed to {status}"
    );
  }

  public async Task UpdateRepositoryStatusAsync(
    string repositoryName,
    string status
  )
  {
    await _repoService.UpdateRepositoryStatusAsync(repositoryName, status);
  }

  public async Task<string> GetRepositoryInfoAsync(string repositoryName) => await _repositoryClient.GetRepositoryInfoAsync(repositoryName);

  public async Task<string> GetRepositoryFilesAsync(string repositoryName) => await _repositoryClient.GetRepositoryFilesAsync(repositoryName);

  public async Task<string> GetRepositoryFileContentAsync(
    string repositoryName,
    string filePath
  ) => await _repositoryClient.GetRepositoryFileContentAsync(repositoryName, filePath);

  private async Task BroadcastEmbeddingStatusChangeAsync(
    RepositorySummary repository,
    string status,
    string? message,
    CancellationToken cancellationToken = default
  )
  {
    await _hubContext.Clients.All.SendAsync(
      "EmbeddingStatusChanged",
      repository.Name,
      status,
      message ?? $"Repository {repository.Name} status changed to {status}",
      cancellationToken
    );
  }
}
