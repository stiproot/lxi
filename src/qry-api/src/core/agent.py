import functools
import operator
import logging
from typing import TypedDict, Sequence, Annotated

from langchain_core.messages import BaseMessage, ToolMessage
from langchain_core.tools import Tool

from langgraph.graph import START, END, StateGraph

from agntsmth_core.core.utls import (
    ModelFactory,
    EnvVarProvider,
)
from agntsmth_core.core.tools import RetrieveAdditionalContextTool

from .retrievers import RemoteEmbeddingRetriever


env = EnvVarProvider()


class GraphState(TypedDict):
    message_history: Annotated[Sequence[BaseMessage], operator.add]


def should_invoke_tools(state: GraphState):
    logging.info(f"{should_invoke_tools.__name__} START.")

    message_history = state["message_history"]

    last_message = message_history[-1]

    if last_message.tool_calls:
        logging.info(f"{should_invoke_tools.__name__} END. invoke_tools!")
        return "invoke_tools"

    logging.info(f"{should_invoke_tools.__name__} END. continue!")
    return "continue"


def invoke_tools(state: GraphState, tools):
    logging.info(f"{invoke_tools.__name__} START.")

    message_history = state["message_history"]
    last_message = message_history[-1]

    tool_messages = []
    for tool_call in last_message.tool_calls:
        try:
            tool_name = tool_call["name"]
            tool_args = tool_call["args"]

            for tool in tools:
                if tool.name == tool_name:
                    response = tool.invoke(tool_args)
                    break
            else:
                response = f"Tool {tool_name} not found"

            tool_messages.append(
                ToolMessage(
                    content=str(response),
                    name=tool_call["name"],
                    tool_call_id=tool_call["id"],
                )
            )
        except Exception as e:
            tool_messages.append(
                ToolMessage(
                    content=f"Error: {str(e)}",
                    name=tool_call.get("name", "unknown"),
                    tool_call_id=tool_call.get("id", "unknown"),
                )
            )

    logging.info(f"{invoke_tools.__name__} END.")
    return {"message_history": tool_messages}


def invoke_agent(llm, state, format_response_fn=lambda r: r):
    message_history = state["message_history"]
    response = llm.invoke(message_history)
    return {"message_history": [format_response_fn(response)]}


def build_tools(repo_name: str) -> list[Tool]:
    host = env.get_env_var("EMBEDDINGS_API_HOST")
    retriever = RemoteEmbeddingRetriever(host, repo_name)
    context_retriever_tool = RetrieveAdditionalContextTool(retriever)
    return [context_retriever_tool]


def build_graph(repo_name: str):
    tools = build_tools(repo_name)

    llm = ModelFactory.create(tools=tools)
    invoke_llm_fn = lambda state: invoke_agent(llm, state)

    graph = StateGraph(GraphState)

    graph.add_node("agent", invoke_llm_fn)
    graph.add_node("invoke_tools", functools.partial(invoke_tools, tools=tools))
    graph.add_edge(START, "agent")
    graph.add_conditional_edges(
        "agent",
        should_invoke_tools,
        {
            "invoke_tools": "invoke_tools",
            "continue": END,
        },
    )
    graph.add_edge("invoke_tools", "agent")
    graph.add_edge("agent", END)

    return graph.compile()
