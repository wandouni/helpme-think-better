import { useEffect, useRef } from 'react'
import { MessageSquare } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import ChatMessage from './ChatMessage'

export default function RightPanel() {
  const activeFileId = useAppStore((s) => s.activeFileId)
  const chatHistory = useAppStore((s) => s.chatHistory)
  const bottomRef = useRef<HTMLDivElement>(null)

  const messages = activeFileId ? (chatHistory[activeFileId] ?? []) : []
  const lastMsg = messages[messages.length - 1]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, lastMsg?.content])

  return (
    <div className="panel right-panel">
      <div className="panel-header">
        <MessageSquare size={14} />
        <span>AI 解释</span>
        {messages.length > 0 && (
          <span className="msg-count">{messages.length / 2 | 0} 次</span>
        )}
      </div>
      <div className="chat-container">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
                <path d="M9 18h6"/><path d="M10 22h4"/>
              </svg>
            </div>
            <p>选中思维导图节点或文本内容<br/>点击 <strong>解释</strong> 按钮获取 AI 解释</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} msg={msg} fileId={activeFileId!} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
