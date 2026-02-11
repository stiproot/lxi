import logging
from typing import Awaitable
from lxi_framework import (
  RootCmd,
  CmdTypes,
)
from .cmd_builder import build_embed_repo_workflow_cmd
from .workflows import (
  exec_next_workflow_cmd,
  update_proc_status,
  build_workflow_struct,
  init_proc_actor_state,
  publish_cmd
)


async def process_cmd(cmd: RootCmd) -> Awaitable:

      workflow_struct = None

      if cmd.cmd_type.value == CmdTypes.EMBED_REPO.value:
          workflow_cmd = build_embed_repo_workflow_cmd(cmd)
          workflow_struct = build_workflow_struct([workflow_cmd], cmd._repo_name_(), cmd._user_id_())

      if workflow_struct is None:
        raise ValueError(f"Unsupported cmd_type: {cmd.cmd_type.value}")

      await init_proc_actor_state(workflow_struct, cmd._repo_name_())
      await publish_cmd(cmd=workflow_cmd)


async def process_receipt_cmd(cmd: RootCmd) -> Awaitable:
    await exec_next_workflow_cmd(cmd=cmd)
