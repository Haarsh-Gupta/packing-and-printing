import asyncio
import logging
from typing import Coroutine, Any

logger = logging.getLogger(__name__)
_tasks: set[asyncio.Task] = set()


def fire(coro: Coroutine[Any, Any, Any]) -> asyncio.Task:
    task = asyncio.create_task(coro)
    _tasks.add(task)
    task.add_done_callback(_tasks.discard)
    task.add_done_callback(_log_exception)
    return task


def _log_exception(task: asyncio.Task) -> None:
    if task.cancelled():
        return
    exc = task.exception()
    if exc is not None:
        logger.error(f"Background task raised: {exc!r}", exc_info=exc)


async def cancel_all(timeout: float = 3.0) -> None:
    pending = {t for t in _tasks if not t.done()}
    if not pending:
        return
    logger.info(f"TaskRegistry: cancelling {len(pending)} tasks...")
    for t in pending:
        t.cancel()
    await asyncio.gather(*pending, return_exceptions=True)
    _tasks.clear()


def pending_count() -> int:
    return len({t for t in _tasks if not t.done()})