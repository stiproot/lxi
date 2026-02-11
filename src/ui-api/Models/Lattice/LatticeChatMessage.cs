namespace Models.Lattice;

public class LatticeChatMessage
{
  [JsonPropertyName("name")]
  public required string Name { get; set; }

  [JsonPropertyName("role")]
  public required string Role { get; set; }

  [JsonPropertyName("content")]
  public required List<ChatMessageContent> Content { get; set; }
}