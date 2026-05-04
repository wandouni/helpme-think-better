import { useEffect, useRef } from 'react'
import { MessageSquare, BookOpen } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import ChatMessage from './ChatMessage'
import LearningPanel from './LearningPanel'

export default function RightPanel() {
  const activeFileId = useAppStore((s) => s.activeFileId)
  const chatHistory = useAppStore((s) => s.chatHistory)
  const rightPanelTab = useAppStore((s) => s.rightPanelTab)
  const setRightPanelTab = useAppStore((s) => s.setRightPanelTab)
  const learnedNodes = useAppStore((s) => s.learnedNodes)
  const importantNodes = useAppStore((s) => s.importantNodes)
  const bottomRef = useRef<HTMLDivElement>(null)

  const messages = activeFileId ? (chatHistory[activeFileId] ?? []) : []
  const lastMsg = messages[messages.length - 1]

  const learnedCount = activeFileId ? (learnedNodes[activeFileId]?.size ?? 0) : 0
  const importantCount = activeFileId ? (importantNodes[activeFileId]?.size ?? 0) : 0
  const learningBadge = learnedCount + importantCount

  useEffect(() => {
    if (rightPanelTab === 'chat') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, lastMsg?.content, rightPanelTab])

  return (
    <div className="panel right-panel">
      {/* Tab bar */}
      <div className="panel-tabs">
        <button
          className={`tab-btn ${rightPanelTab === 'chat' ? 'active' : ''}`}
          onClick={() => setRightPanelTab('chat')}
        >
          <MessageSquare size={11} />
          AI 解释
          {messages.length > 0 && (
            <span className="tab-badge">{messages.length >> 1}</span>
          )}
        </button>
        <button
          className={`tab-btn ${rightPanelTab === 'learning' ? 'active' : ''}`}
          onClick={() => setRightPanelTab('learning')}
        >
          <BookOpen size={11} />
          学习进度
          {learningBadge > 0 && (
            <span className="tab-badge learning-badge">{learningBadge}</span>
          )}
        </button>
      </div>

      {/* Tab content */}
      {rightPanelTab === 'chat' ? (
        <div className="chat-container">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
                  <path d="M9 18h6"/><path d="M10 22h4"/>
                </svg>
              </div>
              <p>选中思维导图节点或文本内容<br/>点击浮动 <strong>解释</strong> 按钮获取 AI 解释</p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage key={msg.id} msg={msg} fileId={activeFileId!} />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      ) : (
        <div className="lp-container">
          <LearningPanel />
        </div>
      )}
    </div>
  )
}
