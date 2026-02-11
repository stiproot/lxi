import requests
from langchain.schema import BaseRetriever, Document
from pydantic import BaseModel
from agntsmth_core.core.utls import log


class RemoteEmbeddingRetriever(BaseRetriever, BaseModel):

    api_url: str = ""
    file_system_name: str = ""

    def __init__(self, api_url: str, file_system_name: str, /, **kwargs):
        """
        Initializes the retriever.

        param api_url: Base URL of the embeddings-api.
        file_system_path: The file system path, used as context for the query.
        """

        super().__init__(**kwargs)

        self.api_url = api_url
        self.file_system_name = file_system_name

    def get_relevant_documents(self, query: str) -> list[Document]:
        """
        Retrieves relevant documents for a query.

        :param query: The input query.
        :return: A list of relevant LangChain Document objects.
        """
        response = requests.post(f"{self.api_url}/qry", json={"qry": query, "file_system_name": self.file_system_name})
        response.raise_for_status()  # Ensure no HTTP errors
        results = response.json()  # Expecting results in a specific format

        # Convert API response to LangChain Documents
        documents = [
            Document(page_content=doc["page_content"], metadata={"source": doc["source"]})
            for doc in results.get("output", {}).get("documents", [])
        ]
        return documents

    async def aget_relevant_documents(self, query: str) -> list[Document]:
        """
        Asynchronous retrieval of relevant documents.

        :param query: The input query.
        :return: A list of relevant LangChain Document objects.
        """
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.api_url}/qry", json={"qry": query, "file_system_name": self.file_system_name}) as response:
                if response.status != 200:
                    raise ValueError(f"Error from embeddings-api: {response.status}")
                results = await response.json()
                documents = [
                    Document(page_content=doc["page_content"], metadata={"source": doc["source"]})
                    for doc in results.get("documents", [])
                ]
                return documents
