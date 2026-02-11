using Dapr.Actors;

namespace Abstractions;

/// <summary>
/// Defines the interface for the chat actor.
/// </summary>
/// <remarks>
/// The chat actor is responsible for managing chat conversations between users.
/// </remarks>
public interface IChatActor : IActor
{
  /// <summary>
  /// Tries to retrieve the current state of the campaign actor.
  /// </summary>
  /// <returns>The current <see cref="ChatActorState"/> of the campaign actor.</returns>
  Task<(bool, ChatActorState?)> TryGetActorStateAsync();

  /// <summary>
  /// Initializes the state of the campaign actor with the provided state object.
  /// </summary>
  /// <returns>The current <see cref="ChatActorState"/> of the campaign actor.</returns>
  Task InitActorStateAsync(ChatActorState actorState);

  /// <summary>
  /// Throws an exception if the actor state is not found.
  /// </summary>
  /// <returns>The current <see cref="ChatActorState"/> of the campaign actor.</returns>
  Task<ChatActorState> GetOrThrowActorStateAsync();

  /// <summary>
  /// Updates the state of the campaign actor with the provided state object.
  /// </summary>
  /// <param name="state">The new state of the campaign actor.</param>
  Task SetActorStateAsync(ChatActorState state);

  /// <summary>
  /// Adds a participant to a chat conversation asynchronously.
  /// </summary>
  /// <param name="userId">The unique identifier of the user who is adding the participant.</param>
  /// <param name="participantId">The unique identifier of the participant to be added to the chat.</param>
  /// <returns>A Task representing the asynchronous operation, containing a boolean indicating whether the participant was successfully added.</returns>
  Task<bool> AddParticipantAsync(string userId, string participantId);

  /// <summary>
  /// Removes a participant from a chat conversation asynchronously.
  /// </summary>
  /// <param name="userId">The unique identifier of the user who is removing the participant.</param>
  /// <param name="participantId">The unique identifier of the participant to be removed from the chat.</param>
  /// <returns>A Task representing the asynchronous operation, containing a boolean indicating whether the participant was successfully removed.</returns>
  Task<bool> RemoveParticipantAsync(string userId, string participantId);

  /// <summary>
  /// Deletes the chat actor state completely.
  /// </summary>
  /// <returns>A Task representing the asynchronous operation.</returns>
  Task DeleteActorStateAsync();
}
