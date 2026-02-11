import logging
from lxi_framework import EnvVarProvider
import httpx
from typing import Optional


class HttpxClient:

    def __init__(self, headers: dict[str, str]):
        self._headers = headers
        self._client = self.create_client()

    def create_client(self) -> httpx.Client:
        return httpx.Client(verify=False)

    def get(self, url: str, headers: Optional[dict[str, str]] = None):
        return self._client.get(url, headers=self._headers)

    def post(
        self, url: str, json: dict[str, str], headers: Optional[dict[str, str]] = None
    ):
        return self._client.post(url, headers=self._headers, json=json)
