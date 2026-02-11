from langchain_core.messages import (
    BaseMessage,
    HumanMessage,
    AIMessage,
    SystemMessage,
    ToolMessage,
)
from agntsmth_core.core.utls import log

TYPE_HASH = {
    "human": HumanMessage,
    "ai": AIMessage,
    "system": SystemMessage,
    "tool": ToolMessage,
}


def message_to_dict(msg: BaseMessage) -> dict:
    return {
        "type": msg.type,
        "content": msg.content,
    }


def dict_to_message(msg: dict) -> BaseMessage:
    return TYPE_HASH[msg["type"]](**msg)
