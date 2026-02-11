using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Services;

public class AuthService(
  IOptions<OktaOptions> options,
  IHttpClientFactory httpClientFactory,
  ILogger<AuthService> logger,
  IUserService userService) : IAuthService
{
  private readonly IOptions<OktaOptions> _options = options;
  private readonly IHttpClientFactory _httpClientFactory = httpClientFactory;
  private readonly ILogger<AuthService> _logger = logger;
  private readonly IUserService _userService = userService;

  public async Task<JObject> ExchangeCodeForToken(
    string code,
    string nonce
  )
  {
    _logger.LogMethodStart(nameof(ExchangeCodeForToken));

    ArgumentNullException.ThrowIfNull(code);
    ArgumentNullException.ThrowIfNull(nonce);

    HttpClient client = _httpClientFactory.CreateClient();
    var data = new StringContent(
        $"grant_type=authorization_code&redirect_uri={_options.Value.RedirectUri}&code={code}&client_id={_options.Value.ClientId}&client_secret={_options.Value.ClientSecret}",
        Encoding.UTF8, "application/x-www-form-urlencoded");

    HttpResponseMessage response = await client.PostAsync(_options.Value.TokenUri, data);
    string responseString = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
      _logger.LogGenericError(nameof(ExchangeCodeForToken), $"Token exchange failed with status code {response.StatusCode}. Response: {responseString}");
      throw new HttpRequestException($"Token exchange failed with status code {response.StatusCode}. Response: {responseString}");
    }

    var tokenResponse = JObject.Parse(responseString);

    string idToken = tokenResponse["id_token"]!.ToString();
    string accessToken = tokenResponse["access_token"]!.ToString();
    string refreshToken = tokenResponse["refresh_token"]!.ToString();

    if (string.IsNullOrEmpty(idToken) || string.IsNullOrEmpty(accessToken) || string.IsNullOrEmpty(refreshToken))
    {
      _logger.LogGenericError(nameof(ExchangeCodeForToken), $"Token response is missing one or more tokens. Response: {responseString}");
      throw new InvalidOperationException("Token response is missing one or more tokens.");
    }

    ClaimsPrincipal idTokenClaims = ValidateToken(idToken, _options.Value.ClientId, nonce);
    ClaimsPrincipal accessTokenClaims = ValidateToken(accessToken, "api://default");

    _logger.LogGenericDebug(nameof(ExchangeCodeForToken), $"ID Token: {idToken}");
    // Log the claims for debugging
    foreach (Claim claim in idTokenClaims.Claims)
    {
      _logger.LogGenericDebug(nameof(ExchangeCodeForToken), $"Claim: {claim.Type}={claim.Value}");
    }

    string? email = idTokenClaims.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
    string? name = idTokenClaims.FindFirst("name")?.Value;

    if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(name))
    {
      _logger.LogGenericError(nameof(ExchangeCodeForToken), "ID token is missing required claims.");
      throw new InvalidOperationException("ID token is missing required claims.");
    }

    var userData = new UserInfo
    {
      Id = email,
      Email = email,
      Name = name
    };

    await _userService.CreateUserAsync(userData);

    // Extract claims into a simple object, handling duplicate keys
    var idTokenClaimsObj = idTokenClaims.Claims
        .GroupBy(c => c.Type)
        .ToDictionary(g => g.Key, g => string.Join(", ", g.Select(c => c.Value)));

    var accessTokenClaimsObj = accessTokenClaims.Claims
        .GroupBy(c => c.Type)
        .ToDictionary(g => g.Key, g => string.Join(", ", g.Select(c => c.Value)));

    var responseObj = new JObject
    {
      ["status"] = "ok",
      ["tokens"] = new JObject
      {
        ["accessToken"] = new JObject
        {
          ["raw"] = accessToken,
          ["obj"] = JObject.FromObject(accessTokenClaimsObj)
        },
        ["idToken"] = new JObject
        {
          ["raw"] = idToken,
          ["obj"] = JObject.FromObject(idTokenClaimsObj)
        },
        ["refreshToken"] = refreshToken
      },
      ["usr"] = new JObject
      {
        ["email"] = email,
        ["name"] = name
      }
    };

    _logger.LogMethodEnd(nameof(ExchangeCodeForToken));

    return responseObj;
  }

  public async Task<JObject> RefreshToken(string refreshToken)
  {
    _logger.LogMethodStart(nameof(RefreshToken));

    ArgumentNullException.ThrowIfNull(refreshToken);

    HttpClient client = _httpClientFactory.CreateClient();
    var data = new StringContent(
        $"grant_type=refresh_token&client_id={_options.Value.ClientId}&client_secret={_options.Value.ClientSecret}&refresh_token={refreshToken}",
        Encoding.UTF8, "application/x-www-form-urlencoded");

    HttpResponseMessage response = await client.PostAsync(_options.Value.TokenUri, data);
    string responseString = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
      _logger.LogGenericError(nameof(RefreshToken), $"Refresh token request failed with status code {response.StatusCode}");
      throw new HttpRequestException($"Refresh token request failed with status code {response.StatusCode}");
    }

    var tokenResponse = JObject.Parse(responseString);

    string idToken = tokenResponse["id_token"]!.ToString();
    string accessToken = tokenResponse["access_token"]!.ToString();
    string newRefreshToken = tokenResponse["refresh_token"]!.ToString();

    ClaimsPrincipal idTokenClaims = ValidateToken(idToken, _options.Value.ClientId);
    ClaimsPrincipal accessTokenClaims = ValidateToken(accessToken, "api://default");

    return new JObject
    {
      ["status"] = "ok",
      ["accessToken"] = new JObject
      {
        ["raw"] = accessToken,
        ["obj"] = JObject.FromObject(accessTokenClaims)
      },
      ["idToken"] = new JObject
      {
        ["raw"] = idToken,
        ["obj"] = JObject.FromObject(idTokenClaims)
      },
      ["refreshToken"] = newRefreshToken
    };
  }

  private ClaimsPrincipal ValidateToken(
    string token,
    string audience,
    string? nonce = null
  )
  {
    ArgumentNullException.ThrowIfNull(token);
    ArgumentNullException.ThrowIfNull(audience);

    var tokenHandler = new JwtSecurityTokenHandler();
    var validationParameters = new TokenValidationParameters
    {
      ValidateIssuer = true,
      ValidIssuer = _options.Value.Issuer,
      ValidateAudience = true,
      ValidAudience = audience,
      ValidateLifetime = true,
      IssuerSigningKeyResolver = (token, securityToken, kid, parameters) =>
      {
        HttpClient client = _httpClientFactory.CreateClient();
        string keysUri = $"{_options.Value.Issuer}/v1/keys";
        HttpResponseMessage response = client.GetAsync(keysUri).Result;
        string keys = response.Content.ReadAsStringAsync().Result;

        _logger.LogGenericDebug(nameof(ValidateToken), $"JWKS response: {keys}");

        var jsonWebKeySet = new JsonWebKeySet(keys);
        return jsonWebKeySet.GetSigningKeys();
      }
    };

    if (!string.IsNullOrEmpty(nonce))
    {
      validationParameters.TokenDecryptionKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(nonce));
    }

    return tokenHandler.ValidateToken(token, validationParameters, out _);
  }
}
