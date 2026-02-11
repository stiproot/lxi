namespace Models.Actors;

public class ChatSummary
{
  public required string ChatId { get; set; }
  public required string ChatStatus { get; set; }
  public bool IsPinned { get; set; }
}