using Microsoft.AspNetCore.SignalR;

namespace Hubs;

// Temporarily remove [Authorize]
public class RepositoryStatusHub(ILogger<RepositoryStatusHub> logger) : Hub
{
  private readonly ILogger<RepositoryStatusHub> _logger = logger;

  public override async Task OnConnectedAsync()
  {
    _logger.LogMethodStart(nameof(OnConnectedAsync), $"Client connected to RepositoryStatusHub: {Context.ConnectionId}");
    await base.OnConnectedAsync();
  }

  public override async Task OnDisconnectedAsync(Exception? exception)
  {
    _logger.LogMethodStart(nameof(OnDisconnectedAsync), $"Client disconnected from RepositoryStatusHub: {Context.ConnectionId}. Exception: {exception?.Message}");
    await base.OnDisconnectedAsync(exception);
  }
}