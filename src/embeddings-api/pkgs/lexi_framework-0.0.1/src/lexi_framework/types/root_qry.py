from typing import Dict, Any
from json import dumps as json_dumps
from pydantic import BaseModel


class RootQry(BaseModel):
    qry_data: Dict[str, Any]
    qry_metadata: Dict[str, Any]

    def _repo_name_(self) -> str:
        return self.qry_metadata["repo_name"]

    def _to_dict_(self) -> Dict[str, Any]:
        return {
            "qry_data": self.qry_data,
            "qry_metadata": self.qry_metadata,
        }

    def _serialize_(self) -> str:
        return json_dumps(self._to_dict_())
