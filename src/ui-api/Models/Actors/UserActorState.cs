using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace Models.Actors;

/// <summary>
/// Represents the runtime-state of a user.
/// </summary>
[ExcludeFromCodeCoverage]
public record UserActorState : BaseActorState
{
  /// <summary>
  /// A list of chat IDs that the user belongs to.
  /// </summary>
  [JsonProperty("chats")]
  public List<ChatSummary> Chats { get; init; } = [];

  /// <summary>
  /// The user associated with the actor.
  /// </summary>
  public required UserInfo User { get; set; }
}
