namespace Models.Core;

public abstract class BaseLangchainMessage
{
  public required string Type { get; set; }
  public required string Content { get; set; }
}

public class HumanMessage : BaseLangchainMessage
{
  public HumanMessage()
  {
    Type = "human";
  }
}

public class AIMessage : BaseLangchainMessage
{
  public AIMessage()
  {
    Type = "ai";
  }
}

public class SystemMessage : BaseLangchainMessage
{
  public SystemMessage()
  {
    Type = "system";
  }
}

public class ToolMessage : BaseLangchainMessage
{
  public ToolMessage()
  {
    Type = "tool";
  }
}
