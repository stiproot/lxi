namespace Models;

public class ChatMessageRequest
{
  public required string Sender { get; init; }
  public required string Content { get; init; }
}
