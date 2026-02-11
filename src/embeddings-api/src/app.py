import logging
from typing import Any, Dict
from json import dumps as json_dumps

from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware

from dapr.ext.fastapi import DaprApp
from dapr.ext.fastapi import DaprActor
from dapr.actor.runtime.config import (
    ActorRuntimeConfig,
    ActorTypeConfig,
    ActorReentrancyConfig,
)
from dapr.actor.runtime.runtime import ActorRuntime

from lxi_framework import RootCmd, CloudEvt, DaprConfigs

from core import (
    process_clone_cmd,
    process_embed_cmd,
    process_rm_clone_embed_cmd,
    process_qry_cmd,
    LxiEmbeddingActor,
)
from endpoints import healthz


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(healthz.router)

dapr_app = DaprApp(app)
dapr_actor = DaprActor(app)
actor_runtime_config = ActorRuntimeConfig()
actor_runtime_config.update_actor_type_configs(
    [
        ActorTypeConfig(
            actor_type=LxiEmbeddingActor.__name__,
            reentrancy=ActorReentrancyConfig(enabled=True),
        )
    ]
)
ActorRuntime.set_actor_config(actor_runtime_config)


@app.on_event("startup")
async def startup_event():
    logging.info("Registering actors...")
    await dapr_actor.register_actor(LxiEmbeddingActor)


@app.post("/clone")
async def handle_clone_cmd(cmd: RootCmd):
    logging.info(f"{handle_clone_cmd.__name__} START.")
    await process_clone_cmd(cmd)
    logging.info(f"{handle_clone_cmd.__name__} END.")


@app.post("/embed")
async def handle_embed_cmd(cmd: RootCmd):
    logging.info(f"{handle_embed_cmd.__name__} START.")
    await process_embed_cmd(cmd)
    logging.info(f"{handle_embed_cmd.__name__} END.")


@dapr_app.subscribe(
    pubsub=DaprConfigs.DAPR_CMD_EMBED_PUBSUB_NAME.value,
    topic=DaprConfigs.EMBED_TOPIC.value,
    route="/rm-clone-embed",
)
async def handle_rm_clone_embed_evt(evt: CloudEvt):
    # update workflow status to RUNNING...
    cmd = RootCmd(**evt.data)
    logging.info(f"handle_rm_clone_embed_evt START. repo_name: {cmd._repo_name_()}")
    await process_rm_clone_embed_cmd(cmd)
    logging.info(f"handle_rm_clone_embed_evt END. repo_name: {cmd._repo_name_()}")


@app.post("/qry")
async def handle_qry_cmd(cmd: Dict[str, Any]):
    logging.info(f"{handle_qry_cmd.__name__} START.")
    output = await process_qry_cmd(cmd)
    resp = json_dumps({"output": output})
    logging.info(f"{handle_qry_cmd.__name__} END.")
    return Response(content=resp, status_code=status.HTTP_200_OK)
