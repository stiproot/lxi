import os
from typing import List, Dict, Any, Awaitable
from langchain_chroma import Chroma
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from agntsmth_core.core.utls import log, ChromaHttpClientFactory


DEFAULT_CHUNK_SIZE = 1500
DEFAULT_CHUNK_OVERLAP = 50


def create_embedding_function() -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")


async def embed_txt() -> Awaitable:
    log(f"{embed_text.__name__} START.")

    chroma_client = ChromaHttpClientFactory.create_with_auth()
    embedding_function = create_embedding_function()

    text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
        chunk_size=DEFAULT_CHUNK_SIZE, chunk_overlap=DEFAULT_CHUNK_OVERLAP
    )
    vector_store = Chroma(
        embedding_function=embedding_function,
        client=chroma_client,
        collection_name="tmp_embed",
    )

    FILE_PATH = "/app/tmp.txt"

    loader = TextLoader(FILE_PATH)
    docs = loader.load()
    split_docs = text_splitter.split_documents(docs)
    split_texts = [doc.page_content for doc in split_docs]

    embeddings = embedding_function.embed_documents(split_texts)
    ids = [f"{file_path}_{i}" for i in range(len(embeddings))]

    vector_store.add_documents(documents=split_docs, embeddings=embeddings, ids=ids)

    log(f"{embed_text.__name__} END.")


if __name__ == "__main__":
    embed_txt()
