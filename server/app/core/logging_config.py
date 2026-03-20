"""
Centralized logging configuration for the application.

Call `setup_logging()` once at application startup (in the lifespan)
to configure all loggers under the `app.*` namespace.
"""

import logging
import sys

LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def setup_logging(level: str = "INFO") -> None:
    """
    Configure the root 'app' logger and silence noisy third-party loggers.

    Args:
        level: Log level string (DEBUG, INFO, WARNING, ERROR, CRITICAL).
    """
    numeric_level = getattr(logging, level.upper(), logging.INFO)

    # ── App logger ────────────────────────────────────────────────────────
    app_logger = logging.getLogger("app")
    app_logger.setLevel(numeric_level)

    if not app_logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(numeric_level)
        handler.setFormatter(logging.Formatter(LOG_FORMAT, datefmt=LOG_DATE_FORMAT))
        app_logger.addHandler(handler)

    # Prevent log records from propagating to the root logger
    app_logger.propagate = False

    # ── Silence noisy third-party loggers ─────────────────────────────────
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("hpack").setLevel(logging.WARNING)

    app_logger.info("Logging initialised (level=%s)", level.upper())
