namespace Abstractions;

/// <summary>
/// Provides a contract for publishing events.
/// </summary>
public interface IDaprUtils
{
  Task<TData> GetStateAsync<TData>(
    string storeName,
    string key
  );

  Task<IEnumerable<TData>> GetBulkStateAsync<TData>(
    string storeName,
    List<string> keys
  );

  Task<IEnumerable<TData>> QueryStateAsync<TData>(
    string stateStore,
    string jsonQuery = "{}",
    Dictionary<string, string>? metadata = null
  );

  Task SaveStateAsync<TData>(
    string storeName,
    string key,
    TData data,
    Dictionary<string, string>? metadata = null
  );

  Task BulkSaveStateAsync<TData>(
    string storeName,
    IEnumerable<TData> items
  ) where TData : IIdentifiable;

  Task DeleteStateAsync(
    string storeName,
    string key
  );

  Task DeleteBulkStateAsync(
    string storeName,
    IEnumerable<string> keys
  );

  /// <summary>
  /// Publishes the event to the configured topic.
  /// </summary>
  /// <param name="eventData">The event data.</param>
  /// <param name="topicName">The topic to publish to.</param>
  /// <param name="correlationId">The correlation identifier.</param>
  /// <param name="cancellationToken">The cancellation token.</param>
  Task PublishEvtAsync<T>(
    T eventData,
    string topicName,
    Guid correlationId,
    CancellationToken cancellationToken
  );

  /// <summary>
  /// Publishes the event to the configured topic.
  /// </summary>
  /// <param name="eventData">The event data.</param>
  /// <param name="topicName">The topic to publish to.</param>
  /// <param name="correlationId">The correlation identifier.</param>
  /// <param name="daprMetadata">Any dapr specific metadata to be passed to the dapr pub sub components.</param>
  /// <param name="pubSubMetadata">Any metadata to be passed to pub sub document message.</param>
  /// <param name="cancellationToken">The cancellation token.</param>
  Task PublishEvtAsync<T>(
    T eventData,
    string topicName,
    Guid correlationId,
    Dictionary<string, string> daprMetadata,
    Dictionary<string, string> pubSubMetadata,
    CancellationToken cancellationToken = default
  );
}
