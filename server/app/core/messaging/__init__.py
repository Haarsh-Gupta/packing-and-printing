# ===========================================================================
# Multi-Channel Messaging System
# ===========================================================================
# Provides a unified interface for sending notifications via multiple
# channels (Email, WhatsApp, etc.).
#
# Usage:
#   from app.core.messaging import get_dispatcher
#   dispatcher = get_dispatcher()
#   await dispatcher.dispatch(user, "payment_received", context)
# ===========================================================================

from app.core.messaging.dispatcher import NotificationDispatcher, get_dispatcher

__all__ = ["NotificationDispatcher", "get_dispatcher"]
