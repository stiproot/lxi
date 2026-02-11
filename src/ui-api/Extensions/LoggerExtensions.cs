namespace Extensions;

public static class LoggerExtensions
{
  private const string DefaultGenericDebug = "{MethodName}. {Message}";
  private const string DefaultGenericInformation = "{MethodName} INFORMATION. Additional: {AdditionalInformation}";
  private const string DefaultGenericWarning = "{MethodName} WARNING. Additional: {AdditionalInformation}";
  private const string DefaultGenericError = "{MethodName} ERROR. Additional: {AdditionalInformation}";
  private const string DefaultMethodStartTemplate = "{MethodName} START. {AdditionalInfo}";
  private const string DefaultMethodEndTemplate = "{MethodName} END.";
  private const string DefaultNoChatFoundTemplate = "No chat found for the provided chat id: {ChatId}";

  private static readonly Action<ILogger, string, string, Exception?> GenericDebug =
    LoggerMessage.Define<string, string>(
      LogLevel.Debug,
      new EventId((int)Codes.DebugMessage),
      DefaultGenericDebug
    );

  private static readonly Action<ILogger, string, string, Exception?> GenericInformation =
    LoggerMessage.Define<string, string>(
      LogLevel.Information,
      new EventId((int)Codes.InformationalMessage),
      DefaultGenericInformation
    );

  private static readonly Action<ILogger, string, string, Exception?> GenericWarning =
    LoggerMessage.Define<string, string>(
      LogLevel.Warning,
      new EventId((int)Codes.WarningMessage),
      DefaultGenericWarning
    );

  private static readonly Action<ILogger, string, string, Exception?> GenericError =
    LoggerMessage.Define<string, string>(
      LogLevel.Error,
      new EventId((int)Codes.ErrorMessage),
      DefaultGenericError
    );

  private static readonly Action<ILogger, string, string?, Exception?> MethodStartInformation =
    LoggerMessage.Define<string, string?>(
      LogLevel.Information,
      new EventId((int)Codes.InformationalMessage),
      DefaultMethodStartTemplate
    );

  private static readonly Action<ILogger, string, Exception?> MethodEndInformation =
    LoggerMessage.Define<string>(
      LogLevel.Information,
      new EventId((int)Codes.InformationalMessage),
      DefaultMethodEndTemplate
    );

  private static readonly Action<ILogger, string, Exception?> NoChatFoundWarning =
    LoggerMessage.Define<string>(
      LogLevel.Warning,
      new EventId((int)Codes.NoChatFound, nameof(ChatsController.GetChatById)),
      DefaultNoChatFoundTemplate
    );

  public static void LogGenericDebug(this ILogger @this, string methodName, string message, Exception? ex = null) => GenericDebug(@this, methodName, message, ex);
  public static void LogGenericInformation(this ILogger @this, string methodName, string additionalInfo = "", Exception? ex = null) => GenericInformation(@this, methodName, additionalInfo, ex);
  public static void LogGenericWarning(this ILogger @this, string methodName, string additionalInfo = "", Exception? ex = null) => GenericWarning(@this, methodName, additionalInfo, ex);
  public static void LogGenericError(this ILogger @this, string methodName, string additionalInfo = "", Exception? ex = null) => GenericError(@this, methodName, additionalInfo, ex);
  public static void LogMethodStart(this ILogger @this, string methodName, string? additionalInfo = null, Exception? ex = null) => MethodStartInformation(@this, methodName, additionalInfo, ex);
  public static void LogMethodEnd(this ILogger @this, string methodName, Exception? ex = null) => MethodEndInformation(@this, methodName, ex);
  public static void LogNoChatFoundWarning(this ILogger @this, string chatId, Exception? ex = null) => NoChatFoundWarning(@this, chatId, ex);
}