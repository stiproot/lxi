using Hubs;
using Microsoft.AspNetCore.SignalR;
using Dapr.Actors.Client;

namespace Services;

public class ChatService(
  IHubContext<ChatHub> hubContext,
  IActorProxyFactory actorProxyFactory
) : IChatService
{
  private readonly IHubContext<ChatHub> _hubContext = hubContext;
  private readonly IActorProxyFactory _actorProxyFactory = actorProxyFactory;

  private IChatActor CreateChatActorProxy(string id) => _actorProxyFactory.CreateActorProxy<IChatActor>(id.ToActorId(), ChatActor.ActorType);
  private IUserActor CreateUserActorProxy(string id) => _actorProxyFactory.CreateActorProxy<IUserActor>(id.ToActorId(), UserActor.ActorType);

  public async Task<IEnumerable<ChatActorState>> GetUserChatsAsync(string userId)
  {
    IUserActor userActor = CreateUserActorProxy(userId);

    UserActorState userActorState = await userActor.GetOrThrowActorStateAsync();

    ChatActorState[] chats = await Task.WhenAll(userActorState.Chats.Select(async uc => ((await CreateChatActorProxy(uc.ChatId).GetOrThrowActorStateAsync()) with { IsPinned = uc.IsPinned })));

    // No need to filter since deleted chats are completely removed
    return chats;
  }

  public async Task<ChatActorState> GetChatByIdAsync(
    string userId,
    string chatId
  )
  {
    IChatActor chatActor = CreateChatActorProxy(chatId);
    ChatActorState chatActorState = await chatActor.GetOrThrowActorStateAsync();

    IUserActor userActor = CreateUserActorProxy(userId);
    UserActorState userActorState = await userActor.GetOrThrowActorStateAsync();

    return chatActorState with { IsPinned = userActorState.Chats.Exists(c => c.ChatId == chatId && c.IsPinned) };
  }

  public async Task CreateChatAsync(ChatActorState chat)
  {
    IChatActor chatActor = CreateChatActorProxy(chat.Id!);
    await chatActor.SetActorStateAsync(chat);

    IUserActor userActor = CreateUserActorProxy(chat.OwnerId!);
    UserActorState userActorState = await userActor.GetOrThrowActorStateAsync();

    userActorState.Chats.Add(new ChatSummary
    {
      ChatId = chat.Id!,
      IsPinned = false,
      ChatStatus = ChatStatus.Active
    });

    await userActor.SetActorStateAsync(userActorState);
  }

  public async Task<IEnumerable<ChatMessage>> GetChatMessagesAsync(
    string userId,
    string chatId
  )
  {
    IChatActor chatActor = CreateChatActorProxy(chatId);
    ChatActorState chatActorState = await chatActor.GetOrThrowActorStateAsync();

    return chatActorState.Messages;
  }

  public async Task<ChatMessage?> TryGetChatMessageAsync(
    string userId,
    string chatId,
    string messageId
  )
  {
    IChatActor chatActor = CreateChatActorProxy(chatId);
    ChatActorState chatActorState = await chatActor.GetOrThrowActorStateAsync();

    if (!chatActorState.ParticipantIds.Contains(userId))
    {
      return null;
    }

    return chatActorState.Messages.Find(m => m.Id == messageId)!;
  }

  public async Task AddChatMessageAsync(
    string userId,
    string chatId,
    ChatMessage message
  )
  {
    IChatActor chatActor = CreateChatActorProxy(chatId);
    ChatActorState chatActorState = await chatActor.GetOrThrowActorStateAsync();

    chatActorState.Messages.Add(message);
    chatActorState.UpdateLastModified();

    await chatActor.SetActorStateAsync(chatActorState);

    await _hubContext.Clients.Group(chatId).SendAsync("ReceiveMessage", message);
  }

  public async Task<bool> DeleteChatMessageAsync(
    string userId,
    string chatId,
    string messageId
  )
  {
    IChatActor chatActor = CreateChatActorProxy(chatId);
    ChatActorState chatActorState = await chatActor.GetOrThrowActorStateAsync();

    ChatMessage? message = chatActorState.Messages.Find(m => m.Id == messageId);
    if (message is null || message.Sender != userId)
    {
      return false;
    }

    chatActorState.Messages.Remove(message);
    chatActorState.UpdateLastModified();

    await chatActor.SetActorStateAsync(chatActorState);

    return true;
  }

  public async Task<bool> DeleteChatAsync(
    string userId,
    string chatId
  )
  {
    IChatActor chatActor = CreateChatActorProxy(chatId);
    ChatActorState chatActorState = await chatActor.GetOrThrowActorStateAsync();

    if (chatActorState.OwnerId != userId)
    {
      return false;
    }

    // Remove chat from all participants' chat lists
    foreach (string participantId in chatActorState.ParticipantIds)
    {
      IUserActor participantActor = CreateUserActorProxy(participantId);
      UserActorState participantState = await participantActor.GetOrThrowActorStateAsync();

      participantState.Chats.RemoveAll(c => c.ChatId == chatId);

      await participantActor.SetActorStateAsync(participantState);
    }

    // Remove chat from owner's chat list (if not already a participant)
    if (!chatActorState.ParticipantIds.Contains(userId))
    {
      IUserActor ownerActor = CreateUserActorProxy(userId);
      UserActorState ownerState = await ownerActor.GetOrThrowActorStateAsync();

      ownerState.Chats.RemoveAll(c => c.ChatId == chatId);

      await ownerActor.SetActorStateAsync(ownerState);
    }

    // Hard delete: Clear the chat actor state completely
    await chatActor.DeleteActorStateAsync();

    return true;
  }

  public async Task<bool> RenameChatAsync(
    string userId,
    string chatId,
    string newName
  )
  {
    IChatActor chatActor = CreateChatActorProxy(chatId);
    ChatActorState chatActorState = await chatActor.GetOrThrowActorStateAsync();

    if (chatActorState.OwnerId != userId)
    {
      return false;
    }

    chatActorState.Name = newName;
    chatActorState.UpdateLastModified();

    await chatActor.SetActorStateAsync(chatActorState);

    return true;
  }

  public async Task<bool> PinChatAsync(
    string userId,
    string chatId,
    bool pin
  )
  {
    IUserActor userActor = CreateUserActorProxy(userId);
    UserActorState userActorState = await userActor.GetOrThrowActorStateAsync();

    ChatSummary? chatSummary = userActorState.Chats.Find(c => c.ChatId == chatId);
    if (chatSummary is null)
    {
      return false;
    }

    chatSummary.IsPinned = pin;

    await userActor.SetActorStateAsync(userActorState);

    return true;
  }

  public async Task<bool> AddParticipantAsync(
    string userId,
    string chatId,
    string participantId
  )
  {
    IChatActor chatActor = CreateChatActorProxy(chatId);
    ChatActorState chatActorState = await chatActor.GetOrThrowActorStateAsync();

    if (chatActorState.ParticipantIds.Contains(participantId))
    {
      return false;
    }

    chatActorState.ParticipantIds.Add(participantId);
    chatActorState.UpdateLastModified();

    await chatActor.SetActorStateAsync(chatActorState);

    IUserActor userActor = CreateUserActorProxy(participantId);
    UserActorState userActorState = await userActor.GetOrThrowActorStateAsync();

    userActorState.Chats.Add(new ChatSummary
    {
      ChatId = chatId,
      IsPinned = false,
      ChatStatus = ChatStatus.Active
    });

    await userActor.SetActorStateAsync(userActorState);

    return true;
  }

  public async Task<bool> RemoveParticipantAsync(
    string userId,
    string chatId,
    string participantId
  )
  {
    IChatActor chatActor = CreateChatActorProxy(chatId);
    ChatActorState chatActorState = await chatActor.GetOrThrowActorStateAsync();

    if (!chatActorState.ParticipantIds.Contains(userId))
    {
      return false;
    }

    chatActorState.ParticipantIds.Remove(participantId);
    chatActorState.UpdateLastModified();

    await chatActor.SetActorStateAsync(chatActorState);

    IUserActor userActor = CreateUserActorProxy(participantId);
    UserActorState userActorState = await userActor.GetOrThrowActorStateAsync();

    userActorState.Chats.RemoveAll(c => c.ChatId == chatId);

    await userActor.SetActorStateAsync(userActorState);

    return true;
  }

  public async Task<bool> UpdateChatRepositoryAsync(
    string userId,
    string chatId,
    string repositoryName
  )
  {
    IChatActor actor = CreateChatActorProxy(chatId);
    ChatActorState chatActorState = await actor.GetOrThrowActorStateAsync();

    if (!chatActorState.ParticipantIds.Contains(userId))
    {
      return false;
    }

    chatActorState.CurrentRepository = repositoryName;
    chatActorState.UpdateLastModified();
    chatActorState.UpdateLastRepositoryChange();

    var systemMessage = new ChatMessage
    {
      Id = Guid.NewGuid().ToString(),
      ChatId = chatId,
      Sender = "System",
      Content = repositoryName,
      Timestamp = DateTime.UtcNow,
      Type = "repository_change"
    };

    chatActorState.Messages.Add(systemMessage);

    await actor.SetActorStateAsync(chatActorState);

    await _hubContext.Clients.Group(chatId).SendAsync("RepositoryChanged", chatId, repositoryName, userId);

    return true;
  }

  public async Task<string> GetCurrentRepositoryAsync(string chatId)
  {
    IChatActor actor = CreateChatActorProxy(chatId);

    ChatActorState chatActorState = await actor.GetOrThrowActorStateAsync();

    return chatActorState.CurrentRepository!;
  }
}
