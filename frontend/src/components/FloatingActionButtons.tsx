import { useEffect, useRef } from 'react'
import { Lightbulb, Loader2, CheckCircle2, Star } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useExplain } from '../hooks/useExplain'

const BTN_GAP = 6   // gap between buttons
const BTN_W = 238   // approximate total width of three buttons
const MARGIN = 12

export default function FloatingActionButtons() {
  const selectedContent = useAppStore((s) => s.selectedContent)
  const selectionSource = useAppStore((s) => s.selectionSource)
  const selectionPos = useAppStore((s) => s.selectionPos)
  const activeFileId = useAppStore((s) => s.activeFileId)
  const learnedNodes = useAppStore((s) => s.learnedNodes)
  const importantNodes = useAppStore((s) => s.importantNodes)
  const toggleLearned = useAppStore((s) => s.toggleLearned)
  const toggleImportant = useAppStore((s) => s.toggleImportant)
  const { explain, isExplaining } = useExplain()

  const containerRef = useRef<HTMLDivElement>(null)

  const isMindmap = selectionSource === 'mindmap'
  const isLearned = !!(activeFileId && selectedContent && learnedNodes[activeFileId]?.has(selectedContent))
  const isImportant = !!(activeFileId && selectedContent && importantNodes[activeFileId]?.has(selectedContent))

  // Escape key dismisses
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') useAppStore.getState().setSelectedContent(null, null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!selectedContent || !selectionPos) return null

  const effectiveBtnW = isMindmap ? BTN_W : 84 // single explain button width when markdown
  const x = Math.max(MARGIN, Math.min(selectionPos.x - effectiveBtnW / 2, window.innerWidth - effectiveBtnW - MARGIN))
  const y = Math.max(MARGIN, selectionPos.y)

  const handleToggleLearned = () => {
    if (!activeFileId || !selectedContent) return
    toggleLearned(activeFileId, selectedContent)
  }

  const handleToggleImportant = () => {
    if (!activeFileId || !selectedContent) return
    toggleImportant(activeFileId, selectedContent)
  }

  return (
    <div
      ref={containerRef}
      className="floating-actions"
      style={{ position: 'fixed', left: x, top: y, zIndex: 300, display: 'flex', gap: BTN_GAP }}
    >
      {/* Explain — always visible */}
      <button
        className="floating-action-btn explain"
        onClick={explain}
        disabled={isExplaining}
        aria-label="AI 解释"
      >
        {isExplaining
          ? <Loader2 size={12} className="spin-icon" />
          : <Lightbulb size={12} />
        }
        <span>{isExplaining ? '解释中' : '解释'}</span>
      </button>

      {/* Learned + Important — mindmap nodes only */}
      {isMindmap && (
        <>
          <button
            className={`floating-action-btn learned ${isLearned ? 'active' : ''}`}
            onClick={handleToggleLearned}
            aria-label={isLearned ? '取消已学习' : '标记为已学习'}
          >
            <CheckCircle2 size={12} />
            <span>{isLearned ? '已学习 ✓' : '已学习'}</span>
          </button>

          <button
            className={`floating-action-btn important ${isImportant ? 'active' : ''}`}
            onClick={handleToggleImportant}
            aria-label={isImportant ? '取消重点' : '标记为重点'}
          >
            <Star size={12} />
            <span>{isImportant ? '重点 ★' : '重点'}</span>
          </button>
        </>
      )}
    </div>
  )
}
