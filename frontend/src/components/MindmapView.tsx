import { useEffect, useRef, useCallback } from 'react'
import { Markmap } from 'markmap-view'
import { Transformer } from 'markmap-lib'
import { ZoomIn, ZoomOut, Maximize2, Download } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

const transformer = new Transformer()

const BTN_H = 32
const BTN_GAP = 10
const HL_CLASS = 'mm-sel-rect'
const ACCENT = 'rgba(37,99,235,{a})'

// ── helpers ──────────────────────────────────────────────────────────────

/** Extract rendered text from a markmap node <g>, avoiding nested child nodes. */
function getNodeText(g: Element): string {
  const foSelectors = [
    ':scope > foreignObject',
    ':scope > g:not(.markmap-node) > foreignObject',
  ]
  let fo: Element | null = null
  for (const sel of foSelectors) {
    fo = g.querySelector(sel)
    if (fo) break
  }
  if (!fo) fo = g.querySelector('foreignObject')

  if (fo) {
    // innerText gives rendered visible text (handles <strong>, <em>, links …)
    const el = fo.querySelector('div, span, p') as HTMLElement | null
    const text = el?.innerText?.trim() ?? el?.textContent?.trim() ?? fo.textContent?.trim()
    if (text) return text
  }
  return g.querySelector(':scope > text')?.textContent?.trim() ?? ''
}

/**
 * Draw a highlight rect directly in SVG inside the node's <g>.
 * This is reliable regardless of browser CSS behaviour across foreignObject.
 */
function addHighlight(g: Element) {
  removeHighlight(g)
  const fo = g.querySelector('foreignObject')
  if (!fo) return

  const x = parseFloat(fo.getAttribute('x') ?? '0')
  const y = parseFloat(fo.getAttribute('y') ?? '0')
  const w = parseFloat(fo.getAttribute('width') ?? '0')
  const h = parseFloat(fo.getAttribute('height') ?? '0')
  if (!w || !h) return

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  rect.classList.add(HL_CLASS)
  rect.setAttribute('x', String(x - 4))
  rect.setAttribute('y', String(y - 3))
  rect.setAttribute('width', String(w + 8))
  rect.setAttribute('height', String(h + 6))
  rect.setAttribute('rx', '5')
  rect.setAttribute('fill', ACCENT.replace('{a}', '0.10'))
  rect.setAttribute('stroke', ACCENT.replace('{a}', '0.55'))
  rect.setAttribute('stroke-width', '1.5')
  rect.setAttribute('pointer-events', 'none')

  // Insert before foreignObject so text renders on top
  g.insertBefore(rect, fo)
}

function removeHighlight(g: Element) {
  g.querySelector(`.${HL_CLASS}`)?.remove()
}

function clearAll(svg: SVGSVGElement) {
  svg.querySelectorAll(`.${HL_CLASS}`).forEach((el) => el.remove())
  svg.querySelectorAll('.markmap-node.selected').forEach((el) => el.classList.remove('selected'))
}

// ── component ─────────────────────────────────────────────────────────────

interface Props {
  markdown: string
  fileId: string
  filename: string
}

export default function MindmapView({ markdown, fileId, filename }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const mmRef = useRef<Markmap | null>(null)
  const setSelectedContent = useAppStore((s) => s.setSelectedContent)
  const isGenerating = useAppStore((s) => s.isGenerating)

  // Recreate Markmap when active file changes
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    while (svg.firstChild) svg.removeChild(svg.firstChild)
    mmRef.current = null
    if (!fileId) return

    const mm = Markmap.create(svg, { duration: 200 })
    mmRef.current = mm

    const cur = useAppStore.getState().mindmapMarkdown[fileId] ?? ''
    if (cur) {
      try {
        const { root } = transformer.transform(cur)
        mm.setData(root)
        setTimeout(() => mm.fit(), 100)
      } catch {}
    }
    return () => { mmRef.current = null }
  }, [fileId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update data when markdown changes
  useEffect(() => {
    if (!mmRef.current || !markdown) return
    try {
      const { root } = transformer.transform(markdown)
      mmRef.current.setData(root)
      if (!isGenerating) setTimeout(() => mmRef.current?.fit(), 100)
    } catch {}
  }, [markdown, isGenerating])

  // Node click
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const handler = (e: MouseEvent) => {
      const target = e.target as Element
      const g = target.closest('g.markmap-node')

      if (!g) {
        // Ignore clicks on SVG shapes that aren't part of a node
        // (expand/collapse circles live outside g.markmap-node)
        const tag = target.tagName?.toLowerCase()
        if (tag === 'circle' || tag === 'path' || tag === 'line') return

        clearAll(svg)
        setSelectedContent(null, null)
        return
      }

      clearAll(svg)
      g.classList.add('selected')
      addHighlight(g)

      const text = getNodeText(g)
      if (!text) return

      const rect = g.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const yBelow = rect.bottom + BTN_GAP
      const y = yBelow + BTN_H < window.innerHeight - 16 ? yBelow : rect.top - BTN_H - BTN_GAP

      setSelectedContent(text, 'mindmap', { x: cx, y })
    }

    // Capture phase: runs before markmap's expand/collapse handlers
    svg.addEventListener('click', handler, true)
    return () => svg.removeEventListener('click', handler, true)
  }, [setSelectedContent])

  const handleZoomIn = useCallback(() => mmRef.current?.rescale(1.3), [])
  const handleZoomOut = useCallback(() => mmRef.current?.rescale(0.77), [])
  const handleFit = useCallback(() => mmRef.current?.fit(), [])

  const handleFullscreen = useCallback(() => {
    const el = svgRef.current?.parentElement?.parentElement
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }, [])

  const handleDownload = useCallback(() => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename.replace(/\.[^.]+$/, '')}_思维导图.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [markdown, filename])

  return (
    <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: '#fff' }}>
      {isGenerating && (
        <div className="mindmap-loading">
          <div className="spinner" />
          <span>正在提炼核心内容…</span>
        </div>
      )}
      {!markdown && !isGenerating && (
        <div className="mindmap-empty">
          <div className="mindmap-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/>
              <line x1="8.5" x2="15.5" y1="13.5" y2="17.5"/><line x1="15.5" x2="8.5" y1="6.5" y2="10.5"/>
            </svg>
          </div>
          <p>上传政策文件后，思维导图将在此处展示</p>
        </div>
      )}
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
      {markdown && (
        <div className="map-controls">
          <button className="map-ctrl-btn" onClick={handleZoomIn} title="放大"><ZoomIn size={14} /></button>
          <button className="map-ctrl-btn" onClick={handleZoomOut} title="缩小"><ZoomOut size={14} /></button>
          <div className="map-ctrl-divider" />
          <button className="map-ctrl-btn" onClick={handleFit} title="适应屏幕"><Maximize2 size={14} /></button>
          <button className="map-ctrl-btn" onClick={handleFullscreen} title="全屏">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
          </button>
          <div className="map-ctrl-divider" />
          <button className="map-ctrl-btn" onClick={handleDownload} title="下载 Markdown"><Download size={14} /></button>
        </div>
      )}
    </div>
  )
}
