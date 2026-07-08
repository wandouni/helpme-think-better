import { useState } from 'react'
import { Eye, EyeOff, X, Wifi, CheckCircle2, XCircle } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { testConnection } from '../services/api'

interface Props {
  onClose: () => void
}

export default function AISettingsModal({ onClose }: Props) {
  const config = useAppStore((s) => s.aiConfig)
  const setAIConfig = useAppStore((s) => s.setAIConfig)

  const [apiKey, setApiKey] = useState(config.apiKey)
  const [apiBaseUrl, setApiBaseUrl] = useState(config.apiBaseUrl)
  const [model, setModel] = useState(config.model)
  const [showKey, setShowKey] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle')
  const [testError, setTestError] = useState('')

  const handleSave = () => {
    setAIConfig({ apiKey, apiBaseUrl, model })
    onClose()
  }

  const handleTest = async () => {
    setTestStatus('testing')
    setTestError('')
    try {
      const result = await testConnection({ apiKey, apiBaseUrl, model })
      setTestStatus(result.success ? 'ok' : 'fail')
      if (!result.success) setTestError(result.error || '连接失败')
    } catch (e) {
      setTestStatus('fail')
      setTestError(String(e))
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            AI 接口设置
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="关闭"><X size={11} /></button>
        </div>

        <div className="modal-body">
          <div className="field-group">
            <label className="field-label">API Key</label>
            <div className="input-row">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="text-input"
                autoComplete="off"
              />
              <button className="input-icon-btn" onClick={() => setShowKey(!showKey)} type="button" aria-label={showKey ? '隐藏' : '显示'}>
                {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">API Base URL</label>
            <input
              type="text"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              className="text-input"
              placeholder="https://api.deepseek.com"
            />
            <p className="field-hint">兼容 OpenAI 格式的接口均可，如 DeepSeek、本地 Ollama 等</p>
          </div>

          <div className="field-group">
            <label className="field-label">模型名称</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="text-input"
              placeholder="deepseek-chat / gpt-4o / llama3 …"
            />
          </div>

          <div className="test-row">
            <button className="btn-secondary" onClick={handleTest} disabled={testStatus === 'testing' || !apiKey}>
              {testStatus === 'testing'
                ? <><div className="btn-spinner dark" /><span>测试中…</span></>
                : <><Wifi size={11} /><span>连接测试</span></>
              }
            </button>
            {testStatus === 'ok' && (
              <span className="test-ok"><CheckCircle2 size={11} /> 连接成功</span>
            )}
            {testStatus === 'fail' && (
              <span className="test-fail"><XCircle size={11} /> {testError}</span>
            )}
          </div>

          <div className="safety-tip">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            API Key 仅存储在您的浏览器本地，不会上传到服务器
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={handleSave}>保存设置</button>
        </div>
      </div>
    </div>
  )
}
