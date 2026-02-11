using System.ComponentModel.DataAnnotations;

namespace Models;

public class RefreshTokenRequest
{
  [Required]
  public required string RefreshToken { get; init; }
}
