using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace Hubs;

[Authorize]
public class ChatHub(IChatService chatService, IAiService aiService) : Hub
{
  private static readonly Dictionary<string, string> UserConnections = [];
  private readonly IChatService _chatService = chatService;
  private readonly IAiService _aiService = aiService;

  public override async Task OnConnectedAsync()
  {
    string? userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (!string.IsNullOrEmpty(userId))
    {
      UserConnections[Context.ConnectionId] = userId;
      await Clients.All.SendAsync("UserOnline", userId);
    }
    await base.OnConnectedAsync();
  }

  public override async Task OnDisconnectedAsync(Exception? exception)
  {
    if (UserConnections.TryGetValue(Context.ConnectionId, out string? userId))
    {
      UserConnections.Remove(Context.ConnectionId);
      if (!UserConnections.ContainsValue(userId))
      {
        await Clients.All.SendAsync("UserOffline", userId);
      }
    }
    await base.OnDisconnectedAsync(exception);
  }

  public async Task JoinChat(string chatId)
  {
    await Groups.AddToGroupAsync(Context.ConnectionId, chatId);
  }

  public async Task LeaveChat(string chatId)
  {
    await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatId);
  }

  public async Task SendMessage(string chatId, string senderId, ChatMessage message)
  {
    // Validate the sender is in the chat group
    string? userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (userId != senderId)
    {
      throw new HubException("Unauthorized to send message as different user");
    }

    await Clients.Group(chatId).SendAsync("ReceiveMessage", message);
  }

  public async Task SendUserMessage(string chatId, ChatMessage message, string? repositoryName = null)
  {
    // Validate the sender
    string? userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userId) || userId != message.Sender)
    {
      throw new HubException("Unauthorized to send message as different user");
    }

    try
    {
      // Save the user message first
      await _chatService.AddChatMessageAsync(userId, chatId, message);

      // Broadcast the user message to all participants
      await Clients.Group(chatId).SendAsync("ReceiveMessage", message);

      // Check if AI should respond
      var chat = await _chatService.GetChatByIdAsync(userId, chatId);
      bool shouldTriggerAi = ShouldTriggerAi(message.Content, chat.ParticipantIds.Count);

      if (shouldTriggerAi)
      {
        // Notify typing status
        await Clients.Group(chatId).SendAsync("AiTypingStatus", chatId, true);

        // Process AI response in background
        _ = Task.Run(async () =>
        {
          try
          {
            // Clean the input (remove @lxi mentions)
            string cleanInput = message.Content.Replace("@lxi", "", StringComparison.OrdinalIgnoreCase).Trim();

            // Get current repository if not provided
            string repoName = repositoryName ?? await _chatService.GetCurrentRepositoryAsync(chatId);

            // Query the AI
            var aiRequest = new QueryAiAgentRequest
            {
              Query = cleanInput,
              RepoName = repoName,
              ChatId = chatId
            };

            var aiResponse = await _aiService.QueryAgentAsync(aiRequest, userId, CancellationToken.None);

            if (!string.IsNullOrEmpty(aiResponse.Output))
            {
              // Create AI response message
              var aiMessage = new ChatMessage
              {
                Id = Guid.NewGuid().ToString(),
                ChatId = chatId,
                Sender = "ai",
                Content = aiResponse.Output,
                Timestamp = DateTime.UtcNow,
                Type = "ai"
              };

              // Save AI message
              await _chatService.AddChatMessageAsync(userId, chatId, aiMessage);

              // Broadcast AI response
              try
              {
                await Clients.Group(chatId).SendAsync("ReceiveMessage", aiMessage);
              }
              catch (ObjectDisposedException)
              {
                // Connection was disposed, can't send message to client but message was saved
                Console.WriteLine("Connection disposed, AI response saved but unable to send to client");
              }
            }
          }
          catch (Exception ex)
          {
            // Log error and send error message
            Console.WriteLine($"AI processing error: {ex.Message}");

            try
            {
              var errorMessage = new ChatMessage
              {
                Id = Guid.NewGuid().ToString(),
                ChatId = chatId,
                Sender = "ai",
                Content = "Sorry, I'm having trouble processing your request right now. Please try again.",
                Timestamp = DateTime.UtcNow,
                Type = "ai"
              };

              await _chatService.AddChatMessageAsync(userId, chatId, errorMessage);
              await Clients.Group(chatId).SendAsync("ReceiveMessage", errorMessage);
            }
            catch (ObjectDisposedException)
            {
              // Connection was disposed, can't send message to client
              Console.WriteLine("Connection disposed, unable to send error message to client");
            }
            catch (Exception sendEx)
            {
              Console.WriteLine($"Failed to send error message: {sendEx.Message}");
            }
          }
          finally
          {
            try
            {
              // Stop typing indicator
              await Clients.Group(chatId).SendAsync("AiTypingStatus", chatId, false);
            }
            catch (ObjectDisposedException)
            {
              // Connection was disposed, can't send typing status
              Console.WriteLine("Connection disposed, unable to send typing status");
            }
          }
        });
      }
    }
    catch (Exception ex)
    {
      // Log the error - this should only catch message saving errors now
      Console.WriteLine($"SendUserMessage error: {ex.Message}");
      throw new HubException($"Failed to send message: {ex.Message}");
    }
  }

  private static bool ShouldTriggerAi(string messageContent, int participantCount)
  {
    // If it's a one-on-one chat with AI, always trigger
    if (participantCount <= 1)
    {
      return true;
    }

    // Check for @lxi mention in group chats
    return messageContent.Contains("@lxi", StringComparison.OrdinalIgnoreCase);
  }

  public async Task NotifyParticipantAdded(string chatId, string participantId)
  {
    await Clients.Group(chatId).SendAsync("ParticipantAdded", chatId, participantId);
  }

  public async Task BroadcastRepositoryChange(string chatId, string repoName)
  {
    string? userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userId))
    {
      throw new HubException("Unauthorized");
    }

    await Clients.Group(chatId).SendAsync("RepositoryChanged", chatId, repoName, userId);
  }

  public async Task BroadcastAiTyping(string chatId, bool isTyping)
  {
      string? userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userId))
      {
          throw new HubException("Unauthorized");
      }

      await Clients.Group(chatId).SendAsync("AiTypingStatus", chatId, isTyping);
  }
}
