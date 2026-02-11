namespace Models;

public class EmbedRepositoryRequest
{
  public required string RepoName { get; init; }
  public string? UserId { get; init; }
}