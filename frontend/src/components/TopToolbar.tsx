import { useRef, useState } from 'react'
import { Upload, Settings, Lightbulb, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppStore } from '../store/useAppStore'
import { uploadFile, streamMindmap } from '../services/api'
import { useExplain } from '../hooks/useExplain'
import { isElectronMac, isElectronWin } from '../utils/platform'
import AISettingsModal from './AISettingsModal'
import FileListDropdown from './FileListDropdown'

export default function TopToolbar() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [showSettings, setShowSettings] = useState(false)

  const config = useAppStore((s) => s.deepseekConfig)
  const isGenerating = useAppStore((s) => s.isGenerating)

  const addFile = useAppStore((s) => s.addFile)
  const setMindmapMarkdown = useAppStore((s) => s.setMindmapMarkdown)
  const appendMindmapMarkdown = useAppStore((s) => s.appendMindmapMarkdown)
  const setIsGenerating = useAppStore((s) => s.setIsGenerating)

  const { explain, canExplain, isExplaining } = useExplain()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (!config.apiKey) {
      toast.error('请先配置 AI 接口 Key')
      return
    }

    setIsGenerating(true)
    const toastId = toast.loading('正在上传文件…')

    try {
      const result = await uploadFile(file)
      addFile({
        id: result.file_id,
        filename: result.filename,
        uploadTime: new Date().toLocaleString('zh-CN'),
        textContent: result.text_content,
      })
      setMindmapMarkdown(result.file_id, '')
      toast.loading('正在提炼核心内容…', { id: toastId })

      await new Promise<void>((resolve, reject) => {
        streamMindmap(
          result.text_content,
          config,
          (chunk) => appendMindmapMarkdown(result.file_id, chunk),
          resolve,
          reject,
        )
      })
      toast.success('思维导图生成完成', { id: toastId })
    } catch (err) {
      toast.error(String(err instanceof Error ? err.message : err), { id: toastId })
    } finally {
      setIsGenerating(false)
    }
  }

  const platformClass = isElectronMac ? 'electron-mac' : isElectronWin ? 'electron-win' : ''

  return (
    <header className={`toolbar ${platformClass}`}>
      <div className="toolbar-brand">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--orange)' }}>
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>

      <div className="toolbar-actions">
        <FileListDropdown />

        <button
          className="toolbar-btn primary"
          onClick={() => fileInput.current?.click()}
          disabled={isGenerating}
        >
          {isGenerating
            ? <><div className="btn-spinner" /><span>生成中…</span></>
            : <><Upload size={12} /><span>上传文件</span></>
          }
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,.docx,.doc,.md"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div className="toolbar-divider" />

        <button
          className={`toolbar-btn explain-btn ${canExplain ? 'explain-active' : ''}`}
          onClick={explain}
          disabled={!canExplain}
          title={canExplain ? '解释选中内容' : '请先选中思维导图节点或文本'}
        >
          {isExplaining
            ? <><Loader2 size={12} className="spin-icon" /><span>解释中…</span></>
            : <><Lightbulb size={12} /><span>解释</span></>
          }
        </button>

        {/* Push settings to the far right */}
        <div style={{ flex: 1 }} />

        <button
          className="toolbar-btn settings-btn"
          onClick={() => setShowSettings(true)}
          title="AI 接口设置"
        >
          <Settings size={12} />
        </button>
      </div>

      {showSettings && <AISettingsModal onClose={() => setShowSettings(false)} />}
    </header>
  )
}
