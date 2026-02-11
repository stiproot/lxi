using System.Diagnostics.CodeAnalysis;
using Dapr.Actors.Runtime;

namespace Actors;

/// <summary>
/// Represents the actor responsible for managing the state of a campaign.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="ChatActor"/> class.
/// </remarks>
/// <param name="host">The actor host.</param>
[ExcludeFromCodeCoverage]
public class ChatActor(ActorHost host) : BaseActor<ChatActorState>(host, DaprComponents.ActorStateStore), IChatActor
{
  /// <summary>
  /// Gets the type of the actor.
  /// </summary>
  public static string ActorType => nameof(ChatActor);

  public async Task<bool> AddParticipantAsync(string userId, string participantId)
  {
    ChatActorState chat = await GetOrThrowActorStateAsync();

    if (chat.OwnerId != userId || chat.ParticipantIds.Contains(participantId))
    {
      return false;
    }

    chat.ParticipantIds.Add(participantId);
    chat.LastModified = DateTime.UtcNow;
    await SetActorStateAsync(chat);
    return true;
  }

  public async Task<bool> RemoveParticipantAsync(string userId, string participantId)
  {
    ChatActorState chat = await GetOrThrowActorStateAsync();

    if (chat.OwnerId != userId || participantId == chat.OwnerId || !chat.ParticipantIds.Contains(participantId))
    {
      return false;
    }

    chat.ParticipantIds.Remove(participantId);
    chat.LastModified = DateTime.UtcNow;
    await SetActorStateAsync(chat);
    return true;
  }

  public override async Task DeleteActorStateAsync()
  {
    await StateManager.RemoveStateAsync(DaprComponents.ActorStateStore);
  }
}
