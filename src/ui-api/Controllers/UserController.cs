using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Net;
using System.ComponentModel.DataAnnotations;

namespace Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController(
  ILogger<UserController> logger,
  IUserService userService
) : ControllerBase
{
  private readonly ILogger<UserController> _logger = logger;
  private readonly IUserService _userService = userService;

  [Authorize]
  [HttpGet]
  public async Task<IActionResult> GetAllUsers()
  {
    _logger.LogMethodStart(nameof(GetAllUsers));

    try
    {
      IEnumerable<UserInfo> users = await _userService.GetAllUsersAsync();
      return Ok(users);
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(GetAllUsers), "Error occurred while fetching users", ex);
      return StatusCode(500, "An error occurred while processing your request");
    }
  }

  [Authorize]
  [HttpGet("{id}")]
  [ProducesResponseType(typeof(UserInfo), (int)HttpStatusCode.OK)]
  [ProducesResponseType((int)HttpStatusCode.NotFound)]
  public async Task<IActionResult> GetUserById([FromRoute] string id)
  {
    _logger.LogMethodStart(nameof(GetUserById));

    try
    {
      UserInfo? user = await _userService.TryGetUserByIdAsync(id);
      if (user is null)
      {
        _logger.LogGenericWarning(nameof(GetUserById), $"User with ID {id} not found in actor state or legacy storage");
        return NotFound();
      }
      return Ok(user);
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(GetUserById), $"Error accessing user with ID {id}", ex);
      return StatusCode(500, "An error occurred while processing your request");
    }
  }

  [Authorize]
  [HttpGet("me")]
  public async Task<IActionResult> GetCurrentUser()
  {
    _logger.LogMethodStart(nameof(GetCurrentUser));

    string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(userId))
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

  [Authorize]
  [HttpPost]
  public async Task<IActionResult> CreateUser([FromBody][Required] UserInfo user)
  {
    _logger.LogMethodStart(nameof(CreateUser));

    try
    {
      string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId) || userId != user.Id)
      {
        return BadRequest("User ID mismatch");
      }

      await _userService.CreateUserAsync(user);

      return Created();
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(CreateUser), "Error creating user", ex);
      return StatusCode(500, "Error creating user");
    }
  }

  [Authorize]
  [HttpPut("{id}")]
  public async Task<IActionResult> UpdateUser(
    [FromRoute] string id,
    [FromBody][Required] UserInfo user
  )
  {
    _logger.LogMethodStart(nameof(UpdateUser));

    if (id != user.Id)
    {
      return BadRequest();
    }

    await _userService.UpdateUserAsync(user);

    return Ok(user);
  }

  [Authorize]
  [HttpDelete("{id}")]
  public async Task<IActionResult> DeleteUser([FromRoute] string id)
  {
    _logger.LogMethodStart(nameof(DeleteUser));

    bool result = await _userService.DeleteUserAsync(id);
    if (!result)
    {
      return NotFound();
    }

    return NoContent();
  }

  [Authorize]
  [HttpGet("search")]
  public async Task<IActionResult> SearchUsers(
    [FromQuery] string q,
    CancellationToken cancellationToken
  )
  {
    _logger.LogMethodStart(nameof(SearchUsers));

    cancellationToken.ThrowIfCancellationRequested();

    try
    {
      IEnumerable<UserInfo> users = await _userService.SearchUsersAsync(q);
      return Ok(users);
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(SearchUsers), "Error occurred while searching users", ex);
      return StatusCode(500, "An error occurred while searching users");
    }
  }
}
