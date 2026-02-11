using System.Diagnostics.CodeAnalysis;

namespace Diagnostics;

/// <summary>
///   Provides detailed descriptions for diagnostic codes.
/// </summary>
[ExcludeFromCodeCoverage]
public static class CodeDescriptions
{
  /// <summary>
  ///   Get a description for the supplied diagnostic code.
  /// </summary>
  /// <param name="code">The diagnostic code to describe.</param>
  /// <returns>A string containing details about the diagnostic code, or null if the code is not found.</returns>
  public static string Get(Enum code)
  {
    return (Codes)code switch
    {
      Codes.KafkaError => "Kafka error.",
      Codes.StatestoreError => "Statestore error.",
      Codes.NoChatFound => "No chat found.",
      _ => string.Empty
    };
  }
}
