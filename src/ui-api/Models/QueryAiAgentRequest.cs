namespace Models;

public class QueryAiAgentRequest
{
  public required string RepoName { get; init; }
  public required string ChatId { get; init; }
  public required string Query { get; init; }
}