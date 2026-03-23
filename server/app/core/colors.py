# ANSI Color Codes for Terminal Output

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
BOLD = "\033[1m"
RESET = "\033[0m"

def color_print(message: str, color: str = RESET, bold: bool = False):
    """Prints a message with the specified color and optional bolding."""
    prefix = BOLD + color if bold else color
    print(f"{prefix}{message}{RESET}")
