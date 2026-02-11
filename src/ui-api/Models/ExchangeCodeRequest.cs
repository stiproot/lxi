using System.ComponentModel.DataAnnotations;

namespace Models;

public class ExchangeCodeRequest
{
  [Required]
  public required string Code { get; init; }

  [Required]
  public required string Nonce { get; init; }
}