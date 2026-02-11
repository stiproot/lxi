namespace Models.Lattice;

public class ChatMessageContent
{
  [JsonPropertyName("type")]
  public required string Type { get; set; }

  [JsonPropertyName("text")]
  public string? Text { get; set; }

  [JsonPropertyName("image_url")]
  public ImageUrl? ImageUrl { get; set; }

  [JsonPropertyName("parameters")]
  public Dictionary<string, object>? Parameters { get; set; }

  [JsonPropertyName("condition")]
  public Condition? Condition { get; set; }
}