

def string_to_enum(enum_class, value):
    for enum_member in enum_class:
        if enum_member.value == value:
            return enum_member
    raise ValueError(f"{value} is not a valid value for {enum_class.__name__}")
