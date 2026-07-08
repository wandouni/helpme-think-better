import os
import sys

import httpx
from typing import AsyncIterator


def _ssl_verify():
    """Resolve CA bundle for SSL verification, handling PyInstaller bundles."""
    try:
        import certifi
        path = certifi.where()
        if os.path.exists(path):
            return path
    except Exception:
        pass
    if hasattr(sys, "_MEIPASS"):
        alt = os.path.join(sys._MEIPASS, "certifi", "cacert.pem")
        if os.path.exists(alt):
            return alt
    return True


async def stream_ai(
    prompt: str,
    system_prompt: str,
    api_key: str,
    api_base_url: str,
    model: str,
) -> AsyncIterator[str]:
    url = f"{api_base_url.rstrip('/')}/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "stream": True,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
    }

    async with httpx.AsyncClient(timeout=120.0, verify=_ssl_verify()) as client:
        async with client.stream("POST", url, headers=headers, json=payload) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                data = line[6:]
                if data.strip() == "[DONE]":
                    yield "[DONE]"
                    return
                import json
                try:
                    chunk = json.loads(data)
                    delta = chunk["choices"][0]["delta"].get("content", "")
                    if delta:
                        yield delta
                except (json.JSONDecodeError, KeyError, IndexError):
                    continue


async def test_connection(api_key: str, api_base_url: str, model: str) -> bool:
    url = f"{api_base_url.rstrip('/')}/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "stream": False,
        "max_tokens": 5,
        "messages": [{"role": "user", "content": "hi"}],
    }
    async with httpx.AsyncClient(timeout=15.0, verify=_ssl_verify()) as client:
        resp = await client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        return True
