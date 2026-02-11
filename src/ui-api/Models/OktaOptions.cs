namespace Models;

public class OktaOptions
{
  public required string Issuer { get; init; }
  public required string ClientId { get; init; }
  public required string ClientSecret { get; init; }
  public required string TokenUri { get; init; }
  public required string RedirectUri { get; init; }
}
