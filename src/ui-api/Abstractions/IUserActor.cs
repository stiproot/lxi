using Dapr.Actors;

namespace Abstractions;

/// <summary>
/// Defines the interface for a UserActor, managing the state of a user.
/// </summary>
public interface IUserActor : IActor
{
  /// <summary>
  /// Tries to retrieve the current state of the user actor.
  /// </summary>
  /// <returns>The current <see cref="UserActorState"/> of the user actor.</returns>
  Task<(bool, UserActorState?)> TryGetActorStateAsync();

  /// <summary>
  /// Inititiatlizes a user actor.
  /// </summary>
  /// <returns>The current <see cref="UserActorState"/> of the user actor.</returns>
  Task InitActorStateAsync(UserActorState actorState);

  /// <summary>
  /// Throws an exception if the user actor state is not found.
  /// </summary>
  /// <returns>The current <see cref="UserActorState"/> of the user actor.</returns>
  Task<UserActorState> GetOrThrowActorStateAsync();

  /// <summary>
  /// Updates the state of the user actor with the provided state.
  /// </summary>
  /// <param name="state">The new state to be set for the user actor.</param>
  /// <returns>A task representing the asynchronous operation.</returns>
  Task SetActorStateAsync(UserActorState state);
}
