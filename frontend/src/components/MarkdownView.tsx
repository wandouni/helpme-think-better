import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAppStore } from '../store/useAppStore'

const BTN_H = 32   // floating button height
const BTN_GAP = 10 // gap between selection and button

interface Props {
  markdown: string
  renderMode?: 'markdown' | 'text'
}

export default function MarkdownView({ markdown, renderMode = 'markdown' }: Props) {
  const setSelectedContent = useAppStore((s) => s.setSelectedContent)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection()
      const text = sel?.toString().trim()
      if (!text || !sel || sel.rangeCount === 0) return

      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const cx = rect.left + rect.width / 2

      // Show button above selection; flip below if near top edge
      const yAbove = rect.top - BTN_H - BTN_GAP
      const yBelow = rect.bottom + BTN_GAP
      const y = yAbove > 16 ? yAbove : yBelow

      setSelectedContent(text, 'markdown', { x: cx, y })
    }
    const el = containerRef.current
    el?.addEventListener('mouseup', handler)
    return () => el?.removeEventListener('mouseup', handler)
  }, [setSelectedContent])

  if (!markdown) {
    return (
      <div className="md-empty">
        <div className="mindmap-empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <p>上传文件后，此处将展示导入内容</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="md-view">
      {renderMode === 'text' ? (
        <pre className="md-plain-text">{markdown}</pre>
      ) : (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      )}
    </div>
  )
}
