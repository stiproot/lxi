import os
from typing import Awaitable, Dict, Any, Optional
from json import dumps as json_dumps
import logging
from langchain_chroma import Chroma
from agntsmth_core.core.utls import (
    exec_sh_cmd,
    EnvVarProvider,
    ChromaHttpClientFactory,
    log,
)
from lxi_framework import RootCmd, DaprConfigs, publish_event

from .embed import embed_file_system, create_embedding_function


env = EnvVarProvider()
chroma_client = ChromaHttpClientFactory().create_with_auth()
embedding_function = create_embedding_function()


repo_dir_path: str = (
    lambda repo_name: f"{env.get_env_var('REPOS_TARGET_DIR')}/{repo_name}"
)


async def rm_repo(repo_name: str) -> Awaitable:
    log(f"{rm_repo.__name__} START.")

    dir_path = repo_dir_path(repo_name)

    rm_cmd = f"rm -rf {dir_path}"
    exec_sh_cmd(rm_cmd)

    log(f"{rm_repo.__name__} END.")


async def clone_repo(repo_name: str, branch_name: Optional[str] = None) -> Awaitable:
    log(f"{clone_repo.__name__} START.")

    pat = env.get_env_var("PAT")
    if not pat:
        raise ValueError("No PAT found in environment variables.")

    organization = env.get_env_var("AZDO_ORGANIZATION") or "your-organization"
    clone_url = f"https://{pat}@dev.azure.com/{organization}/Software/_git/{repo_name}"
    dir_path = repo_dir_path(repo_name)

    if branch_name:
        clone_cmd = f"git clone --depth 1 --branch {branch_name} {clone_url} {dir_path}"
    else:
        clone_cmd = f"git clone --depth 1 {clone_url} {dir_path}"

    exec_sh_cmd(clone_cmd)

    log(f"{clone_repo.__name__} END.")


async def process_clone_cmd(cmd: RootCmd) -> Awaitable:
    log(f"{process_clone_cmd.__name__} START.")

    repo_name = cmd._repo_name_()
    branch_name = cmd.cmd_metadata.get("branch_name", None)

    await clone_repo(repo_name, branch_name)
    log(f"{process_clone_cmd.__name__} END.")


async def process_embed_cmd(cmd: RootCmd) -> Awaitable:
    log(f"{process_embed_cmd.__name__} START.")

    repo_name = cmd._repo_name_()
    dir_path = repo_dir_path(repo_name)
    log(f"{process_embed_cmd.__name__} -> repo_name: {repo_name}, dir_path: {dir_path}")

    await embed_file_system(dir_path, repo_name)
    log(f"{process_embed_cmd.__name__} END.")


async def process_rm_clone_embed_cmd(cmd: RootCmd) -> Awaitable:
    log(f"{process_rm_clone_embed_cmd.__name__} START.")

    repo_name = cmd._repo_name_()
    branch_name = cmd.cmd_metadata.get("branch_name", None)

    dir_path = repo_dir_path(repo_name)
    log(
        f"{process_rm_clone_embed_cmd.__name__} -> repo_name: {repo_name}, branch_name: {branch_name}, dir_path: {dir_path}"
    )

    await rm_repo(repo_name)
    await clone_repo(repo_name, branch_name)
    await embed_file_system(dir_path, repo_name)
    await rm_repo(repo_name)

    await publish_event(
        pubsub_name=DaprConfigs.DAPR_PUBSUB_NAME.value,
        topic_name=DaprConfigs.EMBED_RECEIPT_TOPIC.value,
        data=json_dumps(cmd._to_dict_()),
    )

    log(f"{process_rm_clone_embed_cmd.__name__} END.")


def create_retriever(collection_name: str):
    vector_store = Chroma(
        embedding_function=embedding_function,
        collection_name=collection_name,
        client=chroma_client,
    )
    retriever = vector_store.as_retriever()
    return retriever


async def process_qry_cmd(cmd: Dict[str, Any]) -> Awaitable:
    log(f"{process_qry_cmd.__name__} START.")

    qry = cmd["qry"]
    file_system_name = cmd["file_system_name"]

    retriever = create_retriever(file_system_name)
    documents = retriever.invoke(qry)
    resp = {
        "documents": [
            {"source": doc.metadata["source"], "page_content": doc.page_content}
            for doc in documents
        ]
    }

    log(f"{process_qry_cmd.__name__} END.")

    return resp
