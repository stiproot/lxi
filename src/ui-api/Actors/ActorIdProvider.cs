using Dapr.Actors;

namespace Actors;

/// <summary>
/// Implements contract for creating an actor identifier.
/// </summary>
public class ActorIdProvider : IActorIdProvider
{
  /// <inheritdoc />
  public ActorId CreateActorId(Guid id) => new(id.ToString());
}
