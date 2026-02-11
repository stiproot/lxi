from typing import List, Optional, T


def first(lst: List[T]) -> Optional[T]:
    return lst[0] if lst else None
