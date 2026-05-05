import { useEffect } from 'react'
import toast, { Toaster, ToastBar } from 'react-hot-toast'
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
        position="top-center"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            color: '#3D3929',
            border: '1px solid #E6E2D9',
            borderRadius: '10px',
            boxShadow: '0 4px 16px rgba(60,55,40,0.12)',
            fontSize: '12px',
            fontFamily: 'Inter, -apple-system, sans-serif',
            maxWidth: '380px',
            cursor: 'pointer',
          },
          success: { iconTheme: { primary: '#2F8C52', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#C13B3B', secondary: '#fff' } },
        }}
      >
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <div
                onClick={() => toast.dismiss(t.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}
              >
                {icon}
                {message}
              </div>
            )}
          </ToastBar>
        )}
      </Toaster>
    </div>
  )
}
