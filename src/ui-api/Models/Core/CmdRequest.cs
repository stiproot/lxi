namespace Models.Core;

public class CmdRequest
{
  [JsonPropertyName("cmd_type")]
  public required string CmdType { get; init; }

  [JsonPropertyName("cmd_metadata")]
  public required CmdMetadata CmdMetadata { get; init; }

  [JsonPropertyName("cmd_data")]
  public required CmdData CmdData { get; init; }

  [JsonPropertyName("cmd_result")]
  public Dictionary<string, object>? CmdResult { get; init; }
}