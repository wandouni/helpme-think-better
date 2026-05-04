import { useState } from 'react'
import {
  CheckCircle2, Star, Sparkles, Loader2,
  BookOpen, RefreshCw, X,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAppStore } from '../store/useAppStore'
import { streamExplain } from '../services/api'
import { countNodes } from '../utils/recommendedNodes'
import SelectableContent from './SelectableContent'
import toast from 'react-hot-toast'

function buildLearningPathPrompt(md: string, learned: string[], important: string[]): string {
  let p = `请分析以下思维导图内容，推荐一个高效的学习路径，帮助我快速建立完整的知识框架。\n\n`
  p += `## 思维导图结构\n${md}\n\n`
  if (learned.length) p += `## 已学习的内容\n${learned.map(t => `- ${t}`).join('\n')}\n\n`
  if (important.length) p += `## 重点标记的内容\n${important.map(t => `- ${t}`).join('\n')}\n\n`
  p += `请给出：\n1. 优先学习的核心概念（可快速建立框架，3-5个）\n2. 推荐的学习顺序（简洁清晰）\n3. 已学/重点内容的关联与延伸建议`
  return p
}

type PopupType = 'learned' | 'important' | null

interface ListPopupProps {
  type: 'learned' | 'important'
  items: Array<{ text: string; filename: string }>
  onClose: () => void
}

function ListPopup({ type, items, onClose }: ListPopupProps) {
  const isLearned = type === 'learned'
  const accent = isLearned ? '#16A34A' : '#D97706'
  const Icon = isLearned ? CheckCircle2 : Star

  return (
    <div className="lp-popup-overlay" onClick={onClose}>
      <div className="lp-popup" onClick={(e) => e.stopPropagation()}>
        <div className="lp-popup-header" style={{ borderLeftColor: accent }}>
          <span className="lp-popup-title">
            <Icon size={12} style={{ color: accent }} />
            {isLearned ? '已学习内容' : '重点学习内容'} ({items.length})
          </span>
          <button className="icon-btn" onClick={onClose} aria-label="关闭"><X size={12} /></button>
        </div>
        <div className="lp-popup-body">
          {items.length === 0 ? (
            <p className="lp-popup-empty">暂无标记内容</p>
          ) : (
            items.map((item, i) => (
              <div key={i} className={`lp-item ${isLearned ? 'learned-item' : 'important-item'}`}>
                <span className="lp-item-text">{item.text}</span>
                <span className="lp-item-file">{item.filename}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function LearningPanel() {
  const [popup, setPopup] = useState<PopupType>(null)

  const files = useAppStore((s) => s.files)
  const activeFileId = useAppStore((s) => s.activeFileId)
  const mindmapMarkdown = useAppStore((s) => s.mindmapMarkdown)
  const learnedNodes = useAppStore((s) => s.learnedNodes)
  const importantNodes = useAppStore((s) => s.importantNodes)
  const learningPathContent = useAppStore((s) => s.learningPathContent)
  const isLoadingLearningPath = useAppStore((s) => s.isLoadingLearningPath)
  const config = useAppStore((s) => s.deepseekConfig)
  const setLearningPathContent = useAppStore((s) => s.setLearningPathContent)
  const appendLearningPathContent = useAppStore((s) => s.appendLearningPathContent)
  const setIsLoadingLearningPath = useAppStore((s) => s.setIsLoadingLearningPath)

  const allLearned: Array<{ text: string; filename: string }> = []
  const allImportant: Array<{ text: string; filename: string }> = []
  for (const file of files) {
    ;(learnedNodes[file.id] ?? new Set()).forEach((t) => allLearned.push({ text: t, filename: file.filename }))
    ;(importantNodes[file.id] ?? new Set()).forEach((t) => allImportant.push({ text: t, filename: file.filename }))
  }

  const activeMd = activeFileId ? (mindmapMarkdown[activeFileId] ?? '') : ''
  const pathContent = activeFileId ? (learningPathContent[activeFileId] ?? '') : ''
  const learnedCount = activeFileId ? (learnedNodes[activeFileId]?.size ?? 0) : 0
  const importantCount = activeFileId ? (importantNodes[activeFileId]?.size ?? 0) : 0
  const totalNodes = countNodes(activeMd)
  const progress = totalNodes > 0 ? Math.min(Math.round((learnedCount / totalNodes) * 100), 100) : 0

  const handleAIPath = async () => {
    if (!config.apiKey) { toast.error('请先配置 AI 接口 Key'); return }
    if (!activeFileId || !activeMd) { toast('请先选择一个已生成思维导图的文件'); return }
    if (isLoadingLearningPath) return

    const learned = Array.from(learnedNodes[activeFileId] ?? new Set())
    const important = Array.from(importantNodes[activeFileId] ?? new Set())
    const prompt = buildLearningPathPrompt(activeMd, learned, important)

    setLearningPathContent(activeFileId, '')
    setIsLoadingLearningPath(true)

    try {
      await new Promise<void>((resolve, reject) => {
        streamExplain(prompt, config,
          (chunk) => appendLearningPathContent(activeFileId, chunk),
          resolve, reject,
        )
      })
    } catch (err) {
      toast.error(String(err instanceof Error ? err.message : err))
    } finally {
      setIsLoadingLearningPath(false)
    }
  }

  return (
    <div className="learning-panel">

      {/* ── Stats ── */}
      <div className="lp-stats">
        <div className="lp-stat-row">
          <span className="lp-stat learned-stat"><CheckCircle2 size={11} /> 已学习 <strong>{learnedCount}</strong></span>
          <span className="lp-stat important-stat"><Star size={11} /> 重点 <strong>{importantCount}</strong></span>
          {totalNodes > 0 && (
            <span className="lp-stat total-stat">
              <BookOpen size={11} /> 全部节点 <strong>{totalNodes}</strong>
            </span>
          )}
          {/* Mark buttons pushed to the far right of the stat row */}
          {(allLearned.length > 0 || allImportant.length > 0) && (
            <div className="lp-mode-marks">
              {allLearned.length > 0 && (
                <button className="lp-mode-mark-btn learned-mode-mark" onClick={() => setPopup('learned')}>
                  <CheckCircle2 size={11} /> {allLearned.length}
                </button>
              )}
              {allImportant.length > 0 && (
                <button className="lp-mode-mark-btn important-mode-mark" onClick={() => setPopup('important')}>
                  <Star size={11} /> {allImportant.length}
                </button>
              )}
            </div>
          )}
        </div>
        {totalNodes > 0 && (
          <div className="lp-progress-bar">
            <div className="lp-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {/* ── AI Learning Path button ── */}
      <button className="lp-ai-btn" onClick={handleAIPath} disabled={isLoadingLearningPath || !activeMd}>
        {isLoadingLearningPath
          ? <><Loader2 size={12} className="spin-icon" /><span>AI 分析中…</span></>
          : pathContent
            ? <><RefreshCw size={12} /><span>重新生成学习路径</span></>
            : <><Sparkles size={12} /><span>AI 推荐学习路径</span></>
        }
      </button>

      {/* ── AI response — fills remaining height, scrolls internally ── */}
      {(isLoadingLearningPath || pathContent) && (
        <div className="lp-ai-response">
          <div className="lp-ai-response-label">
            <Sparkles size={11} /> AI 推荐
          </div>
          <div className="lp-ai-response-scroll">
            {isLoadingLearningPath && !pathContent ? (
              <div className="typing-indicator" style={{ padding: '8px 14px' }}>
                <span /><span /><span />
              </div>
            ) : (
              <SelectableContent className="lp-ai-response-content md-prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{pathContent}</ReactMarkdown>
              </SelectableContent>
            )}
          </div>
        </div>
      )}

      {/* Empty hint */}
      {allLearned.length === 0 && allImportant.length === 0 && !pathContent && !isLoadingLearningPath && (
        <div className="lp-empty">
          <CheckCircle2 size={11} strokeWidth={1.5} />
          <p>选中思维导图节点后<br />点击浮动按钮标记学习状态</p>
        </div>
      )}

      {/* List popup */}
      {popup && (
        <ListPopup
          type={popup}
          items={popup === 'learned' ? allLearned : allImportant}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  )
}
