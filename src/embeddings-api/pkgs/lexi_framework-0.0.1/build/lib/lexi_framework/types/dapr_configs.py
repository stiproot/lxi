from enum import Enum


class DaprConfigs(Enum):
    DAPR_ACTORSTATE_STATESTORE_NAME = "statestore-actorstate"
    DAPR_PUBSUB_NAME = "pubsub"
    DAPR_CMD_WORKFLOW_PUBSUB_NAME = "pubsub-cmd-workflows"
    DAPR_CMD_EMBED_PUBSUB_NAME = "pubsub-cmd-embed"
    WORKFLOW_TOPIC = "LEXI_CMD_WORKFLOWS"
    EMBED_TOPIC = "LEXI_CMD_EMBED"
    EMBED_RECEIPT_TOPIC = "LEXI_CMD_EMBED_RECEIPTS"


class PartitionKeys(Enum):
    PROCS = "procs"
    USRS = "usrs"
