import fitz  # PyMuPDF
from docx import Document
from pathlib import Path


def parse_pdf(file_path: str) -> str:
    doc = fitz.open(file_path)
    texts = []
    for page in doc:
        texts.append(page.get_text())
    doc.close()
    return "\n".join(texts)


def parse_docx(file_path: str) -> str:
    doc = Document(file_path)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs)


def parse_md(file_path: str) -> str:
    return Path(file_path).read_text(encoding="utf-8")


def parse_file(file_path: str, filename: str) -> str:
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        return parse_pdf(file_path)
    elif ext in (".docx", ".doc"):
        return parse_docx(file_path)
    elif ext == ".md":
        return parse_md(file_path)
    else:
        raise ValueError(f"不支持的文件格式: {ext}")
