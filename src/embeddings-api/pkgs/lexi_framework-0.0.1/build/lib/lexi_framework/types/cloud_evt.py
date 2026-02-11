from pydantic import BaseModel


class CloudEvt(BaseModel):
    data: dict
    datacontenttype: str
    id: str
    pubsubname: str
    source: str
    specversion: str
    time: str
    topic: str
    traceid: str
    traceparent: str
    tracestate: str
    type: str