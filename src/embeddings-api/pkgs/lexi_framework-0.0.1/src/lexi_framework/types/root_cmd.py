from json import dumps as json_dumps
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from ..types.cmd_types import CmdTypes
from ..utils.enum_fns import string_to_enum


class RootCmd(BaseModel):
    cmd_type: CmdTypes
    cmd_data: Dict[str, Any]
    cmd_metadata: Dict[str, Any]
    cmd_result: Optional[Dict[str, Any]]

    # cmd_metadata helpers...

    def _user_id_(self) -> str:
        return self.cmd_metadata.get("user_id", "sys")

    def _repo_name_(self) -> str:
        return self.cmd_metadata.get("repo_name", "default")

    def _cmd_post_op_(self) -> Dict[str, Any]:
        return self.cmd_metadata.get("cmd_post_op", {})

    # data transform helpers...

    def _cmd_key_(self) -> str:
        return self.cmd_type.value

    def _to_dict_(self) -> Dict[str, Any]:
        return {
            "cmd_type": self.cmd_type.value,
            "cmd_data": self.cmd_data,
            "cmd_metadata": self.cmd_metadata,
            "cmd_result": self.cmd_result,
        }

    def _serialize_(self) -> str:
        return json_dumps(self._to_dict_())

    # cmd_post_op helpers...

    def _cmd_post_op_result_enrichment_(self) -> Dict[str, Any]:
        return self._cmd_post_op_().get("cmd_result_enrichment", {})

    def _cmd_post_op_result_persistence_(self) -> Dict[str, Any]:
        return self._cmd_post_op_().get("cmd_result_persistence", {})

    def _cmd_post_op_result_broadcasts_(self) -> Dict[str, Any]:
        return self._cmd_post_op_().get("cmd_result_broadcasts", [])

    def _cmd_post_op_result_enrichment_prop_map_(self) -> List[Dict[str, Any]]:
        return self._cmd_post_op_result_enrichment_().get("prop_map", [])

    def _apply_cmd_post_op_enrichment_prop_map_(self, target: Dict[str, Any]) -> None:
        for m in self._cmd_post_op_result_enrichment_prop_map_():
            target[m["key"]] = m["val"]

