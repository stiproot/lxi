namespace Models.Core;

public class AgentResult
{
  [JsonPropertyName("output")]
  public required string Output { get; init; }
}