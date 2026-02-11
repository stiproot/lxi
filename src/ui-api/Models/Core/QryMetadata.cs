namespace Models.Core;

public class QryMetadata
{
  [JsonPropertyName("repo_name")]
  public required string RepoName { get; init; }
}