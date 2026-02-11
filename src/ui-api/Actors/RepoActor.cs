using System.Diagnostics.CodeAnalysis;
using Dapr.Actors.Runtime;

namespace Actors;

/// <summary>
/// Represents the actor responsible for managing the state of repos.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="RepoActor"/> class.
/// </remarks>
/// <param name="host">The actor host.</param>
[ExcludeFromCodeCoverage]
public class RepoActor(ActorHost host) : BaseActor<BaseActorState>(host, DaprComponents.ActorStateStore), IRepoActor
{
  /// <summary>
  /// Gets the type of the actor.
  /// </summary>
  public static string ActorType => nameof(RepoActor);

  public async Task<Dictionary<string, RepositorySummary>> GetOrThrowDecompressedActorStateAsync()
  {
    return await GetOrThrowDecompressedActorStateAsync<Dictionary<string, RepositorySummary>>();
  }

  public async Task AddCompressedActorStateAsync(IDictionary<string, RepositorySummary> repos)
  {
    await SetCompressedActorStateAsync(repos);
  }
}
