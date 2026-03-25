"""
Production-grade, async-safe, JSON-structured logging architecture.

Components
──────────
1. `correlation_id` contextvars – per-request tracing across the async event loop.
2. `JSONFormatter` – strict JSON output with automatic field injection.
3. QueueHandler / QueueListener – zero-blocking async logging to stdout.
4. Third-party logger hijacking – uvicorn, sqlalchemy, httpx, etc.
5. `setup_logging()` – single entry point called once in the FastAPI lifespan.

Usage in any module:
    import logging
    logger = logging.getLogger(__name__)
    logger.info("order created", extra={"user_id": 123, "order_id": "abc"})
"""

from __future__ import annotations

import atexit
import json
import logging
import logging.config
import logging.handlers
import os
import sys
import traceback
from contextvars import ContextVar
from datetime import datetime, timezone
from queue import SimpleQueue
from typing import Any

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1.  CONTEXT  ─  correlation_id (set per-request by middleware)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
correlation_id: ContextVar[str | None] = ContextVar("correlation_id", default=None)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2.  JSON FORMATTER
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class JSONFormatter(logging.Formatter):
    """
    Emits each log record as a single-line JSON object.

    Mandatory fields (always present):
        timestamp, level, logger_name, correlation_id, message

    Optional fields:
        - Any key passed via `extra={}` is merged at the top level.
        - Exception info is serialised as `exc_info` string.
    """

    # Keys that belong to the standard LogRecord and should NOT leak into
    # the JSON payload's top level.
    _RESERVED = frozenset({
        "args", "created", "exc_info", "exc_text", "filename",
        "funcName", "levelname", "levelno", "lineno", "module",
        "msecs", "message", "msg", "name", "pathname", "process",
        "processName", "relativeCreated", "stack_info", "thread",
        "threadName", "taskName",
    })

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger_name": record.name,
            "correlation_id": correlation_id.get(),
            "message": record.getMessage(),
        }

        # Merge caller-supplied `extra` fields (anything not reserved).
        for key, value in record.__dict__.items():
            if key not in self._RESERVED and key not in payload:
                payload[key] = value

        # Serialise exception info.
        if record.exc_info and record.exc_info[0] is not None:
            payload["exc_info"] = self.formatException(record.exc_info)

        if record.stack_info:
            payload["stack_info"] = self.formatStack(record.stack_info)

        return json.dumps(payload, default=str, ensure_ascii=False)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3 + 5.  dictConfig  ─  QueueHandler + third-party hijacking
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# We create the queue ourselves so the QueueListener can reference
# the same object.  `SimpleQueue` is unbounded and GIL-safe.
_log_queue: SimpleQueue = SimpleQueue()

# The QueueListener is started once and stopped at interpreter exit.
_listener: logging.handlers.QueueListener | None = None


def _build_dict_config(level: str) -> dict:
    """
    Return a logging `dictConfig` dict that:
      • Routes ALL app loggers through a QueueHandler → stdout.
      • Hijacks uvicorn, sqlalchemy, httpx, etc.
      • Uses JSONFormatter for everything.
    """
    return {
        "version": 1,
        "disable_existing_loggers": False,

        # ── Formatters ────────────────────────────────────────────────────
        "formatters": {
            "json": {
                "()": f"{__name__}.JSONFormatter",
            },
        },

        # ── Handlers ─────────────────────────────────────────────────────
        "handlers": {
            # The QueueHandler is the ONLY handler attached to loggers.
            # It never blocks; it just puts records onto the SimpleQueue.
            "queue": {
                "class": "logging.handlers.QueueHandler",
                "queue": _log_queue,
            },
        },

        # ── Loggers ──────────────────────────────────────────────────────
        "loggers": {
            # ┌─ Application ──────────────────────────────────────────────
            "app": {
                "level": level,
                "handlers": ["queue"],
                "propagate": False,
            },

            # ┌─ Third-party hijacking (Component 5) ─────────────────────
            "uvicorn": {
                "level": "WARNING",
                "handlers": ["queue"],
                "propagate": False,
            },
            "uvicorn.error": {
                "level": "WARNING",
                "handlers": ["queue"],
                "propagate": False,
            },
            "uvicorn.access": {
                "level": "INFO",
                "handlers": ["queue"],
                "propagate": False,
            },
            "sqlalchemy.engine": {
                "level": "WARNING",
                "handlers": ["queue"],
                "propagate": False,
            },
            "httpx": {
                "level": "WARNING",
                "handlers": ["queue"],
                "propagate": False,
            },
            "httpcore": {
                "level": "WARNING",
                "handlers": ["queue"],
                "propagate": False,
            },
            "hpack": {
                "level": "WARNING",
                "handlers": ["queue"],
                "propagate": False,
            },
        },

        # ── Root ─────────────────────────────────────────────────────────
        "root": {
            "level": "WARNING",
            "handlers": ["queue"],
        },
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PUBLIC  ─  setup + teardown
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def setup_logging(level: str = "INFO") -> None:
    """
    Initialise the full logging pipeline.  Call ONCE in the FastAPI lifespan.

    1.  Apply dictConfig (QueueHandler on all loggers).
    2.  Create a StreamHandler(stdout) with JSONFormatter.
    3.  Start a QueueListener that drains the queue → StreamHandler.
    """
    global _listener

    env_level = os.getenv("LOG_LEVEL", level).upper()

    # 1. Apply dict config
    logging.config.dictConfig(_build_dict_config(env_level))

    # 2. The real stdout handler (the only thing that actually writes I/O)
    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setFormatter(JSONFormatter())
    stdout_handler.setLevel(logging.DEBUG)  # let the loggers decide level

    # 3. QueueListener drains the queue on a background thread
    _listener = logging.handlers.QueueListener(
        _log_queue,
        stdout_handler,
        respect_handler_level=True,
    )
    _listener.start()
    atexit.register(shutdown_logging)

    root = logging.getLogger("app")
    root.info(
        "Logging architecture initialised",
        extra={"log_level": env_level, "pid": os.getpid()},
    )


def shutdown_logging() -> None:
    """Drain the queue and stop the listener.  Safe to call multiple times."""
    global _listener
    if _listener is not None:
        _listener.stop()
        _listener = None
