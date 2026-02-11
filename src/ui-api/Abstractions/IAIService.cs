namespace Abstractions;

public interface IAiService
{
  Task<AgentResult> QueryAgentAsync(
    QueryAiAgentRequest request,
    string userId,
    CancellationToken cancellationToken
  );

  Task EmbedRepositoryAsync(
    CmdRequest request,
    CancellationToken cancellationToken
  );
}
