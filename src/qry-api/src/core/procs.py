from typing import Awaitable
from langchain_core.messages import (
    BaseMessage,
)
from agntsmth_core.core.utls import log
from lxi_framework import RootQry

from .agent import build_graph
from .maps import dict_to_message, message_to_dict


async def process_qry(qry: RootQry) -> Awaitable[list[BaseMessage]]:
    log(f"{process_qry.__name__} START. qry: {qry}")

    repo_name = qry._repo_name_()
    graph = build_graph(repo_name)

    typed_message_history = [
        dict_to_message(m) for m in qry.qry_data["message_history"]
    ]

    state = graph.invoke(input={"message_history": typed_message_history})

    log(f"{process_qry.__name__} END. qry: {qry}")

    return [message_to_dict(m) for m in state["message_history"] if m.content != ""]
