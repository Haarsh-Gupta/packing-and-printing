"""
Utility for generating human-readable display IDs.

NanoID strategy:  prefix + 4-6 uppercase alphanumeric chars  (e.g. INQ-X8B2)
Sequence strategy: prefix + YYYY + zero-padded counter       (e.g. ORD-2026-0001)
"""

import secrets
import string
from datetime import datetime, timezone

_ALPHABET = string.ascii_uppercase + string.digits  # A-Z 0-9


def generate_nanoid(prefix: str, length: int = 4) -> str:
    """Generate a short random display ID like INQ-X8B2."""
    body = "".join(secrets.choice(_ALPHABET) for _ in range(length))
    return f"{prefix}-{body}"
