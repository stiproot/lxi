import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dapr.ext.fastapi import DaprApp
from dapr.ext.fastapi import DaprActor
from dapr.actor.runtime.config import (
    ActorRuntimeConfig,
    ActorTypeConfig,
    ActorReentrancyConfig,
)
from dapr.actor.runtime.runtime import ActorRuntime

from lxi_framework import (
    RootCmd,
    CloudEvt,
    DaprConfigs,
)
from core import process_cmd, process_receipt_cmd, LxiProcActor
from endpoints import healthz


logging.basicConfig(level=logging.DEBUG)


app = FastAPI()
app.include_router(healthz.router)

dapr_app = DaprApp(app)
actor = DaprActor(app)

config = ActorRuntimeConfig()
config.update_actor_type_configs(
    [
        ActorTypeConfig(
            actor_type=LxiProcActor.__name__,
            reentrancy=ActorReentrancyConfig(enabled=True),
        )
    ]
)
ActorRuntime.set_actor_config(config)


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    logging.info("Registering actors...")
    await actor.register_actor(LxiProcActor)


@dapr_app.subscribe(
    pubsub=DaprConfigs.DAPR_CMD_WORKFLOW_PUBSUB_NAME.value,
    topic=DaprConfigs.WORKFLOW_TOPIC.value,
    route="/workflows/cmd",
)
async def process_evt(evt: CloudEvt):
    logging.info(f"Received evt.")
    cmd = RootCmd(**evt.data)
    await process_cmd(cmd)
    logging.info(f"Processed evt")


@dapr_app.subscribe(
    pubsub=DaprConfigs.DAPR_CMD_WORKFLOW_PUBSUB_NAME.value,
    topic=DaprConfigs.EMBED_RECEIPT_TOPIC.value,
    route="/receipts/cmd/embed",
)
async def process_receipt_evt(evt: CloudEvt):
    logging.info(f"Received evt (upload): {evt}")
    cmd = RootCmd(**evt.data)
    await process_receipt_cmd(cmd)
    logging.info(f"Processed evt: {evt}")
