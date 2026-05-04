from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.config import get_prompts_dir
from app.services.deepseek import stream_deepseek, test_connection

router = APIRouter()

SYSTEM_PROMPT = (get_prompts_dir() / "explain_system.txt").read_text(encoding="utf-8")


class ExplainRequest(BaseModel):
    prompt: str
    api_key: str
    api_base_url: str = "https://api.deepseek.com"
    model: str = "deepseek-chat"


class TestConnectionRequest(BaseModel):
    api_key: str
    api_base_url: str = "https://api.deepseek.com"
    model: str = "deepseek-chat"


@router.post("/explain")
async def explain(req: ExplainRequest):
    async def event_generator():
        try:
            async for chunk in stream_deepseek(
                prompt=req.prompt,
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


@router.post("/test-connection")
async def test_conn(req: TestConnectionRequest):
    try:
        await test_connection(req.api_key, req.api_base_url, req.model)
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
