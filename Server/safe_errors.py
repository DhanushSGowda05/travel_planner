import os
import re


_QUERY_SECRET = re.compile(
    r"([?&](?:api[_-]?key|access[_-]?token|auth|authorization|key|password|"
    r"secret|token)=)[^&#\s\"']+",
    re.IGNORECASE,
)
_ASSIGNED_SECRET = re.compile(
    r"((?:api[_-]?key|access[_-]?token|authorization|password|secret|token)"
    r"[\"']?\s*[:=]\s*[\"']?)([^\"'\s,;&}\]]+)",
    re.IGNORECASE,
)
_BEARER_SECRET = re.compile(
    r"(\bBearer\s+)[A-Za-z0-9._~+/=-]+",
    re.IGNORECASE,
)


def sanitize_error_message(error):
    message = str(error)
    message = _QUERY_SECRET.sub(r"\1[REDACTED]", message)
    message = _ASSIGNED_SECRET.sub(r"\1[REDACTED]", message)
    message = _BEARER_SECRET.sub(r"\1[REDACTED]", message)

    for name, value in os.environ.items():
        if (
            value
            and len(value) >= 4
            and any(part in name.upper() for part in (
                "KEY",
                "TOKEN",
                "SECRET",
                "PASSWORD",
                "CREDENTIAL",
                "AUTH",
            ))
        ):
            message = message.replace(value, "[REDACTED]")
    return message
