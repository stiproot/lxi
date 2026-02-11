namespace Models;

public class RepositoriesResponse
{
  public int Count { get; set; }
  public IEnumerable<RepositorySummary> Value { get; init; } = [];
}