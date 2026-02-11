from typing import Awaitable, T
from abc import abstractmethod
from dapr.actor import ActorInterface, Actor, actormethod, ActorProxy, ActorId
from json import loads as json_loads
import logging
from lxi_framework import compress, decompress


class LxiEmbeddingActorInterface(ActorInterface):

    @abstractmethod
    @actormethod(name="set_state")
    async def set_state(self, data: T) -> Awaitable: ...

    @abstractmethod
    @actormethod(name="get_state")
    async def get_state(self) -> Awaitable[T]: ...

    @abstractmethod
    @actormethod(name="clear_state")
    async def clear_state(self) -> Awaitable: ...


class LxiEmbeddingActor(Actor, LxiEmbeddingActorInterface):

    _state_key = "embeddings"
    _actor_id: str

    def __init__(self, ctx, actor_id):
        self._actor_id = actor_id
        super(LxiEmbeddingActor, self).__init__(ctx, actor_id)

    async def _on_activate(self) -> None:
        logging.info(f"{self.__class__.__name__} ACTIVATED!")

    async def _on_deactivate(self) -> None:
        logging.info(f"{self.__class__.__name__} DEACTIVATED!")

    async def set_state(self, data: T) -> Awaitable:
        logging.info(f"{self.__class__.__name__} set_state!")

        if not isinstance(data, dict):
          raise ValueError("Data must be a dictionary")

        compressed_data = compress(data)

        await self._state_manager.set_state(self._state_key, compressed_data)
        await self._state_manager.save_state()

    async def get_state(self) -> Awaitable[T]:
        logging.info(f"{self.__class__.__name__} get_state!")
        has_value, val = await self._state_manager.try_get_state(self._state_key)
        if not has_value:
            return {}

        val = decompress(val)
        return val

    async def clear_state(self) -> Awaitable:
        logging.info(f"{self.__class__.__name__} clear_state!")
        await self._state_manager.remove_state(self._state_key)
        await self._state_manager.save_state()


def create_proxy(actor_type: str, actor_id: str, actor_interface: T) -> "ActorProxy":
    proxy = ActorProxy.create(
        actor_type=actor_type,
        actor_id=ActorId(actor_id),
        actor_interface=actor_interface,
    )
    return proxy


def create_embedding_actor_proxy(actor_id: str) -> LxiEmbeddingActor:
    return create_proxy(LxiEmbeddingActor.__name__, actor_id, LxiEmbeddingActorInterface)

