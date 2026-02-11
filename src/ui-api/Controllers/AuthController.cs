using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Newtonsoft.Json.Linq;

namespace Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
  IAuthService authService,
  IUserService userService
) : ControllerBase
{
  private readonly IAuthService _authService = authService;
  private readonly IUserService _userService = userService;

  [HttpPost("token/exchange")]
  public async Task<IActionResult> ExchangeCodeForToken([FromBody][Required] ExchangeCodeRequest request)
  {
    JObject result = await _authService.ExchangeCodeForToken(request.Code, request.Nonce);
    return Content(result.ToString(), "application/json");
  }

  [HttpPost("token/refresh")]
  public async Task<IActionResult> RefreshToken([FromBody][Required] RefreshTokenRequest request)
  {
    JObject result = await _authService.RefreshToken(request.RefreshToken);
    return Content(result.ToString(), "application/json");
  }

  [Authorize]
  [HttpGet("me")]
  public async Task<IActionResult> GetCurrentUser()
  {
    string? userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
    if (userId is null)
    {
      return Unauthorized();
    }

    UserInfo? user = await _userService.TryGetUserByIdAsync(userId);
    if (user is null)
    {
      return NotFound();
    }

    return Ok(user);
  }
}