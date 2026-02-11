namespace Models;

public class ChatMessageResponse
{
  public required string Id { get; init; }
  public required string ChatId { get; init; }
  public required string Sender { get; init; }
  public required string Content { get; init; }
  public DateTime Timestamp { get; init; }
}
