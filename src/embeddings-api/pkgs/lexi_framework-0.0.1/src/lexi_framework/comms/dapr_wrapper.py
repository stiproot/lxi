from dapr.clients import DaprClient
from dapr.clients.grpc._state import StateItem
from json import dumps as json_dumps
from json import loads as json_loads
from typing import Dict, Any, Awaitable, Optional, T, Callable, Union, List
import logging


async def get_state(
    store_name: str,
    key: str,
    partition_key: str,
    default_factory: Optional[Callable[Dict[str, Any], T]] = None,
    default: Optional[T] = None,
) -> Awaitable[Union[Dict[str, Any], T]]:
    metadata = {"contentType": "application/json", "partitionKey": partition_key}

    with DaprClient() as client:
        state_item = client.get_state(
            store_name=store_name, key=key, state_metadata=metadata
        )

        if state_item.data is None or state_item.data == b"":
            return default

        state_obj = state_item.json()
        if default_factory is None:
            return state_obj

        return default_factory(state_obj)


async def query_state(
    store_name: str,
    query: Union[str, Dict[str, Any]],
    partition_key: str,
    default_factory: Optional[Callable[Dict[str, Any], T]] = None,
) -> List[T]:
    with DaprClient() as client:
        query_resp = client.query_state(
            store_name=store_name,
            query=query if isinstance(query, str) else json_dumps(query),
            states_metadata={
                "contentType": "application/json",
                "partitionKey": partition_key,
            },
        )
        obj_results = [r.json() for r in query_resp.results]
        if not default_factory:
            return obj_results

        objs = [default_factory(r) for r in obj_results]
        return objs


async def save_state(
    store_name: str,
    payload: Dict[str, Any],
    key: Optional[str] = None,
    partition_key: Optional[str] = None,
) -> Awaitable:
    k = key if key else payload["uid"]
    metadata = {"contentType": "application/json"}
    if partition_key:
        metadata["partitionKey"] = partition_key

    state_item = StateItem(key=k, value=json_dumps(payload), metadata=metadata)
    with DaprClient() as client:
        client.save_bulk_state(store_name=store_name, states=[state_item])


async def update_state(
    store_name: str, key: str, delta: Dict[str, Any], partition_key: str
) -> Awaitable:
    metadata = {"contentType": "application/json", "partitionKey": partition_key}

    with DaprClient() as client:
        state = client.get_state(
            store_name=store_name, key=key, state_metadata=metadata
        )
        state_obj = state.json()

        for p in delta:
            state_obj[p] = delta[p]

        metadata = {"contentType": "application/json"}
        if partition_key:
            metadata["partitionKey"] = partition_key

        updated_state = [
            StateItem(key=key, value=json_dumps(state_obj), metadata=metadata)
        ]
        client.save_bulk_state(store_name=store_name, states=updated_state)


async def publish_event(
    pubsub_name: str,
    topic_name: str,
    data: Union[str, Dict[str, Any]],
    data_content_type: str = "application/json",
) -> Awaitable:
    with DaprClient() as client:
        client.publish_event(
            pubsub_name=pubsub_name,
            topic_name=topic_name,
            data=data if isinstance(data, str) else json_dumps(data),
            data_content_type=data_content_type,
        )
