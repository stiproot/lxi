using Dapr.Client;

namespace Services;

/// <summary>
/// Implements a contract for publishing events.
/// </summary>
/// <remarks>
/// Instantiates a new instance of the <see cref="DaprUtils"/> class.
/// </remarks>
/// <param name="logger">The logger.</param>
/// <param name="daprClient">The dapr client.</param>
public class DaprUtils(
  ILogger<DaprUtils> logger,
  DaprClient daprClient
) : IDaprUtils
{
  private readonly ILogger<DaprUtils> _logger = logger;
  private readonly DaprClient _daprClient = daprClient;

  private readonly Dictionary<string, string> _metadata = new() { { "contentType", "application/json" } };

  public async Task<TData> GetStateAsync<TData>(
    string storeName,
    string key
  )
  {
    return await _daprClient.GetStateAsync<TData>(storeName, key, null, _metadata);
  }

  public async Task<IEnumerable<TData>> GetBulkStateAsync<TData>(
    string storeName,
    List<string> keys
  )
  {
    IReadOnlyList<BulkStateItem<TData>> stateItemsResponse = await _daprClient.GetBulkStateAsync<TData>(storeName, keys, parallelism: 0, metadata: _metadata);
    return stateItemsResponse.Select(stateItem => stateItem.Value);
  }

  public async Task<IEnumerable<TData>> QueryStateAsync<TData>(
    string stateStore,
    string jsonQuery = "{}",
    Dictionary<string, string>? metadata = null
  )
  {
    StateQueryResponse<TData> queryResponse = await _daprClient.QueryStateAsync<TData>(stateStore, jsonQuery, metadata: _metadata);
    return [.. queryResponse.Results.Select(item => item.Data)];
  }

  public async Task SaveStateAsync<TData>(
    string storeName,
    string key,
    TData data,
    Dictionary<string, string>? metadata = null
  )
  {
    await _daprClient.SaveStateAsync(storeName, key, data, metadata: metadata);
  }

  public async Task BulkSaveStateAsync<TData>(
    string storeName,
    IEnumerable<TData> items
  ) where TData : IIdentifiable
  {
    var saveStateItems = items.Select(item => new SaveStateItem<TData>(item.Key, item, null, null, _metadata)).ToList();
    await _daprClient.SaveBulkStateAsync(storeName, saveStateItems);
  }

  public async Task DeleteStateAsync(
    string storeName,
    string key
  )
  {
    await _daprClient.DeleteStateAsync(storeName, key);
  }

  public async Task DeleteBulkStateAsync(
    string storeName,
    IEnumerable<string> keys
  )
  {
    var deleteStateItems = keys.Select(key => new BulkDeleteStateItem(key, null, null, _metadata)).ToList();
    await _daprClient.DeleteBulkStateAsync(storeName, deleteStateItems);
  }

  /// <inheritdoc/>
  public async Task PublishEvtAsync<T>(
    T eventData,
    string topicName,
    Guid correlationId,
    CancellationToken cancellationToken
  )
  {
    _logger.LogMethodStart(nameof(PublishEvtAsync));
    cancellationToken.ThrowIfCancellationRequested();

    await _daprClient.PublishEventAsync(
      DaprComponents.PubSub,
      topicName,
      eventData,
      cancellationToken
    );

    _logger.LogMethodEnd(nameof(PublishEvtAsync));
  }

  /// <inheritdoc/>
  public async Task PublishEvtAsync<T>(
    T eventData,
    string topicName,
    Guid correlationId,
    Dictionary<string, string> daprMetadata,
    Dictionary<string, string> pubSubMetadata,
    CancellationToken cancellationToken = default
  )
  {
    _logger.LogMethodStart(nameof(PublishEvtAsync));
    cancellationToken.ThrowIfCancellationRequested();

    await _daprClient.PublishEventAsync(
      DaprComponents.PubSub,
      topicName,
      eventData,
      daprMetadata,
      cancellationToken
    );

    _logger.LogMethodEnd(nameof(PublishEvtAsync));
  }
}