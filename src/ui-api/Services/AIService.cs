using Dapr.Client;
using Models.Core;

namespace Services;

public class AiService : IAiService
{
  private readonly ILogger<AiService> _logger;
  private readonly DaprClient _daprClient;
  private readonly HttpClient _qryHttpClient;
  private readonly HttpClient _embedHttpClient;
  private readonly IChatService _chatService;

  private readonly JsonSerializerOptions _options = new() { PropertyNameCaseInsensitive = true };

  public AiService(
    ILogger<AiService> logger,
    DaprClient daprClient,
    IChatService chatService
  )
  {
    _logger = logger;
    _daprClient = daprClient;
    _chatService = chatService;
    _qryHttpClient = DaprClient.CreateInvokeHttpClient(appId: DaprComponents.QryApiApplicationId);
    _embedHttpClient = DaprClient.CreateInvokeHttpClient(appId: DaprComponents.EmbedApiApplicationId);
    _embedHttpClient.Timeout = TimeSpan.FromMinutes(30);
  }

  public async Task<AgentResult> QueryAgentAsync(
    QueryAiAgentRequest request,
    string userId,
    CancellationToken cancellationToken
  )
  {
    cancellationToken.ThrowIfCancellationRequested();

    // Retrieve chat messages
    IEnumerable<ChatMessage> chatMessages = await _chatService.GetChatMessagesAsync(userId, request.ChatId);

    // Convert chat messages to Langchain format
    List<BaseLangchainMessage> langchainMessages = ConvertToLangchainMessages(chatMessages);

    var qryRequest = new QryRequest
    {
      QryData = new QryData
      {
        MessageHistory = langchainMessages
      },
      QryMetadata = new QryMetadata
      {
        RepoName = request.RepoName
      }
    };

    try
    {
      HttpResponseMessage response = await _qryHttpClient.PostAsJsonAsync("/qry", qryRequest, cancellationToken);

      string responseContent = await response.Content.ReadAsStringAsync(cancellationToken);

      // Debug: Log the actual response to understand its structure
#pragma warning disable CA1848 // Use the LoggerMessage delegates for performance
      _logger.LogInformation("QRY API Response: {ResponseContent}", responseContent);
#pragma warning restore CA1848

      if (!response.IsSuccessStatusCode)
      {
        _logger.LogGenericError(
          nameof(QueryAgentAsync),
          $"QRY API error: {(int)response.StatusCode} - {responseContent}",
          new HttpRequestException($"QRY API returned {response.StatusCode}")
        );

        throw new HttpRequestException($"QRY API returned {response.StatusCode}: {responseContent}");
      }

      QryResponse qryResponse = JsonSerializer.Deserialize<QryResponse>(responseContent, _options)!;
      _logger.LogMethodEnd(nameof(QueryAgentAsync));

      // Extract the AI's response from the message history
      // The last AI message in the response should be the agent's final response
      var aiResponse = qryResponse.Output
        .Where(msg => msg.Type == "ai")
        .LastOrDefault();

      string output = aiResponse?.Content ?? "No response generated from AI agent.";

      return new AgentResult { Output = output };
    }
    catch (HttpRequestException ex)
    {
      _logger.LogGenericError(nameof(QueryAgentAsync), $"req: {JsonSerializer.Serialize(qryRequest)}", ex);
      throw; // Re-throw the exception instead of returning an error message
    }
    catch (Exception ex)
    {
      _logger.LogGenericError(nameof(QueryAgentAsync), "Unexpected error in QueryAgentAsync", ex);
      throw; // Re-throw the exception instead of returning an error message
    }
  }

  private static List<BaseLangchainMessage> ConvertToLangchainMessages(IEnumerable<ChatMessage> chatMessages)
  {
    var langchainMessages = new List<BaseLangchainMessage>();

    foreach (var message in chatMessages)
    {
      // Skip repository change messages as they're system messages for UI display
      if (message.Type == "repository_change")
        continue;

      BaseLangchainMessage langchainMessage = message.Type switch
      {
        "text" => new HumanMessage { Type = "human", Content = message.Content },
        "ai" => new AIMessage { Type = "ai", Content = message.Content },
        _ => new HumanMessage { Type = "human", Content = message.Content } // Default to human message for unknown types
      };

      langchainMessages.Add(langchainMessage);
    }

    return langchainMessages;
  }

  public async Task EmbedRepositoryAsync(
    CmdRequest request,
    CancellationToken cancellationToken
  )
  {
    _logger.LogMethodStart(nameof(EmbedRepositoryAsync));

    cancellationToken.ThrowIfCancellationRequested();

    await _daprClient.PublishEventAsync(
        DaprComponents.PubSub,
        DaprComponents.WorkflowTopic,
        request,
        cancellationToken
    );

    _logger.LogMethodEnd(nameof(EmbedRepositoryAsync));
  }
}
