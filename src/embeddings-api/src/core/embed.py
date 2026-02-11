import os
from functools import partial
from multiprocessing import Pool
import logging
from typing import List, Dict, Any, Awaitable, Callable
from langchain_chroma import Chroma
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from agntsmth_core.core.utls import EnvVarProvider, log, traverse_folder, ChromaHttpClientFactory, generate_sha256
from .actors import create_embedding_actor_proxy


DEFAULT_CHUNK_SIZE = 1500
DEFAULT_FILE_PATH_CHUNK_SIZE = 50
DEFAULT_CHUNK_OVERLAP = 50
DEFAULT_IGNORE_FOLDERS="node_modules,.git,bin,obj,__pycache__,models--sentence-transformers--all-MiniLM-L6-v2"
DEFAULT_IGNORE_FILE_EXTS=".pfx,.crt,.cer,.pem,.postman_collection.json,.postman_environment,.png,.gif,.jpeg,.jpg,.ico,.svg,.woff,.woff2,.ttf,.gz,.zip,.tar,.tgz,.tar.gz,.rar,.7z,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"

env = EnvVarProvider()


def create_embedding_function() -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")


def translate_file_path_to_key(file_path: str) -> str:
    return file_path.replace(".", "__").lower()


def create_text_splitter() -> RecursiveCharacterTextSplitter:
    chunk_size = env.get_env_var("CHUNK_SIZE", DEFAULT_CHUNK_SIZE)
    chunk_overlap = env.get_env_var("CHUNK_OVERLAP", DEFAULT_CHUNK_OVERLAP)

    return RecursiveCharacterTextSplitter.from_tiktoken_encoder(
        chunk_size=chunk_size, chunk_overlap=chunk_overlap
    )


def create_vector_store(collection_name: str) -> Chroma:
    chroma_client = ChromaHttpClientFactory.create_with_auth()
    embedding_function = create_embedding_function()
    vector_store = Chroma(
        embedding_function=embedding_function,
        client=chroma_client,
        collection_name=collection_name,
    )

    return vector_store


def process_file_paths(
    file_paths: List[str],
    file_system_name: str,
    actor_state: Dict[str, Any],
) -> None:

    text_splitter = create_text_splitter()
    vector_store = create_vector_store(collection_name=file_system_name)
    embedding_function = create_embedding_function()

    embedded_files_state = {}

    for file_path in file_paths:

        loader = TextLoader(file_path, encoding="utf-8", autodetect_encoding=True)
        docs = loader.load()

        page_content = docs[0].page_content
        hash = generate_sha256(page_content)
        key = translate_file_path_to_key(file_path)

        if actor_state.get(key, {}).get("hash", None):
            # log(f"{process_file_paths.__name__} SKIPPING -> {file_path} already embedded.")
            embedded_files_state[key] = {"hash": hash}
            continue

        split_docs = text_splitter.split_documents(docs)
        split_texts = [doc.page_content for doc in split_docs]

        if not len(split_texts):
            continue

        embeddings = embedding_function.embed_documents(split_texts)
        ids = [f"{file_path}_{i}" for i in range(len(embeddings))]

        vector_store.add_documents(documents=split_docs, embeddings=embeddings, ids=ids)

        embedded_files_state[key] = {"hash": hash}

    return embedded_files_state


async def process_file_paths_concurrent(
    file_paths: List[str],
    file_system_name: str,
    actor_state: Dict[str, Any]
):
    """ Process file paths concurrently. This is a work in progress."""
    file_path_chunk_size = int(env.get_env_var("FILE_PATH_CHUNK_SIZE", DEFAULT_FILE_PATH_CHUNK_SIZE))

    file_path_chunks = [file_paths[i:i + file_path_chunk_size] for i in range(0, len(file_paths), file_path_chunk_size)]

    prtl_process_file_paths = partial(
        process_file_paths,
        file_system_name=file_system_name,
        actor_state=actor_state,
    )

    with Pool() as pool:
        embedded_file_states = pool.map(prtl_process_file_paths, file_path_chunks)

    merged_embedded_file_states = {}
    for state in embedded_file_states:
        merged_embedded_file_states.update(state)

    actor = create_embedding_actor_proxy(file_system_name)
    await actor.set_state(merged_embedded_file_states)


async def embed_file_system(file_system_path: str, file_system_name:str) -> Awaitable:
    log(f"{embed_file_system.__name__} START.")

    ignore_folders = env.get_env_var("IGNORE_FOLDERS", DEFAULT_IGNORE_FOLDERS).split(",")
    ignore_file_exts = env.get_env_var("IGNORE_FILE_EXTS", DEFAULT_IGNORE_FILE_EXTS).split(",")

    file_dict = traverse_folder(file_system_path, ignore_folders, ignore_file_exts)
    file_paths = [f"{k}/{f}" for k, v in file_dict.items() for f in v]

    actor = create_embedding_actor_proxy(file_system_name)
    actor_state = await actor.get_state()

    updated_actor_state = process_file_paths(file_paths, file_system_name, actor_state)

    actor = create_embedding_actor_proxy(file_system_name)
    await actor.set_state(updated_actor_state)

    log(f"{embed_file_system.__name__} END.")
