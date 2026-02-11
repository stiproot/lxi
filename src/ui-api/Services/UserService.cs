using Dapr.Actors.Client;

namespace Services;

public class UserService(
  ILogger<UserService> logger,
  IDaprUtils daprUtils,
  IActorProxyFactory actorProxyFactory
) : IUserService
{
  private readonly ILogger<UserService> _logger = logger;
  private readonly IDaprUtils _daprUtils = daprUtils;
  private readonly IActorProxyFactory _actorProxyFactory = actorProxyFactory;
  private const string EmptyQuery = "{}";
  private readonly Dictionary<string, string> _metadata = new() { ["partitionKey"] = "usrs", ["contentType"] = "application/json" };

  private IUserActor CreateUserActor(string id) => _actorProxyFactory.CreateActorProxy<IUserActor>(id.ToActorId(), UserActor.ActorType);

  public async Task<IEnumerable<UserInfo>> GetAllUsersAsync() =>
    await _daprUtils.QueryStateAsync<UserInfo>(DaprComponents.UsersStateStore, EmptyQuery, _metadata);

  public async Task<UserInfo?> TryGetUserByIdAsync(string userId)
  {
    IUserActor actor = CreateUserActor(userId);

    (bool exists, UserActorState? state) = await actor.TryGetActorStateAsync();
    if (!exists)
    {
      return null;
    }

    return state!.User;
  }

  public async Task CreateUserAsync(UserInfo user)
  {
    _logger.LogMethodStart(nameof(CreateUserAsync));

    IUserActor actor = CreateUserActor(user.Id);

    await actor.InitActorStateAsync(new UserActorState { User = user });
    await _daprUtils.SaveStateAsync(DaprComponents.UsersStateStore, user.Id, user, _metadata);

    _logger.LogMethodEnd(nameof(CreateUserAsync));
  }

  public async Task UpdateUserAsync(UserInfo user)
  {
    _logger.LogMethodStart(nameof(UpdateUserAsync));

    IUserActor actor = CreateUserActor(user.Id);
    UserActorState actorState = await actor.GetOrThrowActorStateAsync();
    actorState.User = user;

    await actor.SetActorStateAsync(actorState);
    await _daprUtils.SaveStateAsync(DaprComponents.UsersStateStore, user.Id, user, _metadata);

    _logger.LogMethodEnd(nameof(UpdateUserAsync));
  }

  public async Task<bool> DeleteUserAsync(string userId)
  {
    await _daprUtils.DeleteStateAsync(DaprComponents.UsersStateStore, userId);

    return true;
  }

  public async Task<IEnumerable<UserInfo>> SearchUsersAsync(string query)
  {
    IEnumerable<UserInfo> users = await GetAllUsersAsync();
    return users.Where(u => u.Name.Contains(query, StringComparison.OrdinalIgnoreCase) || u.Email.Contains(query, StringComparison.OrdinalIgnoreCase));
  }
}
