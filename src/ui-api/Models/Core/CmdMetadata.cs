namespace Models.Core;

public class CmdMetadata
{
  [JsonPropertyName("repo_name")]
  public required string RepoName { get; init; }

  [JsonPropertyName("user_id")]
  public string? UserId { get; init; }

  [JsonPropertyName("cmd_post_op")]
  public required CmdPostOp CmdPostOp { get; init; }
}

public class CmdPostOp
{
  [JsonPropertyName("cmd_result_broadcasts")]
  public IEnumerable<CmdResultBroadcast> CmdResultBroadCasts { get; init; } = [];
}

public class CmdResultBroadcast
{
  [JsonPropertyName("url")]
  public required string Url { get; init; }

  [JsonPropertyName("static_payload")]
  public EmbeddingStatusUpdate? StaticPayload { get; init; }
}