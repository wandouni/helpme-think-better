import { useEffect } from 'react'
import { Lightbulb, Loader2 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useExplain } from '../hooks/useExplain'

const BTN_W = 76  // approximate button width
const MARGIN = 12 // screen edge margin

export default function FloatingExplainButton() {
  const selectedContent = useAppStore((s) => s.selectedContent)
  const selectionPos = useAppStore((s) => s.selectionPos)
  const { explain, isExplaining } = useExplain()

  // Clamp to viewport so button never goes off-screen
  const getStyle = (): React.CSSProperties => {
    if (!selectionPos) return { display: 'none' }
    const x = Math.max(MARGIN, Math.min(selectionPos.x - BTN_W / 2, window.innerWidth - BTN_W - MARGIN))
    const y = Math.max(MARGIN, selectionPos.y)
    return { position: 'fixed', left: x, top: y, zIndex: 300 }
  }

  // Escape dismisses
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') useAppStore.getState().setSelectedContent(null, null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!selectedContent || !selectionPos) return null

  return (
    <button
      className="floating-explain-btn"
      style={getStyle()}
      onClick={explain}
      disabled={isExplaining}
      aria-label="解释选中内容"
    >
      {isExplaining
        ? <Loader2 size={13} className="spin-icon" />
        : <Lightbulb size={13} />
      }
      <span>{isExplaining ? '解释中' : '解释'}</span>
    </button>
  )
}
