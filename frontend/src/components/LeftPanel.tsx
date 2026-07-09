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
  const isRawFile = activeFile?.importMode === 'raw'
  const effectiveViewMode = isRawFile ? 'markdown' : leftViewMode

  return (
    <div className="panel left-panel">
      <div className="panel-tabs">
        <button
          className={`tab-btn ${effectiveViewMode === 'mindmap' ? 'active' : ''}`}
          onClick={() => setLeftViewMode('mindmap')}
          disabled={isRawFile}
          title={isRawFile ? '原文提取模式不生成思维导图' : '思维导图'}
        >
          <Share2 size={11} />
          思维导图
        </button>
        <button
          className={`tab-btn ${effectiveViewMode === 'markdown' ? 'active' : ''}`}
          onClick={() => setLeftViewMode('markdown')}
        >
          <FileText size={11} />
          {isRawFile ? '原文' : 'Markdown'}
        </button>

        {activeFile && (
          <div className="panel-file-badge">
            {activeFile.importMode === 'raw' ? '原文 · ' : ''}
            {activeFile.filename}
          </div>
        )}
      </div>

      <div className="panel-content">
        {effectiveViewMode === 'mindmap' ? (
          <MindmapView
            markdown={markdown}
            fileId={activeFileId ?? ''}
            filename={activeFile?.filename ?? 'mindmap'}
          />
        ) : (
          <MarkdownView markdown={markdown} renderMode={isRawFile ? 'text' : 'markdown'} />
        )}
      </div>
    </div>
  )
}
