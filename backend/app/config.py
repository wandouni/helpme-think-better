import sys
from pathlib import Path


def get_resource_base() -> Path:
    """Return the root of the bundled resource tree.

    • Frozen (PyInstaller): sys._MEIPASS  — where datas are extracted.
    • Normal:               backend/       — the parent of this file's package.
    """
    if getattr(sys, 'frozen', False):
        return Path(sys._MEIPASS)
    return Path(__file__).resolve().parent.parent


def get_prompts_dir() -> Path:
    return get_resource_base() / 'app' / 'prompts'
