namespace Abstractions;

public interface IChatService
{
  Task<IEnumerable<ChatActorState>> GetUserChatsAsync(string userId);
  Task<ChatActorState> GetChatByIdAsync(string userId, string chatId);
  Task CreateChatAsync(ChatActorState chat);
  Task<IEnumerable<ChatMessage>> GetChatMessagesAsync(string userId, string chatId);
  Task<ChatMessage?> TryGetChatMessageAsync(string userId, string chatId, string messageId);
  Task AddChatMessageAsync(string userId, string chatId, ChatMessage message);
  Task<bool> DeleteChatMessageAsync(string userId, string chatId, string messageId);
  Task<bool> DeleteChatAsync(string userId, string chatId);
  Task<bool> RenameChatAsync(string userId, string chatId, string newName);
  Task<bool> PinChatAsync(string userId, string chatId, bool pin);
  Task<bool> AddParticipantAsync(string userId, string chatId, string participantId);
  Task<bool> RemoveParticipantAsync(string userId, string chatId, string participantId);
  Task<bool> UpdateChatRepositoryAsync(string userId, string chatId, string repositoryName);
  Task<string> GetCurrentRepositoryAsync(string chatId);
}
