import { DeepSeekConfig } from '../store/useAppStore'

export async function uploadFile(file: File) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '上传失败' }))
    throw new Error(err.detail || '上传失败')
  }
  return res.json() as Promise<{
    file_id: string
    filename: string
    text_content: string
    char_count: number
  }>
}

export async function streamMindmap(
  textContent: string,
  config: DeepSeekConfig,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
) {
  const res = await fetch('/api/generate-mindmap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text_content: textContent,
      api_key: config.apiKey,
      api_base_url: config.apiBaseUrl,
      model: config.model,
    }),
  })
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ detail: 'AI 生成失败' }))
    onError(err.detail || 'AI 生成失败，请检查 API 设置')
    return
  }
  readSSE(res.body, onChunk, onDone, onError)
}

export async function streamExplain(
  prompt: string,
  config: DeepSeekConfig,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
) {
  const res = await fetch('/api/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      api_key: config.apiKey,
      api_base_url: config.apiBaseUrl,
      model: config.model,
    }),
  })
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ detail: 'AI 生成失败' }))
    onError(err.detail || 'AI 服务调用失败')
    return
  }
  readSSE(res.body, onChunk, onDone, onError)
}

export async function testConnection(config: DeepSeekConfig) {
  const res = await fetch('/api/test-connection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: config.apiKey,
      api_base_url: config.apiBaseUrl,
      model: config.model,
    }),
  })
  return res.json() as Promise<{ success: boolean; error?: string }>
}

function readSSE(
  body: ReadableStream<Uint8Array>,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  function processLine(line: string) {
    if (!line.startsWith('data: ')) return
    const data = line.slice(6)
    if (data === '[DONE]') {
      onDone()
      return
    }
    try {
      const parsed = JSON.parse(data)
      if (typeof parsed === 'string') {
        onChunk(parsed)
      } else if (parsed?.error) {
        onError(parsed.error)
      }
    } catch {}
  }

  function pump(): Promise<void> {
    return reader.read().then(({ done, value }) => {
      if (done) {
        if (buf.trim()) processLine(buf.trim())
        onDone()
        return
      }
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      lines.forEach(processLine)
      return pump()
    })
  }

  pump().catch((e) => onError(String(e)))
}
