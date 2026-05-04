import { RotateCcw, AlertTriangle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChatMessage as Msg } from '../store/useAppStore'
import { useAppStore } from '../store/useAppStore'
import { streamExplain } from '../services/api'
import SelectableContent from './SelectableContent'
import toast from 'react-hot-toast'

interface Props {
  msg: Msg
  fileId: string
}

export default function ChatMessage({ msg, fileId }: Props) {
  const config = useAppStore((s) => s.deepseekConfig)
  const appendChatMessage = useAppStore((s) => s.appendChatMessage)
  const setChatMessageError = useAppStore((s) => s.setChatMessageError)
  const setIsExplaining = useAppStore((s) => s.setIsExplaining)
  const isExplaining = useAppStore((s) => s.isExplaining)

  const handleRetry = async () => {
    if (isExplaining) return
    const history = useAppStore.getState().chatHistory[fileId] ?? []
    const idx = history.findIndex((m) => m.id === msg.id)
    const userMsg = idx > 0 ? history[idx - 1] : null
    if (!userMsg || userMsg.role !== 'user') return

    useAppStore.setState((s) => ({
      chatHistory: {
        ...s.chatHistory,
        [fileId]: s.chatHistory[fileId].map((m) =>
          m.id === msg.id ? { ...m, content: '', isError: false } : m,
        ),
      },
    }))

    setIsExplaining(true)
    try {
      await new Promise<void>((resolve, reject) => {
        streamExplain(userMsg.content, config,
          (chunk) => appendChatMessage(fileId, msg.id, chunk),
          resolve,
          reject,
        )
      })
    } catch (err) {
      setChatMessageError(fileId, msg.id)
      toast.error(String(err))
    } finally {
      setIsExplaining(false)
    }
  }

  if (msg.role === 'user') {
    return (
      <div className="chat-row user">
        <div className="chat-bubble user-bubble">
          {/* User prompts are not selectable for explain — they're the question */}
          <pre className="user-prompt">{msg.content}</pre>
        </div>
        <div className="chat-avatar user-avatar">我</div>
      </div>
    )
  }

  return (
    <div className="chat-row assistant">
      <div className="chat-avatar ai-avatar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
          <path d="M9 18h6"/><path d="M10 22h4"/>
        </svg>
      </div>
      <div className={`chat-bubble assistant-bubble ${msg.isError ? 'error-bubble' : ''}`}>
        {msg.content === '' && !msg.isError ? (
          <div className="typing-indicator">
            <span /><span /><span />
          </div>
        ) : msg.isError ? (
          <div className="error-content">
            <AlertTriangle size={12} />
            <span>AI 服务调用失败</span>
            <button className="retry-btn" onClick={handleRetry}>
              <RotateCcw size={11} /> 重试
            </button>
          </div>
        ) : (
          // Wrap in SelectableContent so the user can select text and get an explanation
          <SelectableContent className="md-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          </SelectableContent>
        )}
      </div>
    </div>
  )
}
