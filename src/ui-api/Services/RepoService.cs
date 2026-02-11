using Dapr.Actors.Client;

namespace Services;

public class RepoService(IActorProxyFactory actorProxyFactory) : IRepoService
{
  private readonly IActorProxyFactory _actorProxyFactory = actorProxyFactory;

  private IRepoActor CreateRepoActor(string id) => _actorProxyFactory.CreateActorProxy<IRepoActor>(id.ToActorId(), RepoActor.ActorType);

  public async Task<IDictionary<string, RepositorySummary>> GetRepositoriesAsync()
  {
    IRepoActor actor = CreateRepoActor(StateKeys.Repos);

    Dictionary<string, RepositorySummary> keyValuePairs = await actor.GetOrThrowDecompressedActorStateAsync();

    return keyValuePairs;
  }

  public async Task<RepositorySummary> GetRepositoryAsync(string repositoryName)
  {
    IRepoActor actor = CreateRepoActor(StateKeys.Repos);

    Dictionary<string, RepositorySummary> keyValuePairs = await actor.GetOrThrowDecompressedActorStateAsync();

    return keyValuePairs[repositoryName];
  }

  public async Task UpdateRepositoryAsync(RepositorySummary repository)
  {
    IRepoActor actor = CreateRepoActor(StateKeys.Repos);

    Dictionary<string, RepositorySummary> keyValuePairs = await actor.GetOrThrowDecompressedActorStateAsync();

    keyValuePairs[repository.Name] = repository;

    await actor.AddCompressedActorStateAsync(keyValuePairs);
  }

  public async Task UpdateRepositoryStatusAsync(
    string repoName,
    string embeddingStatus
  )
  {
    IRepoActor actor = CreateRepoActor(StateKeys.Repos);

    Dictionary<string, RepositorySummary> keyValuePairs = await actor.GetOrThrowDecompressedActorStateAsync();

    keyValuePairs[repoName].EmbeddingStatus = embeddingStatus;

    await actor.AddCompressedActorStateAsync(keyValuePairs);
  }

  public async Task AddReposAsync(IDictionary<string, RepositorySummary> keyValuePairs)
  {
    IRepoActor actor = CreateRepoActor(StateKeys.Repos);

    await actor.AddCompressedActorStateAsync(keyValuePairs);
  }
}
