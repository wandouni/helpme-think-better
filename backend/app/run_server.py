"""
Desktop entry point called by Electron.
Adds static-file serving on top of the regular FastAPI app.
"""
import argparse
from pathlib import Path

from app.main import app
from app.config import get_resource_base

# Mount the built React frontend — only present in the packaged desktop build.
static_dir = get_resource_base() / 'static'
if static_dir.exists():
    from fastapi.staticfiles import StaticFiles
    # Mount AFTER all /api routes so API routes take priority.
    app.mount('/', StaticFiles(directory=str(static_dir), html=True), name='frontend')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8765)
    args = parser.parse_args()

    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=args.port,
                log_level='error', access_log=False)
