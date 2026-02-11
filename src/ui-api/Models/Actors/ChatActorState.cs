using System.ComponentModel.DataAnnotations;

namespace Models.Actors;

public record ChatActorState : BaseActorState
{
  [Required]
  public required string Id { get; init; } = Guid.NewGuid().ToString();
  [Required]
  public required string Name { get; set; }
  [Required]
  public required string OwnerId { get; init; }
  public List<string> ParticipantIds { get; set; } = [];
  public List<ChatMessage> Messages { get; set; } = [];
  public DateTime LastModified { get; set; } = DateTime.UtcNow;
  public DateTime Timestamp { get; init; } = DateTime.UtcNow;
  public string? CurrentRepository { get; set; }
  public DateTime? LastRepositoryChange { get; set; }
  public bool IsDisabled { get; set; }

  /// <summary>
  /// Runtime property, set per user.
  /// </summary>
  public bool IsPinned { get; set; }

  public ChatActorState UpdateLastModified()
  {
    LastModified = DateTime.UtcNow;
    return this;
  }

  public ChatActorState UpdateLastRepositoryChange()
  {
    LastRepositoryChange = DateTime.UtcNow;
    return this;
  }
}
