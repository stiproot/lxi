using Dapr.Actors;

namespace Abstractions;

/// <summary>
/// Defines the interface for a UserActor, managing the state of a user.
/// </summary>
public interface IRepoActor : IActor
{
  /// <summary>
  /// Tries to retrieve the current state of the user actor.
  /// </summary>
  /// <returns>The current <see cref="BaseActorState"/> of the user actor.</returns>
  Task<(bool, BaseActorState?)> TryGetActorStateAsync();

  /// <summary>
  /// Inititiatlizes a user actor.
  /// </summary>
  /// <returns>The current <see cref="BaseActorState"/> of the user actor.</returns>
  Task InitActorStateAsync(BaseActorState actorState);

  /// <summary>
  /// Throws an exception if the user actor state is not found.
  /// </summary>
  /// <returns>The current <see cref="BaseActorState"/> of the user actor.</returns>
  Task<BaseActorState> GetOrThrowActorStateAsync();

  /// <summary>
  /// Updates the state of the user actor with the provided state.
  /// </summary>
  /// <param name="state">The new state to be set for the user actor.</param>
  /// <returns>A task representing the asynchronous operation.</returns>
  Task SetActorStateAsync(BaseActorState state);

  Task<Dictionary<string, RepositorySummary>> GetOrThrowDecompressedActorStateAsync();
  Task AddCompressedActorStateAsync(IDictionary<string, RepositorySummary> repos);
}
