import logging
from abc import abstractmethod
from typing import Optional, Awaitable, T
from dapr.actor import ActorInterface, actormethod, Actor, ActorProxy, ActorId
from json import loads as json_loads


class LxiProcActorInterface(ActorInterface):

    @abstractmethod
    @actormethod(name="set_state")
    async def set_state(self, data: T) -> Awaitable: ...

    @abstractmethod
    @actormethod(name="get_state")
    async def get_state(self) -> Awaitable[T]: ...

    @abstractmethod
    @actormethod(name="clear_state")
    async def clear_state(self) -> Awaitable: ...


class LxiProcActor(Actor, LxiProcActorInterface):

    _state_key = "procs"
    _actor_id: str

    def __init__(self, ctx, actor_id):
        self._actor_id = actor_id
        super(LxiProcActor, self).__init__(ctx, actor_id)

    async def _on_activate(self) -> None:
        logging.info(f"Activate {self.__class__.__name__} actor!")

    async def _on_deactivate(self) -> None:
        logging.info(f"Deactivate {self.__class__.__name__} actor!")

    async def set_state(self, data: T) -> Awaitable:
        print(f"set_state")
        await self._state_manager.set_state(self._state_key, data)
        await self._state_manager.save_state()

    async def get_state(self) -> Awaitable[T]:
        logging.info(f"get_state")
        has_value, val = await self._state_manager.try_get_state(self._state_key)
        if not has_value:
            return {}
        return val

    async def clear_state(self) -> Awaitable:
        logging.info("clear_state")
        await self._state_manager.remove_state(self._state_key)
        await self._state_manager.save_state()


def create_proxy(actor_type: str, actor_id: str, actor_interface: T) -> "ActorProxy":
    proxy = ActorProxy.create(
        actor_type=actor_type,
        actor_id=ActorId(actor_id),
        actor_interface=actor_interface,
    )
    return proxy


def create_proc_proxy(actor_id: str) -> LxiProcActor:
    return create_proxy(LxiProcActor.__name__, actor_id, LxiProcActorInterface)
