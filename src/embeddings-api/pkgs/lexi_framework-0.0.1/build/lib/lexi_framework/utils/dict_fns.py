

def get_nested_property(data, keys, delimiter=".", default=None):
    keys = keys.split(delimiter)
    for key in keys:
        if isinstance(data, dict) and key in data:
            data = data[key]
        else:
            return default
    return data


def get_nested_property_with_default(
    data, keys, delimiter=".", default=None
) -> tuple[any, bool]:
    keys = keys.split(delimiter)
    for key in keys:
        is_instance = isinstance(data, dict)
        key_in_data = key in data
        if isinstance(data, dict) and key in data:
            data = data[key]
        else:
            return (default, True)
    return (data, False)
