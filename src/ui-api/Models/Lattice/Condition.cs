namespace Models.Lattice;

public class Condition
{
  [JsonPropertyName("choice")]
  public required string Choice { get; init; }

  [JsonIgnore]
  public static readonly List<string> DefaultOptions = ["accept", "reject"];

  [JsonPropertyName("options")]
  public List<string> Options { get; set; } = DefaultOptions;
}