from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.config import get_prompts_dir
from app.services.deepseek import stream_deepseek

router = APIRouter()

SYSTEM_PROMPT = (get_prompts_dir() / "mindmap_system.txt").read_text(encoding="utf-8")


class MindmapRequest(BaseModel):
    text_content: str
    api_key: str
    api_base_url: str = "https://api.deepseek.com"
    model: str = "deepseek-chat"


@router.post("/generate-mindmap")
async def generate_mindmap(req: MindmapRequest):
    prompt = req.text_content
    if len(prompt) > 100000:
        prompt = prompt[:100000]

    async def event_generator():
        try:
            async for chunk in stream_deepseek(
                prompt=prompt,
                system_prompt=SYSTEM_PROMPT,
                api_key=req.api_key,
                api_base_url=req.api_base_url,
                model=req.model,
            ):
                if chunk == "[DONE]":
                    yield "data: [DONE]\n\n"
                else:
                    import json
                    yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
        except Exception as e:
            import json
            yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
