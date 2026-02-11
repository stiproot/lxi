namespace Diagnostics;

/// <summary>
///   Canonical list of Diagnostic Codes emitted from Lxi's UI API.
/// </summary>
public enum Codes
{
  DebugMessage = 2000,
  InformationalMessage = 2001,
  WarningMessage = 2002,
  ErrorMessage = 2003,

  /// <summary>
  /// Statestore error.
  /// </summary>
  StatestoreError = 30001,

  /// <summary>
  /// Kafka error.
  /// </summary>
  KafkaError = 30002,

  /// <summary>
  /// No chat found.
  /// </summary>
  NoChatFound = 50001
}