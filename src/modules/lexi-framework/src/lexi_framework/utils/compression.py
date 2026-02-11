from typing import Dict, Any
from json import dumps as json_dumps
from json import loads as json_loads
import gzip
import base64


def compress(data: Dict[str, Any]) -> str:
    compressed_data = gzip.compress(json_dumps(data).encode("utf-8"))
    base64_data = base64.b64encode(compressed_data).decode("utf-8")
    return base64_data


def decompress(compressed_data: str) -> Dict[str, Any]:
    compressed_bytes = base64.b64decode(compressed_data.encode("utf-8"))
    json_bytes = gzip.decompress(compressed_bytes)
    data = json_loads(json_bytes.decode("utf-8"))
    return data
