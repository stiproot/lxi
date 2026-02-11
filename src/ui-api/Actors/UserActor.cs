using System.Diagnostics.CodeAnalysis;
using Dapr.Actors.Runtime;

namespace Actors;

/// <summary>
/// Represents the actor responsible for managing the state of a player.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="UserActor"/> class.
/// </remarks>
/// <param name="host">The actor host.</param>
[ExcludeFromCodeCoverage]
public class UserActor(ActorHost host) : BaseActor<UserActorState>(host, DaprComponents.ActorStateStore), IUserActor
{
  /// <summary>
  /// Gets the type of the actor.
  /// </summary>
  public static string ActorType => nameof(UserActor);
}
