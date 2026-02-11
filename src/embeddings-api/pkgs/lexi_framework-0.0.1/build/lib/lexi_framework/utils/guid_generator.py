from uuid import uuid4


def generate_unique_name(seed: str = "") -> str:
    return f"{seed}{uuid4()}"
