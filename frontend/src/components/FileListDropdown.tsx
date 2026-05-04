import { useState, useRef, useEffect } from 'react'
import { Folder, ChevronDown, X, Clock } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

export default function FileListDropdown() {
  const files = useAppStore((s) => s.files)
  const activeFileId = useAppStore((s) => s.activeFileId)
  const setActiveFile = useAppStore((s) => s.setActiveFile)
  const removeFile = useAppStore((s) => s.removeFile)

  const [open, setOpen] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setConfirmId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const activeFile = files.find((f) => f.id === activeFileId)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="toolbar-btn" onClick={() => setOpen(!open)}>
        <Folder size={14} />
        <span className="file-btn-name">
          {activeFile ? activeFile.filename : '文件列表'}
        </span>
        <ChevronDown size={12} className={`chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <div className="dropdown">
          <div className="dropdown-header">已上传文件 ({files.length})</div>
          {files.length === 0 ? (
            <div className="dropdown-empty">
              <Folder size={24} strokeWidth={1.5} />
              <span>暂无文件，请上传</span>
            </div>
          ) : (
            <div className="dropdown-list">
              {files.map((f) => (
                <div
                  key={f.id}
                  className={`dropdown-item ${f.id === activeFileId ? 'active' : ''}`}
                >
                  <div
                    className="dropdown-item-body"
                    onClick={() => { setActiveFile(f.id); setOpen(false) }}
                  >
                    <span className="di-name" title={f.filename}>{f.filename}</span>
                    <span className="di-time"><Clock size={10} />{f.uploadTime}</span>
                  </div>
                  {confirmId === f.id ? (
                    <div className="confirm-row">
                      <span>删除?</span>
                      <button className="btn-danger-sm" onClick={() => { removeFile(f.id); setConfirmId(null) }}>确认</button>
                      <button className="btn-ghost-sm" onClick={() => setConfirmId(null)}>取消</button>
                    </div>
                  ) : (
                    <button
                      className="di-delete"
                      onClick={(e) => { e.stopPropagation(); setConfirmId(f.id) }}
                      title="删除"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
