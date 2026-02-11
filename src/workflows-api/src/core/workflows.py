from typing import Awaitable, List, Any, Dict
import logging
import requests
from dapr.clients import DaprClient
from dapr.clients.grpc._state import StateItem
from json import dumps as json_dumps
from lxi_framework import (
    RootCmd,
    CmdTypes,
    DaprConfigs,
    ProcStatuses,
    PartitionKeys,
    hours_between_timestamps,
    first,
    generate_sha256,
    save_state,
    publish_event
)
from .actors import create_proc_proxy


HTTP_HEADERS = {
  'Content-Type': 'application/json'
}


def handle_cmd_post_op_enrichment(payload: Dict[str, Any], cmd: RootCmd) -> None:
    if not payload:
        logging.warn(f"{handle_cmd_post_op_enrichment.__name__} <SKIPPING>, empty payload. repo_name: {cmd._repo_name_()}")
        return
    cmd._apply_cmd_post_op_enrichment_prop_map_(payload)


async def handle_cmd_post_op_result_persistence(cmd: RootCmd) -> Awaitable:

  persistence_metadata = cmd._cmd_post_op_result_persistence_()
  if not persistence_metadata:
    logging.warn(f"{handle_cmd_post_op_result_persistence.__name__} <SKIPPING>, no persistence_metadata. repo_name: {cmd._repo_name_()}")
    return

  target_statestore_name = persistence_metadata["target_statestore_name"]
  target_statestore_key = persistence_metadata["target_statestore_key"]
  target_statestore_partition_key = persistence_metadata.get("target_statestore_partition_key", None)
  payload = cmd.cmd_result

  await save_state(
    store_name=target_statestore_name,
    key=target_statestore_key,
    payload=payload,
    partition_key=target_statestore_partition_key,
  )


def handle_cmd_post_op_result_broadcasts(cmd: RootCmd) -> Awaitable:
  broadcasts_metadata = cmd._cmd_post_op_result_broadcasts_()
  if not broadcasts_metadata:
    logging.warn(f"{handle_cmd_post_op_result_broadcasts.__name__} <SKIPPING>, no broadcasts_metadata. repo_name: {cmd._repo_name_()}")
    return

  for v in broadcasts_metadata:
    req = v["static_payload"] if v.get("static_payload", None) else cmd.cmd_result

    try:
      requests.post(v["url"], headers=HTTP_HEADERS, data=json_dumps(req))
    except Exception as e:
        logging.error(f"{handle_cmd_post_op_result_broadcasts.__name__}. error: {e}")


def hash_cmd(cmd: Dict[str, Any]) -> str:
  return generate_sha256(json_dumps(cmd))


def enrich_cmd_with_workflow_hash(cmd: Dict[str, str], workflow_hash: str) -> Dict[str, str]:
  cmd["cmd_metadata"]["cmd_hash"] = hash_cmd(cmd)
  cmd["cmd_metadata"]["workflow_hash"] = workflow_hash
  return cmd


def build_workflow_struct(
  cmds: List[Dict[str, Any]], repo_name: str, user_id: str
) -> Dict[str, Any]:

    workflow_hash = generate_sha256(json_dumps([cmd["cmd"]._to_dict_() for cmd in cmds]))

    steps = list(
      map(lambda cmd: {"cmd": enrich_cmd_with_workflow_hash(cmd["cmd"]._to_dict_(), workflow_hash), "proc": cmd["proc"]}, cmds)
    )

    return {
      "workflow_hash": workflow_hash,
      "steps": steps,
    }


def any_cmds_still_running(cmds: List[Dict[str, Any]]) -> bool:
    return any(
        cmd["proc"]["proc_status"] == ProcStatuses.RUNNING.value
        for cmd in cmds
    )


async def publish_cmd(cmd: Dict[str, Any]) -> Awaitable:
    topic_name = cmd["proc"]["target_topic_name"]
    await publish_event(
        pubsub_name=DaprConfigs.DAPR_PUBSUB_NAME.value,
        topic_name=topic_name,
        data=cmd["cmd"]._serialize_(),
    )


async def update_proc_status(
    cmd: RootCmd, status: str = ProcStatuses.RUNNING.value, err: str = None
) -> Awaitable[Dict[str, Any]]:

    actor_proxy = create_proc_proxy(actor_id=cmd._repo_name_())
    actor_state = await actor_proxy.get_state()
    if not actor_state:
        logging.warn(f"update_proc_status <SKIPPING>, no state. repo_name: {cmd._repo_name_()}")
        return {}

    workflow_hash = cmd.cmd_metadata["workflow_hash"]
    workflow = actor_state.get(workflow_hash, {})
    if not workflow:
        logging.warn(f"update_proc_status <SKIPPING>, no workflow. repo_name: {cmd._repo_name_()}")
        return {}

    steps = workflow["steps"]

    cmd_hash = cmd.cmd_metadata["cmd_hash"]
    for step in steps:
        if step["cmd"]["cmd_metadata"]["cmd_hash"] == cmd_hash:
            step["cmd"]["cmd_result"] = cmd.cmd_result
            step["proc"]["proc_status"] = status
            break

    await actor_proxy.set_state(actor_state)

    return actor_state


async def exec_next_workflow_cmd(
    cmd: RootCmd, status: str = ProcStatuses.COMPLETE.value
) -> Awaitable:

    actor_state = await update_proc_status(cmd=cmd, status=status)

    # handle cmd_post_op configuration...
    handle_cmd_post_op_enrichment(cmd.cmd_result, cmd)
    await handle_cmd_post_op_result_persistence(cmd)
    handle_cmd_post_op_result_broadcasts(cmd)

    workflow_hash = cmd.cmd_metadata["workflow_hash"]
    workflow = actor_state.get(workflow_hash, {})
    if not workflow:
        logging.warn(f"update_proc_status <SKIPPING>, no workflow. repo_name: {cmd._repo_name_()}")
        return {}

    steps = workflow["steps"]
    next_step = first(
        list(
            filter(
                lambda step: step["proc"]["proc_status"] == ProcStatuses.PENDING.value,
                steps,
            )
        )
    )

    if not next_step:
        logging.warn(f"exec_next_workflow_cmd <SKIPPING>, no {ProcStatuses.PENDING.value} next step. repo_name: {cmd._repo_name_()}")
        return

    await publish_event(
        pubsub_name=DaprConfigs.DAPR_PUBSUB_NAME.value,
        topic_name=next_step["proc"]["target_topic_name"],
        data=next_step["cmd"],
    )


async def init_proc_actor_state(workflow_cmd: Dict[str, Any], repo_name: str) -> Awaitable:
    actor_proxy = create_proc_proxy(actor_id=repo_name)

    actor_state = await actor_proxy.get_state()
    actor_state[workflow_cmd["workflow_hash"]] = workflow_cmd

    await actor_proxy.set_state(actor_state)
