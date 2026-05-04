import uuid
import tempfile
import os
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.file_parser import parse_file

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".md"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="仅支持 PDF、Word、Markdown 格式")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="文件过大，请控制在 20MB 以内")

    file_id = str(uuid.uuid4())
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        text_content = parse_file(tmp_path, file.filename or "")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件解析失败：{str(e)}")
    finally:
        os.unlink(tmp_path)

    return {
        "file_id": file_id,
        "filename": file.filename,
        "text_content": text_content,
        "char_count": len(text_content),
    }
