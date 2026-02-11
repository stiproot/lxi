namespace Models.Core;

public class QryData
{
  [JsonPropertyName("message_history")]
  public required IEnumerable<BaseLangchainMessage> MessageHistory { get; init; }
}
