namespace Abstractions;

public interface IDataService
{
  Task TryEmbedRepositoryAsync(RepositorySummary repository, CancellationToken cancellationToken);
  Task SyncRepositoriesAsync();
  Task ResetEmbeddingStatusAsync();
  Task<IEnumerable<RepositorySummary>> GetRepositoriesAsync();
  Task<IEnumerable<RepositorySummary>> GetRepositoriesEmbeddingStatusAsync(List<string> repoNames);
  Task BroadcastRepositoryStatusAsync(string repositoryName, string status, string? message = null);
  Task UpdateRepositoryStatusAsync(string repositoryName, string status);

  Task<string> GetRepositoryInfoAsync(string repositoryName);
  Task<string> GetRepositoryFilesAsync(string repositoryName);
  Task<string> GetRepositoryFileContentAsync(string repositoryName, string filePath);
  Task<string> GetRepositoryEmbeddingStatusAsync(string repositoryName);
}
