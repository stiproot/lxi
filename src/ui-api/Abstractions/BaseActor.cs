using System.Diagnostics.CodeAnalysis;
using Dapr.Actors.Runtime;

namespace Abstractions;

/// <summary>
/// Represents the actor responsible for managing the state of a campaign.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="BaseActor{TActorState}"/> class.
/// </remarks>
/// <param name="host">The actor host.</param>
/// <param name="stateName">The actor host.</param>
[ExcludeFromCodeCoverage]
public abstract class BaseActor<TActorState>(
  ActorHost host,
  string stateName
) : Actor(host) where TActorState : BaseActorState
{
  /// <summary>
  /// </summary>
  private readonly string _stateName = stateName;

  /// <inheritdoc />
  public virtual async Task<(bool, TActorState?)> TryGetActorStateAsync()
  {
    ConditionalValue<TActorState> state = await StateManager.TryGetStateAsync<TActorState>(_stateName);

    if (!state.HasValue)
    {
      return (false, default);
    }

    return (true, state.Value);
  }

  /// <inheritdoc />
  public virtual async Task<TActorState> GetOrThrowActorStateAsync()
  {
    (bool hasValue, TActorState? state) = await TryGetActorStateAsync();

    if (!hasValue)
    {
      throw new InvalidOperationException($"Actor state not found. {Id}");
    }

    return state!;
  }

  /// <inheritdoc />
  public virtual async Task InitActorStateAsync(TActorState actorState) => await StateManager.GetOrAddStateAsync(_stateName, actorState);

  /// <inheritdoc />
  public virtual async Task SetActorStateAsync(TActorState state) => await StateManager.SetStateAsync(_stateName, state);

  /// <inheritdoc />
  public virtual async Task<TType> GetOrThrowDecompressedActorStateAsync<TType>()
  {
    (bool hasValue, TActorState? actorState) = await TryGetActorStateAsync();
    if (!hasValue)
    {
      throw new InvalidOperationException($"Actor state not found. {Id}");
    }

    byte[] decoded = Convert.FromBase64String(actorState!.CompressedState!);
    string decompressed = CompressionUtils.DecompressJson(decoded);
    TType obj = JsonSerializer.Deserialize<TType>(decompressed)!;

    return obj;
  }

  public async Task SetCompressedActorStateAsync<TType>(TType type)
  {
    string json = JsonSerializer.Serialize(type);
    byte[] bytes = CompressionUtils.CompressJson(json);
    string encoded = Convert.ToBase64String(bytes);

    var state = new BaseActorState { CompressedState = encoded };

    await StateManager.SetStateAsync(_stateName, state);
  }

  /// <summary>
  /// Deletes the actor state completely.
  /// </summary>
  public virtual async Task DeleteActorStateAsync() => await StateManager.RemoveStateAsync(_stateName);
}
