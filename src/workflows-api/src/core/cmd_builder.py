import logging
from typing import Dict, Any
from lxi_framework import (
    DaprConfigs,
    RootCmd,
    ProcStatuses,
    utc_now_timestamp_str,
)


def add_proc_struct(cmd: RootCmd, topic_name: str) -> Dict[str, Any]:
    return {
        "cmd": cmd,
        "proc": {
            "target_topic_name": topic_name,
            "proc_status": ProcStatuses.PENDING.value,
            "proc_err": None,
            "utc_created_timestamp": utc_now_timestamp_str(),
        },
    }


def build_embed_repo_workflow_cmd(cmd: RootCmd) -> Dict[str, Any]:
    cmd_post_op = cmd._cmd_post_op_()
    cmd_post_op["cmd_result_enrichment"] = {
        "prop_map": [
            {"key": "__metadata__", "val": {"repo_name": cmd._repo_name_(), "user_id": cmd._user_id_()}}
        ]
    }

    cmd.cmd_metadata["cmd_post_op"] = cmd_post_op

    return add_proc_struct(cmd=cmd, topic_name=DaprConfigs.EMBED_TOPIC.value)


