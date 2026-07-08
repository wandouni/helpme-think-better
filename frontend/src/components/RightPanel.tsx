import { useEffect, useRef, useState, useCallback } from 'react'
import { MessageSquare, BookOpen, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppStore } from '../store/useAppStore'
import { streamExplain } from '../services/api'
import ChatMessage from './ChatMessage'
import LearningPanel from './LearningPanel'

export default function RightPanel() {
  const activeFileId = useAppStore((s) => s.activeFileId)
  const chatHistory = useAppStore((s) => s.chatHistory)
  const rightPanelTab = useAppStore((s) => s.rightPanelTab)
  const setRightPanelTab = useAppStore((s) => s.setRightPanelTab)
  const learnedNodes = useAppStore((s) => s.learnedNodes)
  const importantNodes = useAppStore((s) => s.importantNodes)
  const config = useAppStore((s) => s.aiConfig)
  const isExplaining = useAppStore((s) => s.isExplaining)
  const setIsExplaining = useAppStore((s) => s.setIsExplaining)
  const addChatMessage = useAppStore((s) => s.addChatMessage)
  const appendChatMessage = useAppStore((s) => s.appendChatMessage)
  const setChatMessageError = useAppStore((s) => s.setChatMessageError)

  const [inputText, setInputText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  const sendMessage = useCallback(async () => {
    const text = inputText.trim()
    if (!text || isExplaining || !activeFileId) return
    if (!config.apiKey) { toast.error('请先配置 AI 接口 Key'); return }

    setInputText('')
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const now = new Date().toLocaleTimeString('zh-CN')
    const userMsgId = crypto.randomUUID()
    const asstMsgId = crypto.randomUUID()

    addChatMessage(activeFileId, { id: userMsgId, role: 'user', content: text, timestamp: now })
    addChatMessage(activeFileId, { id: asstMsgId, role: 'assistant', content: '', timestamp: now })

    setIsExplaining(true)
    try {
      await new Promise<void>((resolve, reject) => {
        streamExplain(text, config,
          (chunk) => appendChatMessage(activeFileId, asstMsgId, chunk),
          resolve,
          reject,
        )
      })
    } catch (err) {
      setChatMessageError(activeFileId, asstMsgId)
      toast.error(String(err instanceof Error ? err.message : err))
    } finally {
      setIsExplaining(false)
    }
  }, [inputText, isExplaining, activeFileId, config, addChatMessage, appendChatMessage, setChatMessageError, setIsExplaining])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value)
    // Auto-grow textarea
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

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
        <>
          <div className="chat-container">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <div className="chat-empty-icon">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
                    <path d="M9 18h6"/><path d="M10 22h4"/>
                  </svg>
                </div>
                <p>选中思维导图节点或文本内容<br/>点击浮动 <strong>解释</strong> 按钮，<br/>或在下方输入框直接提问</p>
              </div>
            ) : (
              messages.map((msg) => (
                <ChatMessage key={msg.id} msg={msg} fileId={activeFileId!} />
              ))
            )}
            <div ref={bottomRef} />
          </div>
          <div className="chat-input-bar">
            <textarea
              ref={textareaRef}
              className="chat-input"
              placeholder={activeFileId ? '输入问题… Enter 发送，Shift+Enter 换行' : '请先上传文件'}
              value={inputText}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={!activeFileId || isExplaining}
              rows={1}
            />
            <button
              className="chat-send-btn"
              onClick={sendMessage}
              disabled={!inputText.trim() || !activeFileId || isExplaining}
              title="发送"
            >
              <Send size={13} />
            </button>
          </div>
        </>
      ) : (
        <div className="lp-container">
          <LearningPanel />
        </div>
      )}
    </div>
  )
}
