using Dapr.Actors;

namespace Abstractions;

/// <summary>
/// Is the contract for creating an actor identifier.
/// </summary>
public interface IActorIdProvider
{
  /// <summary>
  /// </summary>
  /// <param name="id">An event made by the player.</param>
  /// <returns>
  /// The actor identifier.
  /// </returns>
  ActorId CreateActorId(Guid id);
}
