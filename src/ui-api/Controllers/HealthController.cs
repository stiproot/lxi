using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Controllers;

[ApiController]
[Route("")]
[AllowAnonymous]
public class HealthController() : ControllerBase
{
  [HttpGet]
  [Route("healthz")]
  public IActionResult GetHealthStatus() => Ok();
}
