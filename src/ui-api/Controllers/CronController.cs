using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Controllers;

[ApiController]
[Route("")]
public class CronController(
  ILogger<CronController> logger,
  IDataService dataService
) : ControllerBase
{
  private readonly ILogger<CronController> _logger = logger;
  private readonly IDataService _dataService = dataService;

  [AllowAnonymous]
  [HttpGet("cron-trigger-syncrepos")]
  public async Task<ActionResult> SyncRepositories(CancellationToken cancellationToken)
  {
    _logger.LogMethodStart(nameof(SyncRepositories));

    cancellationToken.ThrowIfCancellationRequested();

    try
    {
      await _dataService.SyncRepositoriesAsync();

      _logger.LogMethodEnd(nameof(SyncRepositories));

      return Ok();
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(SyncRepositories), "Error occurred while syncing repositories", ex);
      return StatusCode(500, $"Internal server error: {ex.Message}");
    }
  }

  [AllowAnonymous]
  [HttpGet("cron-trigger-resetembeddingstatus")]
  public async Task<ActionResult> ResetEmbeddingStatus(CancellationToken cancellationToken)
  {
    _logger.LogMethodStart(nameof(ResetEmbeddingStatus));

    cancellationToken.ThrowIfCancellationRequested();

    try
    {
      await _dataService.ResetEmbeddingStatusAsync();

      _logger.LogMethodEnd(nameof(ResetEmbeddingStatus));

      return Ok();
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(ResetEmbeddingStatus), "Error occurred while syncing repositories", ex);
      return StatusCode(500, $"Internal server error: {ex.Message}");
    }
  }
}