import { Share2, FileText } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import MindmapView from './MindmapView'
import MarkdownView from './MarkdownView'

export default function LeftPanel() {
  const leftViewMode = useAppStore((s) => s.leftViewMode)
  const setLeftViewMode = useAppStore((s) => s.setLeftViewMode)
  const activeFileId = useAppStore((s) => s.activeFileId)
  const files = useAppStore((s) => s.files)
  const mindmapMarkdown = useAppStore((s) => s.mindmapMarkdown)

  const activeFile = files.find((f) => f.id === activeFileId)
  const markdown = activeFileId ? (mindmapMarkdown[activeFileId] ?? '') : ''

  return (
    <div className="panel left-panel">
      <div className="panel-tabs">
        <button
          className={`tab-btn ${leftViewMode === 'mindmap' ? 'active' : ''}`}
          onClick={() => setLeftViewMode('mindmap')}
        >
          <Share2 size={11} />
          思维导图
        </button>
        <button
          className={`tab-btn ${leftViewMode === 'markdown' ? 'active' : ''}`}
          onClick={() => setLeftViewMode('markdown')}
        >
          <FileText size={11} />
          Markdown
        </button>

        {activeFile && (
          <div className="panel-file-badge">{activeFile.filename}</div>
        )}
      </div>

      <div className="panel-content">
        {leftViewMode === 'mindmap' ? (
          <MindmapView
            markdown={markdown}
            fileId={activeFileId ?? ''}
            filename={activeFile?.filename ?? 'mindmap'}
          />
        ) : (
          <MarkdownView markdown={markdown} />
        )}
      </div>
    </div>
  )
}
