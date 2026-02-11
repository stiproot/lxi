using System.ComponentModel.DataAnnotations;

namespace Models;

public class RepositorySummary
{
  [Required]
  public required string Id { get; set; }

  [Required]
  public required string Name { get; set; }

  public DateTime LastModified { get; set; } = DateTime.UtcNow;

  public bool IsDisabled { get; init; }

  [Required]
  public required string EmbeddingStatus { get; set; } = EmbeddingStatuses.NotStarted;
}