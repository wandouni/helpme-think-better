import { useRef, useCallback, ReactNode } from 'react'
import { useAppStore } from '../store/useAppStore'

interface Props {
  left: ReactNode
  right: ReactNode
}

export default function SplitPane({ left, right }: Props) {
  const splitRatio = useAppStore((s) => s.splitRatio)
  const setSplitRatio = useAppStore((s) => s.setSplitRatio)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const onMouseDown = useCallback(() => {
    dragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const leftWidth = e.clientX - rect.left
      const ratio = Math.min(Math.max(leftWidth / rect.width, 300 / rect.width), 1 - 280 / rect.width)
      setSplitRatio(ratio)
    }

    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [setSplitRatio])

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}
    >
      <div style={{ width: `${splitRatio * 100}%`, minWidth: 300, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {left}
      </div>
      <div className="split-divider" onMouseDown={onMouseDown} />
      <div style={{ flex: 1, minWidth: 280, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {right}
      </div>
    </div>
  )
}
