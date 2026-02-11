using System.ComponentModel.DataAnnotations;

namespace Models;

public class ChatMessage
{
  [Key]
  public required string Id { get; set; }

  [Required]
  public required string ChatId { get; set; }

  [Required]
  public required string Sender { get; set; }

  [Required]
  public required string Content { get; set; }

  public required DateTime Timestamp { get; set; } = DateTime.UtcNow;

  public required string Type { get; set; } = ChatMessageType.Message;
}
