namespace Models.Lattice;

public class LatticeGatewayRequest
{
  [JsonPropertyName("messages")]
  public required LatticeChatMessage Messages { get; init; }

  [JsonPropertyName("history")]
  public List<LatticeChatMessage> History { get; init; } = [];

  [JsonPropertyName("session_id")]
  public string? SessionId { get; init; }
}