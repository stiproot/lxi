using Newtonsoft.Json.Linq;

namespace Abstractions;

public interface IAuthService
{
  Task<JObject> ExchangeCodeForToken(string code, string nonce);
  Task<JObject> RefreshToken(string refreshToken);
}