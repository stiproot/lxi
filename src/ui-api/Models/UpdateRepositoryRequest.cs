using System.ComponentModel.DataAnnotations;

namespace Models;

public class UpdateRepositoryRequest
{
  [Required]
  public required string RepositoryName { get; set; }
}