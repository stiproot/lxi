namespace Models.Core;

public class QryRequest
{
  [JsonPropertyName("qry_metadata")]
  public required QryMetadata QryMetadata { get; init; }

  [JsonPropertyName("qry_data")]
  public required QryData QryData { get; init; }
}

public class QryResponse
{
  [JsonPropertyName("output")]
  public required List<QryMessage> Output { get; init; }
}

public class QryMessage
{
  [JsonPropertyName("type")]
  public required string Type { get; init; }
  
  [JsonPropertyName("content")]
  public required string Content { get; init; }
}
