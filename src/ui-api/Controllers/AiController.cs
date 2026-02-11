using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Controllers;

[Authorize] // Changed from AllowAnonymous to Authorize since we need user context
[ApiController]
[Route("api/[controller]")]
public class AiController(
  ILogger<AiController> logger,
  IAiService aiService
) : ControllerBase
{
  private readonly ILogger<AiController> _logger = logger;
  private readonly IAiService _aiService = aiService;

  private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

  [HttpPost("agent/query")]
  [ProducesResponseType(typeof(AgentResult), (int)HttpStatusCode.OK)]
  [ProducesResponseType((int)HttpStatusCode.BadRequest)]
  [ProducesResponseType((int)HttpStatusCode.UnprocessableEntity)]
  public async Task<IActionResult> QueryAiAgent(
    [FromBody][Required] QueryAiAgentRequest request,
    CancellationToken cancellationToken
  )
  {
    _logger.LogMethodStart(nameof(QueryAiAgent));

    try
    {
      string userId = GetUserId();
      AgentResult response = await _aiService.QueryAgentAsync(request, userId, cancellationToken);
      return Ok(response);
    }
    catch (InvalidOperationException ex)
    {
      _logger.LogGenericError(nameof(QueryAiAgent), "AI service rejected the request", ex);
      return UnprocessableEntity(new { error = ex.Message });
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(QueryAiAgent), "Error occurred while getting AI response", ex);
      return StatusCode((int)HttpStatusCode.InternalServerError, "An error occurred while processing your request.");
    }
  }
}
