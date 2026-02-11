namespace Models;

public class EmbeddingResult
{
  public bool Success { get; set; }
  public string? ErrorMessage { get; set; }
  public List<string> Ids { get; set; } = [];
}
