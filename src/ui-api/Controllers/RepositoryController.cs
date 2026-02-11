using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace Controllers;

[ApiController]
[Route("api/[controller]")]
public class RepositoriesController(
  ILogger<RepositoriesController> logger,
  IDataService dataService
) : ControllerBase
{
  private readonly ILogger<RepositoriesController> _logger = logger;
  private readonly IDataService _dataService = dataService;

  [HttpGet]
  public async Task<ActionResult<IEnumerable<RepositorySummary>>> GetRepositories(CancellationToken cancellationToken)
  {
    _logger.LogMethodStart(nameof(GetRepositories));

    cancellationToken.ThrowIfCancellationRequested();

    try
    {
      IEnumerable<RepositorySummary> repositories = await _dataService.GetRepositoriesAsync();
      return Ok(repositories);
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(GetRepositories), "Error occurred while fetching repositories", ex);
      return StatusCode(500, $"Internal server error: {ex.Message}");
    }
  }

  [HttpGet("{repositoryName}")]
  public async Task<ActionResult<string>> GetRepositoryInfo([FromRoute] string repositoryName)
  {
    _logger.LogMethodStart(nameof(GetRepositoryInfo));

    try
    {
      string? repositoryInfo = await _dataService.GetRepositoryInfoAsync(repositoryName);
      if (repositoryInfo is null)
      {
        _logger.LogGenericWarning(nameof(GetRepositoryInfo), $"Repository {repositoryName} not found");
        return NotFound();
      }
      return Ok(repositoryInfo);
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(GetRepositoryInfo), $"Error occurred while fetching info for repository {repositoryName}", ex);
      return StatusCode(500, $"Internal server error: {ex.Message}");
    }
  }

  [HttpGet("{repositoryId}/files")]
  public async Task<ActionResult<string>> GetRepositoryFiles(
    [FromRoute] string repositoryId,
    CancellationToken cancellationToken
  )
  {
    _logger.LogMethodStart(nameof(GetRepositoryFiles));

    cancellationToken.ThrowIfCancellationRequested();

    try
    {
      string? repositoryFiles = await _dataService.GetRepositoryFilesAsync(repositoryId);
      if (repositoryFiles is null)
      {
        _logger.LogGenericWarning(nameof(GetRepositoryFiles), $"Files for repository {repositoryId} not found");
        return NotFound();
      }
      return Ok(repositoryFiles);
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(GetRepositoryFiles), $"Error occurred while fetching files for repository {repositoryId}", ex);
      return StatusCode(500, $"Internal server error: {ex.Message}");
    }
  }

  [HttpGet("{repositoryId}/files/{filePath}")]
  public async Task<ActionResult<string>> GetRepositoryFileContent(
    [FromRoute] string repositoryId,
    [FromRoute] string filePath,
    CancellationToken cancellationToken
  )
  {
    _logger.LogMethodStart(nameof(GetRepositoryFileContent));

    cancellationToken.ThrowIfCancellationRequested();

    try
    {
      string fileContent = await _dataService.GetRepositoryFileContentAsync(repositoryId, filePath);
      return Ok(fileContent);
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(GetRepositoryFileContent), $"Error occurred while fetching file content for {filePath} in repository {repositoryId}", ex);
      return StatusCode(500, $"Internal server error: {ex.Message}");
    }
  }

  [HttpPost("embed")]
  public async Task<ActionResult> EmbedRepository(
    [FromBody][Required] RepositorySummary repository,
    CancellationToken cancellationToken
  )
  {
    _logger.LogMethodStart(nameof(EmbedRepository));

    cancellationToken.ThrowIfCancellationRequested();

    try
    {
      await _dataService.TryEmbedRepositoryAsync(repository, cancellationToken);

      return Accepted();
    }
    catch (TaskCanceledException ex)
    {
      string message = $"The embedding operation for repository {repository?.Name} timed out after 30 minutes. This could be due to the repository size or system load. Please try again later.";
      _logger.LogGenericError(nameof(EmbedRepository), message, ex);
      return StatusCode(StatusCodes.Status504GatewayTimeout, new { error = message });
    }
    catch (InvalidOperationException ex)
    {
      _logger.LogGenericError(nameof(EmbedRepository), ex: ex);
      return Conflict(ex.Message);
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(EmbedRepository), "Error occurred while adding repository", ex);
      return StatusCode(500, $"Internal server error: {ex.Message}");
    }
  }

  [HttpGet("{repositoryName}/status")]
  public async Task<ActionResult<string>> GetRepositoryStatus([FromRoute] string repositoryName)
  {
    _logger.LogMethodStart(nameof(GetRepositoryStatus));

    try
    {
      string? status = await _dataService.GetRepositoryEmbeddingStatusAsync(repositoryName);
      if (status is null)
      {
        return NotFound($"Status not found for repository {repositoryName}");
      }
      return Ok(new { status });
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(GetRepositoryStatus), $"Error occurred while fetching status for repository {repositoryName}", ex);
      return StatusCode(500, $"Internal server error: {ex.Message}");
    }
  }

  [HttpPost("status")]
  public async Task<IActionResult> GetRepositoriesStatus(
    [FromBody][Required] GetRepositoryStatusRequest request,
    CancellationToken cancellationToken
  )
  {
    _logger.LogMethodStart(nameof(GetRepositoriesStatus));

    cancellationToken.ThrowIfCancellationRequested();

    try
    {
      IEnumerable<RepositorySummary> repos = await _dataService.GetRepositoriesEmbeddingStatusAsync(request.RepoNames);
      return Ok(repos);
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(GetRepositoriesStatus), "Error occurred while fetching repositories status", ex);
      return StatusCode(500, $"Internal server error: {ex.Message}");
    }
  }

  [HttpPost("{repositoryName}/broadcast")]
  public async Task<ActionResult> UpdateWorkflowStatus(
    [FromRoute] string repositoryName,
    [FromBody][Required] EmbeddingStatusUpdate update,
    CancellationToken cancellationToken
  )
  {
    _logger.LogMethodStart(nameof(UpdateWorkflowStatus));

    cancellationToken.ThrowIfCancellationRequested();

    try
    {
      await _dataService.UpdateRepositoryStatusAsync(repositoryName, update.Status);
      await _dataService.BroadcastRepositoryStatusAsync(repositoryName, update.Status, update.Message);

      return Ok();
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(UpdateWorkflowStatus), $"Error updating workflow status for repository {repositoryName}", ex);
      return StatusCode(500, $"Internal server error: {ex.Message}");
    }
  }
}
