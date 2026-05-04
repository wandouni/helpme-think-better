import { useEffect, useRef, ReactNode } from 'react'
import { useAppStore } from '../store/useAppStore'

const BTN_H = 32
const BTN_GAP = 10

interface Props {
  children: ReactNode
  className?: string
}

/**
 * Wraps any content and makes text selection trigger the floating explain button.
 * Treats selections as 'markdown' source (explain-only, no learn/important).
 */
export default function SelectableContent({ children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const setSelectedContent = useAppStore((s) => s.setSelectedContent)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Ignore clicks on the floating action buttons to avoid overwriting mindmap selection
      if ((e.target as Element).closest('.floating-actions')) return

      const sel = window.getSelection()
      const text = sel?.toString().trim()
      if (!text || !sel || sel.rangeCount === 0) return

      // Only react if the selection is inside this container
      const range = sel.getRangeAt(0)
      if (!ref.current?.contains(range.commonAncestorContainer)) return

      const rect = range.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const yAbove = rect.top - BTN_H - BTN_GAP
      const y = yAbove > 16 ? yAbove : rect.bottom + BTN_GAP

      setSelectedContent(text, 'markdown', { x: cx, y })
    }

    document.addEventListener('mouseup', handler)
    return () => document.removeEventListener('mouseup', handler)
  }, [setSelectedContent])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
