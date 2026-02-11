from enum import Enum


class ProcStatuses(Enum):
    PENDING = "PENDING"
    COMPLETE = "COMPLETE"
    RUNNING = "RUNNING"
    ERROR = "ERROR"
    CANCELLED = "CANCELLED"
