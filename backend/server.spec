# -*- mode: python ; coding: utf-8 -*-
# Run from the backend/ directory:
#   pyinstaller server.spec --clean --noconfirm

a = Analysis(
    ['app/run_server.py'],
    pathex=['.'],
    binaries=[],
    datas=[
        ('app/prompts', 'app/prompts'),   # system prompts
        ('static', 'static'),             # built React frontend (copied by build script)
    ],
    hiddenimports=[
        # uvicorn internals that are not auto-detected
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.loops.asyncio',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.http.h11_impl',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'uvicorn.lifespan.off',
        'uvicorn._subprocess',
        # starlette/fastapi
        'fastapi',
        'fastapi.staticfiles',
        'fastapi.middleware.cors',
        'starlette.staticfiles',
        'starlette.routing',
        'starlette.middleware.cors',
        # third-party
        'slowapi',
        'multipart',
        'multipart.multipart',
        'httpx',
        'anyio',
        'anyio._backends._asyncio',
        'anyio.streams.memory',
        'fitz',
        'docx',
    ],
    excludes=[
        'tkinter', 'matplotlib', 'numpy',
        'PIL', 'IPython', 'jupyter', 'scipy',
    ],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='server',
    debug=False,
    strip=False,
    upx=False,
    console=False,   # hide console window on Windows
    argv_emulation=False,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    name='server',
)
