import { useCallback } from 'react'
import toast from 'react-hot-toast'
import { useAppStore } from '../store/useAppStore'
import { buildPrompt } from '../utils/promptBuilder'
import { streamExplain } from '../services/api'

export function useExplain() {
  const config = useAppStore((s) => s.deepseekConfig)
  const activeFileId = useAppStore((s) => s.activeFileId)
  const selectedContent = useAppStore((s) => s.selectedContent)
  const isExplaining = useAppStore((s) => s.isExplaining)
  const addChatMessage = useAppStore((s) => s.addChatMessage)
  const appendChatMessage = useAppStore((s) => s.appendChatMessage)
  const setChatMessageError = useAppStore((s) => s.setChatMessageError)
  const setIsExplaining = useAppStore((s) => s.setIsExplaining)
  const setSelectedContent = useAppStore((s) => s.setSelectedContent)

  const explain = useCallback(async () => {
    if (!config.apiKey) { toast.error('请先配置 DeepSeek API'); return }
    if (!selectedContent) { toast('请先选中思维导图节点或文本内容'); return }
    if (!activeFileId) { toast('请先选择文件'); return }
    if (isExplaining) return

    const prompt = buildPrompt(selectedContent)
    const now = new Date().toLocaleTimeString('zh-CN')
    const userMsgId = crypto.randomUUID()
    const asstMsgId = crypto.randomUUID()

    addChatMessage(activeFileId, { id: userMsgId, role: 'user', content: prompt, timestamp: now })
    addChatMessage(activeFileId, { id: asstMsgId, role: 'assistant', content: '', timestamp: now })

    setIsExplaining(true)
    setSelectedContent(null, null)

    try {
      await new Promise<void>((resolve, reject) => {
        streamExplain(
          prompt,
          config,
          (chunk) => appendChatMessage(activeFileId, asstMsgId, chunk),
          resolve,
          reject,
        )
      })
    } catch (err) {
      setChatMessageError(activeFileId, asstMsgId)
      toast.error(String(err instanceof Error ? err.message : err))
    } finally {
      setIsExplaining(false)
    }
  }, [config, activeFileId, selectedContent, isExplaining, addChatMessage, appendChatMessage, setChatMessageError, setIsExplaining, setSelectedContent])

  return {
    explain,
    canExplain: !!selectedContent && !isExplaining,
    isExplaining,
  }
}
