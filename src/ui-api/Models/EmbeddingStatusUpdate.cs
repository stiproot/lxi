namespace Models;

public class EmbeddingStatusUpdate
{
  public required string RepositoryName { get; set; }
  public required string Status { get; set; }
  public string? Message { get; set; }
}
