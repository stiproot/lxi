using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatsController(
  ILogger<ChatsController> logger,
  IChatService chatService
) : ControllerBase
{
  private readonly ILogger<ChatsController> _logger = logger;
  private readonly IChatService _chatService = chatService;

  private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

  [HttpGet]
  [ProducesResponseType(typeof(IEnumerable<ChatActorState>), (int)HttpStatusCode.OK)]
  public async Task<IActionResult> GetUserChats()
  {
    _logger.LogMethodStart(nameof(GetUserChats));

    try
    {
      string userId = GetUserId();
      IEnumerable<ChatActorState> chats = await _chatService.GetUserChatsAsync(userId);
      return Ok(chats);
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(GetUserChats), "Error occurred while fetching all chats", ex);
      return StatusCode((int)HttpStatusCode.InternalServerError, "An error occurred while processing your request.");
    }
  }

  [HttpPost]
  [ProducesResponseType(typeof(ChatActorState), (int)HttpStatusCode.Created)]
  [ProducesResponseType((int)HttpStatusCode.BadRequest)]
  public async Task<IActionResult> CreateChat([FromBody][Required] ChatActorState chat)
  {
    _logger.LogMethodStart(nameof(CreateChat));

    string userId = GetUserId();
    if (chat.OwnerId != userId)
    {
      return BadRequest("Chat owner must be the same as the authenticated user");
    }

    try
    {
      await _chatService.CreateChatAsync(chat);
      return Created();
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(CreateChat), "Error occurred while creating a new chat", ex);
      return StatusCode((int)HttpStatusCode.InternalServerError, "An error occurred while processing your request.");
    }
  }

  [HttpGet("{chatId}")]
  [ProducesResponseType(typeof(ChatActorState), (int)HttpStatusCode.OK)]
  [ProducesResponseType((int)HttpStatusCode.NotFound)]
  public async Task<IActionResult> GetChatById([FromRoute] string chatId)
  {
    _logger.LogMethodStart(nameof(GetChatById));

    try
    {
      string userId = GetUserId();
      ChatActorState? chat = await _chatService.GetChatByIdAsync(userId, chatId);
      if (chat is null)
      {
        _logger.LogNoChatFoundWarning(chatId);
        return NotFound();
      }

      return Ok(chat);
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(GetChatById), $"Error occurred while fetching chat with ID {chatId}", ex);
      return StatusCode((int)HttpStatusCode.InternalServerError, "An error occurred while processing your request.");
    }
  }

  [HttpGet("{chatId}/messages")]
  [ProducesResponseType(typeof(IEnumerable<ChatMessageResponse>), (int)HttpStatusCode.OK)]
  [ProducesResponseType((int)HttpStatusCode.NotFound)]
  public async Task<IActionResult> GetChatMessages([FromRoute] string chatId)
  {
    _logger.LogMethodStart(nameof(GetChatMessage));

    string userId = GetUserId();

    try
    {
      IEnumerable<ChatMessage> messages = await _chatService.GetChatMessagesAsync(userId, chatId);

      IEnumerable<ChatMessageResponse> response = messages.Select(m => new ChatMessageResponse
      {
        Id = m.Id,
        ChatId = m.ChatId,
        Sender = m.Sender,
        Content = m.Content,
        Timestamp = m.Timestamp
      });

      _logger.LogMethodEnd(nameof(GetChatMessage));

      return Ok(response);
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(GetChatMessages), $"Error occurred while fetching chat messages for chat ID {chatId}", ex);
      return StatusCode((int)HttpStatusCode.InternalServerError, "An error occurred while processing your request.");
    }
  }

  [HttpGet("{chatId}/messages/{messageId}")]
  [ProducesResponseType(typeof(ChatMessageResponse), (int)HttpStatusCode.OK)]
  [ProducesResponseType((int)HttpStatusCode.NotFound)]
  public async Task<IActionResult> GetChatMessage([FromRoute] string chatId, [FromRoute] string messageId)
  {
    _logger.LogMethodStart(nameof(GetChatMessage));

    try
    {
      string userId = GetUserId();
      ChatMessage? message = await _chatService.TryGetChatMessageAsync(userId, chatId, messageId);
      if (message is null)
      {
        _logger.LogGenericWarning(nameof(GetChatMessage), $"No chat message found for chat ID {chatId} and message ID {messageId}");
        return NotFound();
      }

      var response = new ChatMessageResponse
      {
        Id = message.Id,
        ChatId = message.ChatId,
        Sender = message.Sender,
        Content = message.Content,
        Timestamp = message.Timestamp,
      };

      _logger.LogMethodEnd(nameof(GetChatMessage));
      return Ok(response);
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(GetChatMessage), $"Error occurred while fetching chat message for chat ID {chatId} and message ID {messageId}", ex);
      return StatusCode((int)HttpStatusCode.InternalServerError, "An error occurred while processing your request.");
    }
  }

  [HttpPost("{chatId}/messages")]
  [ProducesResponseType(typeof(ChatMessageResponse), (int)HttpStatusCode.Created)]
  [ProducesResponseType((int)HttpStatusCode.BadRequest)]
  public async Task<IActionResult> AddChatMessage(
    [FromRoute] string chatId,
    [FromBody][Required] ChatMessage message
  )
  {
    _logger.LogMethodStart(nameof(AddChatMessage));

    string userId = GetUserId();

    try
    {
      await _chatService.AddChatMessageAsync(userId, chatId, message);
      return Created();
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(AddChatMessage), $"Error occurred while adding chat message to chat ID {chatId}", ex);
      return StatusCode((int)HttpStatusCode.InternalServerError, "An error occurred while processing your request.");
    }
  }

  [HttpDelete("{chatId}/messages/{messageId}")]
  [ProducesResponseType((int)HttpStatusCode.NoContent)]
  [ProducesResponseType((int)HttpStatusCode.NotFound)]
  public async Task<IActionResult> DeleteChatMessage(
    [FromRoute] string chatId,
    [FromRoute] string messageId
  )
  {
    _logger.LogMethodStart(nameof(DeleteChatMessage));

    try
    {
      string userId = GetUserId();
      bool success = await _chatService.DeleteChatMessageAsync(userId, chatId, messageId);
      if (!success)
      {
        _logger.LogGenericWarning(nameof(DeleteChatMessage), $"No chat message found to delete for chat ID {chatId} and message ID {messageId}");
        return NotFound();
      }

      _logger.LogMethodEnd(nameof(DeleteChatMessage));
      return NoContent();
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(DeleteChatMessage), $"Error occurred while deleting chat message for chat ID {chatId} and message ID {messageId}", ex);
      return StatusCode((int)HttpStatusCode.InternalServerError, "An error occurred while processing your request.");
    }
  }

  [HttpDelete("{chatId}")]
  [ProducesResponseType((int)HttpStatusCode.NoContent)]
  [ProducesResponseType((int)HttpStatusCode.NotFound)]
  public async Task<IActionResult> DeleteChat([FromRoute] string chatId)
  {
    _logger.LogMethodStart(nameof(DeleteChat));

    try
    {
      string userId = GetUserId();
      bool success = await _chatService.DeleteChatAsync(userId, chatId);
      if (!success)
      {
        _logger.LogGenericWarning(nameof(DeleteChat), $"No chat found to delete with ID {chatId}");
        return NotFound();
      }

      _logger.LogMethodEnd(nameof(DeleteChat));
      return NoContent();
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(DeleteChat), $"Error occurred while deleting chat with ID {chatId}", ex);
      return StatusCode((int)HttpStatusCode.InternalServerError, "An error occurred while processing your request.");
    }
  }

  [HttpPut("{chatId}/rename")]
  [ProducesResponseType((int)HttpStatusCode.NoContent)]
  [ProducesResponseType((int)HttpStatusCode.NotFound)]
  public async Task<IActionResult> RenameChat(
    [FromRoute] string chatId,
    [FromBody][Required] RenameChatRequest request
  )
  {
    _logger.LogMethodStart(nameof(RenameChat));

    try
    {
      string userId = GetUserId();
      bool success = await _chatService.RenameChatAsync(userId, chatId, request.NewName);
      if (!success)
      {
        _logger.LogGenericWarning(nameof(RenameChat), $"No chat found to rename with ID {chatId}");
        return NotFound();
      }

      _logger.LogMethodEnd(nameof(RenameChat));
      return NoContent();
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(RenameChat), $"Error occurred while renaming chat with ID {chatId}", ex);
      return StatusCode((int)HttpStatusCode.InternalServerError, "An error occurred while processing your request.");
    }
  }

  [HttpPut("{chatId}/pin")]
  [ProducesResponseType((int)HttpStatusCode.NoContent)]
  [ProducesResponseType((int)HttpStatusCode.NotFound)]
  public async Task<IActionResult> PinChat(
    [FromRoute] string chatId,
    [FromBody][Required] PinChatRequest request
  )
  {
    _logger.LogMethodStart(nameof(PinChat));

    try
    {
      string userId = GetUserId();
      bool success = await _chatService.PinChatAsync(userId, chatId, request.Pin);
      if (!success)
      {
        _logger.LogGenericWarning(nameof(PinChat), $"No chat found to pin/unpin with ID {chatId}");
        return NotFound();
      }

      _logger.LogMethodEnd(nameof(PinChat));
      return NoContent();
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(PinChat), $"Error occurred while pinning/unpinning chat with ID {chatId}", ex);
      return StatusCode((int)HttpStatusCode.InternalServerError, "An error occurred while processing your request.");
    }
  }

  [HttpPost("{chatId}/participants/{participantId}")]
  [ProducesResponseType((int)HttpStatusCode.OK)]
  [ProducesResponseType((int)HttpStatusCode.BadRequest)]
  [ProducesResponseType((int)HttpStatusCode.NotFound)]
  public async Task<IActionResult> AddParticipant(
    [FromRoute] string chatId,
    [FromRoute] string participantId
  )
  {
    _logger.LogMethodStart(nameof(AddParticipant));

    try
    {
      string userId = GetUserId();

      bool isAdded = await _chatService.AddParticipantAsync(userId, chatId, participantId);
      if (!isAdded)
      {
        return BadRequest();
      }

      return Ok();
    }
    catch (InvalidOperationException ex)
    {
      return BadRequest(ex.Message);
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(AddParticipant), $"Error adding participant to chat {chatId}", ex);
      return StatusCode((int)HttpStatusCode.InternalServerError, "An error occurred while processing your request.");
    }
  }

  [HttpDelete("{chatId}/participants/{participantId}")]
  [ProducesResponseType((int)HttpStatusCode.OK)]
  [ProducesResponseType((int)HttpStatusCode.BadRequest)]
  [ProducesResponseType((int)HttpStatusCode.NotFound)]
  public async Task<IActionResult> RemoveParticipant(
    [FromRoute] string chatId,
    [FromRoute] string participantId
  )
  {
    _logger.LogMethodStart(nameof(RemoveParticipant));

    try
    {
      string userId = GetUserId();
      await _chatService.RemoveParticipantAsync(userId, chatId, participantId);
      return Ok();
    }
    catch (InvalidOperationException ex)
    {
      return BadRequest(ex.Message);
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(RemoveParticipant), $"Error removing participant {participantId} from chat {chatId}", ex);
      return StatusCode((int)HttpStatusCode.InternalServerError, "An error occurred while processing your request.");
    }
  }

  [HttpPut("{chatId}/repository")]
  [ProducesResponseType((int)HttpStatusCode.OK)]
  [ProducesResponseType((int)HttpStatusCode.BadRequest)]
  [ProducesResponseType((int)HttpStatusCode.NotFound)]
  public async Task<IActionResult> UpdateRepository(
    [FromRoute] string chatId,
    [FromBody][Required] UpdateRepositoryRequest request,
    CancellationToken cancellationToken
  )
  {
    _logger.LogMethodStart(nameof(UpdateRepository));

    cancellationToken.ThrowIfCancellationRequested();

    try
    {
      string userId = GetUserId();
      bool success = await _chatService.UpdateChatRepositoryAsync(userId, chatId, request.RepositoryName);

      if (!success)
      {
        return NotFound();
      }

      return Ok();
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(UpdateRepository), $"Error updating repository for chat {chatId}", ex);
      return StatusCode((int)HttpStatusCode.InternalServerError, "An error occurred while processing your request.");
    }
  }

  [HttpGet("{chatId}/repository")]
  [ProducesResponseType(typeof(string), (int)HttpStatusCode.OK)]
  [ProducesResponseType((int)HttpStatusCode.NotFound)]
  public async Task<IActionResult> GetCurrentRepository([FromRoute] string chatId)
  {
    _logger.LogMethodStart(nameof(GetCurrentRepository));

    try
    {
      string repository = await _chatService.GetCurrentRepositoryAsync(chatId);
      return Ok(repository);
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(GetCurrentRepository), $"Error getting current repository for chat {chatId}", ex);
      return StatusCode((int)HttpStatusCode.InternalServerError, "An error occurred while processing your request.");
    }
  }
}
