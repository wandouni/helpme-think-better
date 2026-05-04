import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import TopToolbar from './components/TopToolbar'
import SplitPane from './components/SplitPane'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import FloatingActionButtons from './components/FloatingActionButtons'
import { useAppStore } from './store/useAppStore'
import './styles.css'

function SelectionManager() {
  const setSelectedContent = useAppStore((s) => s.setSelectedContent)

  // Clear markdown selection when browser text selection is cleared
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const onSelectionChange = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const { selectionSource } = useAppStore.getState()
        if (selectionSource !== 'markdown') return
        const sel = window.getSelection()
        if (!sel?.toString().trim()) setSelectedContent(null, null)
      }, 200) // debounce: gives floating-btn click time to fire first
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange)
      clearTimeout(timer)
    }
  }, [setSelectedContent])

  // Clear mindmap selection when clicking outside the SVG (right panel, toolbar, etc.)
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Element
      if (target.closest('.floating-actions')) return // keep selection while user interacts with floating buttons
      const { selectionSource } = useAppStore.getState()
      if (selectionSource === 'mindmap' && !target.closest('svg')) {
        setSelectedContent(null, null)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [setSelectedContent])

  return null
}

export default function App() {
  return (
    <div className="app">
      <SelectionManager />
      <TopToolbar />
      <SplitPane left={<LeftPanel />} right={<RightPanel />} />
      <FloatingActionButtons />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#fff',
            color: '#0F172A',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(15,23,42,0.1)',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
          },
          success: { iconTheme: { primary: '#16A34A', secondary: '#fff' } },
          error: { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
        }}
      />
    </div>
  )
}
