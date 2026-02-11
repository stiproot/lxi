namespace Models.Lattice;

public class ImageUrl
{
  [JsonPropertyName("name")]
  public required string Name { get; init; }

  [JsonPropertyName("url")]
  public required string Url { get; set; }
}