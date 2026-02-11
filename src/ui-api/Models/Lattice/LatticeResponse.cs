namespace Models.Lattice;

public class LatticeResponse
{
  [JsonPropertyName("messages")]
  public required LatticeChatMessage Messages { get; init; }
}
