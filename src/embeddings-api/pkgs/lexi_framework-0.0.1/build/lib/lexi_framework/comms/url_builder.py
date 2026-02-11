from urllib.parse import urljoin, urlencode, urlparse, urlunparse
import logging


class UrlBuilder:
    def __init__(self, base_url):
        self._base_url = base_url
        self._path_segments = []
        self._query_params = {}

    def add_path_segment(self, segment):
        self._path_segments.append(segment)
        return self

    def add_query_param(self, key, value):
        self._query_params[key] = value
        return self

    def build(self) -> str:
        url_parts = urlparse(self._base_url)
        path = "/".join(self._path_segments)
        query_string = urlencode(self._query_params)
        url = urlunparse(
            (
                url_parts.scheme,
                url_parts.netloc,
                url_parts.path + path,
                "",
                query_string,
                "",
            )
        )
        logging.info(f"UrlBuilder.build() -> url: {url}")
        return url
