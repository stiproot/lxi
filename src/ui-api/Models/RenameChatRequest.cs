using System.ComponentModel.DataAnnotations;

namespace Models;

public class RenameChatRequest
{
  [Required]
  public required string NewName { get; set; }
}