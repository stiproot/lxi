using System.Diagnostics.CodeAnalysis;

namespace Models;

/// <summary>
/// Defines all properties of Actor configuration in Dapr.
/// See more here: https://docs.dapr.io/developing-applications/building-blocks/actors/actors-runtime-config/
/// </summary>
[ExcludeFromCodeCoverage]
public class ApiOptions
{
  /// <summary>
  /// The host URL for this API. Used for webhook callbacks.
  /// </summary>
  public required string HostUrl { get; init; }
}
