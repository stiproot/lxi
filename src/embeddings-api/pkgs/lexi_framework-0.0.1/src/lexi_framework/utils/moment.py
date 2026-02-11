from datetime import datetime, timezone
import logging


timestamp_format = "%Y-%m-%dT%H:%M:%S"


def utc_now_timestamp_str() -> str:
    utc_now = datetime.utcnow()
    formatted = utc_now.strftime(timestamp_format)
    return str(formatted)


def hours_between_timestamps(utc_timestamp_from: str, utc_timestamp_to: str) -> int:
    logging.debug(
        f"utc_timestamp_from: {utc_timestamp_from} ({type(utc_timestamp_from)}), utc_timestamp_to: {utc_timestamp_to} ({type(utc_timestamp_to)})"
    )
    if not utc_timestamp_from or not utc_timestamp_to:
        return 4

    utc_from = (
        datetime.strptime(utc_timestamp_from, timestamp_format)
        if type(utc_timestamp_from) == str
        else utc_timestamp_from
    )
    utc_to = (
        datetime.strptime(utc_timestamp_to, timestamp_format)
        if type(utc_timestamp_to) == str
        else utc_timestamp_to
    )
    diff = utc_to - utc_from
    diff_in_hours = diff.total_seconds() / 3600
    logging.info(f"diff_in_hours: {diff_in_hours}")
    return int(diff_in_hours)
