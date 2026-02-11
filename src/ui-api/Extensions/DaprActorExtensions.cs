using System.Diagnostics.CodeAnalysis;
using Dapr.Actors.Runtime;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Dapr.Actors;

namespace Extensions;

/// <summary>
/// Provides extension methods for adding Dapr actors to the running application.
/// </summary>
[ExcludeFromCodeCoverage]
public static class DaprActorsExtensions
{
  /// <summary>
  /// Registers Dapr actors as a service to be consumed by the application.
  /// </summary>
  /// <param name="serviceCollection">The service collection.</param>
  /// <param name="configuration">The application configuration.</param>
  /// <returns>The updated service collection.</returns>
  public static IServiceCollection AddDaprActor<T>(this IServiceCollection serviceCollection, IConfiguration configuration) where T : Actor
  {
    serviceCollection.TryAddTransient<IActorIdProvider, ActorIdProvider>();

    ActorOptions actorOptions = configuration.GetSection(nameof(ActorOptions)).Get<ActorOptions>() ?? new ActorOptions();
    serviceCollection.AddActors(options =>
    {
      options.Actors.RegisterActor<T>();

      options.ActorIdleTimeout = TimeSpan.FromMinutes(actorOptions.ActorIdleTime);
      options.ActorScanInterval = TimeSpan.FromSeconds(actorOptions.ActorScanInterval);
      options.DrainOngoingCallTimeout = TimeSpan.FromSeconds(actorOptions.DrainOngoingCallTimeout);
      options.DrainRebalancedActors = actorOptions.DrainRebalancedActors;
    });

    return serviceCollection;
  }

  public static ActorId ToActorId(this string @this) => new(@this);
}
