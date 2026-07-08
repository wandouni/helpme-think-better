import pathlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.routers import upload, mindmap, explain

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Lumio - 文档学习与思维导图工具", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Allow all origins — this is a personal local-network tool
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api")
app.include_router(mindmap.router, prefix="/api")
app.include_router(explain.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}


# ── Serve built frontend (production / mobile mode) ──────────
STATIC_DIR = pathlib.Path(__file__).parent.parent / "static"

if STATIC_DIR.exists():
    # Serve hashed JS/CSS assets
    assets_dir = STATIC_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Return a specific file if it exists (manifest.json, icons, etc.)
        candidate = STATIC_DIR / full_path
        if candidate.exists() and candidate.is_file():
            return FileResponse(candidate)
        # SPA fallback — all other paths serve index.html
        return FileResponse(STATIC_DIR / "index.html")
