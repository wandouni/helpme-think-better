import { create } from 'zustand'

export interface FileItem {
  id: string
  filename: string
  uploadTime: string
  textContent: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  isError?: boolean
}

export interface DeepSeekConfig {
  apiKey: string
  apiBaseUrl: string
  model: string
}

export interface SelectionPos {
  x: number
  y: number
}

interface AppState {
  files: FileItem[]
  activeFileId: string | null
  deepseekConfig: DeepSeekConfig
  mindmapMarkdown: Record<string, string>
  leftViewMode: 'mindmap' | 'markdown'
  selectedContent: string | null
  selectionSource: 'mindmap' | 'markdown' | null
  selectionPos: SelectionPos | null
  chatHistory: Record<string, ChatMessage[]>
  /** Sets serialized as arrays in localStorage */
  learnedNodes: Record<string, Set<string>>
  importantNodes: Record<string, Set<string>>
  rightPanelTab: 'chat' | 'learning'
  /** AI learning-path response per file, shown inside LearningPanel */
  learningPathContent: Record<string, string>
  isLoadingLearningPath: boolean
  isGenerating: boolean
  isExplaining: boolean
  splitRatio: number

  addFile: (file: FileItem) => void
  removeFile: (id: string) => void
  setActiveFile: (id: string | null) => void
  setDeepSeekConfig: (config: Partial<DeepSeekConfig>) => void
  setMindmapMarkdown: (fileId: string, markdown: string) => void
  appendMindmapMarkdown: (fileId: string, chunk: string) => void
  setLeftViewMode: (mode: 'mindmap' | 'markdown') => void
  setSelectedContent: (content: string | null, source: 'mindmap' | 'markdown' | null, pos?: SelectionPos | null) => void
  addChatMessage: (fileId: string, msg: ChatMessage) => void
  appendChatMessage: (fileId: string, msgId: string, chunk: string) => void
  setChatMessageError: (fileId: string, msgId: string) => void
  setIsGenerating: (v: boolean) => void
  setIsExplaining: (v: boolean) => void
  setSplitRatio: (v: number) => void
  // Learning status
  toggleLearned: (fileId: string, nodeText: string) => void
  toggleImportant: (fileId: string, nodeText: string) => void
  setRightPanelTab: (tab: 'chat' | 'learning') => void
  // Learning path AI response (shown inside LearningPanel, not in chat)
  setLearningPathContent: (fileId: string, content: string) => void
  appendLearningPathContent: (fileId: string, chunk: string) => void
  setIsLoadingLearningPath: (v: boolean) => void
}

// ── Persistence ───────────────────────────────────────────────────────────

const loadConfig = (): DeepSeekConfig => {
  try {
    const raw = localStorage.getItem('deepseek_config')
    if (raw) return JSON.parse(raw)
  } catch {}
  return { apiKey: '', apiBaseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' }
}

interface PersistedState {
  files: Array<{ id: string; filename: string; uploadTime: string }>
  mindmapMarkdown: Record<string, string>
  activeFileId: string | null
  chatHistory: Record<string, ChatMessage[]>
  learnedNodes: Record<string, string[]>   // Set → array for JSON
  importantNodes: Record<string, string[]>
  learningPathContent: Record<string, string>
}

const loadPersistedState = (): PersistedState => {
  try {
    const raw = localStorage.getItem('policy_mindmap_state')
    if (raw) return JSON.parse(raw)
  } catch {}
  return { files: [], mindmapMarkdown: {}, activeFileId: null, chatHistory: {}, learnedNodes: {}, importantNodes: {}, learningPathContent: {} }
}

let saveTimer: ReturnType<typeof setTimeout>
const saveToStorage = (state: AppState) => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      const toSave: PersistedState = {
        files: state.files.map(({ id, filename, uploadTime }) => ({ id, filename, uploadTime })),
        mindmapMarkdown: state.mindmapMarkdown,
        activeFileId: state.activeFileId,
        chatHistory: state.chatHistory,
        learningPathContent: state.learningPathContent,
        // Convert Sets → arrays for JSON serialization
        learnedNodes: Object.fromEntries(
          Object.entries(state.learnedNodes).map(([k, v]) => [k, Array.from(v)])
        ),
        importantNodes: Object.fromEntries(
          Object.entries(state.importantNodes).map(([k, v]) => [k, Array.from(v)])
        ),
      }
      localStorage.setItem('policy_mindmap_state', JSON.stringify(toSave))
    } catch {}
  }, 400)
}

// ── Store ─────────────────────────────────────────────────────────────────

const persisted = loadPersistedState()

// Restore Sets from persisted arrays
const toSetMap = (raw: Record<string, string[]>): Record<string, Set<string>> =>
  Object.fromEntries(Object.entries(raw ?? {}).map(([k, v]) => [k, new Set(v)]))

export const useAppStore = create<AppState>((set) => ({
  files: persisted.files.map((f) => ({ ...f, textContent: '' })),
  activeFileId: persisted.activeFileId,
  mindmapMarkdown: persisted.mindmapMarkdown,
  deepseekConfig: loadConfig(),
  leftViewMode: 'mindmap',
  selectedContent: null,
  selectionSource: null,
  selectionPos: null,
  chatHistory: persisted.chatHistory ?? {},
  learnedNodes: toSetMap(persisted.learnedNodes ?? {}),
  importantNodes: toSetMap(persisted.importantNodes ?? {}),
  learningPathContent: persisted.learningPathContent ?? {},
  rightPanelTab: 'chat',
  isLoadingLearningPath: false,
  isGenerating: false,
  isExplaining: false,
  splitRatio: 0.6,

  addFile: (file) =>
    set((s) => ({ files: [...s.files, file], activeFileId: file.id })),

  removeFile: (id) =>
    set((s) => {
      const files = s.files.filter((f) => f.id !== id)
      const activeFileId = s.activeFileId === id ? (files[0]?.id ?? null) : s.activeFileId
      const mindmapMarkdown = { ...s.mindmapMarkdown }; delete mindmapMarkdown[id]
      const chatHistory = { ...s.chatHistory }; delete chatHistory[id]
      const learnedNodes = { ...s.learnedNodes }; delete learnedNodes[id]
      const importantNodes = { ...s.importantNodes }; delete importantNodes[id]
      const learningPathContent = { ...s.learningPathContent }; delete learningPathContent[id]
      return { files, activeFileId, mindmapMarkdown, chatHistory, learnedNodes, importantNodes, learningPathContent }
    }),

  setActiveFile: (id) =>
    set({ activeFileId: id, selectedContent: null, selectionSource: null, selectionPos: null }),

  setDeepSeekConfig: (config) =>
    set((s) => {
      const next = { ...s.deepseekConfig, ...config }
      localStorage.setItem('deepseek_config', JSON.stringify(next))
      return { deepseekConfig: next }
    }),

  setMindmapMarkdown: (fileId, markdown) =>
    set((s) => ({ mindmapMarkdown: { ...s.mindmapMarkdown, [fileId]: markdown } })),

  appendMindmapMarkdown: (fileId, chunk) =>
    set((s) => ({
      mindmapMarkdown: { ...s.mindmapMarkdown, [fileId]: (s.mindmapMarkdown[fileId] ?? '') + chunk },
    })),

  setLeftViewMode: (mode) => set({ leftViewMode: mode }),

  setSelectedContent: (content, source, pos = null) =>
    set({ selectedContent: content, selectionSource: source, selectionPos: content ? pos : null }),

  addChatMessage: (fileId, msg) =>
    set((s) => ({ chatHistory: { ...s.chatHistory, [fileId]: [...(s.chatHistory[fileId] ?? []), msg] } })),

  appendChatMessage: (fileId, msgId, chunk) =>
    set((s) => ({
      chatHistory: {
        ...s.chatHistory,
        [fileId]: (s.chatHistory[fileId] ?? []).map((m) =>
          m.id === msgId ? { ...m, content: m.content + chunk } : m
        ),
      },
    })),

  setChatMessageError: (fileId, msgId) =>
    set((s) => ({
      chatHistory: {
        ...s.chatHistory,
        [fileId]: (s.chatHistory[fileId] ?? []).map((m) =>
          m.id === msgId ? { ...m, isError: true } : m
        ),
      },
    })),

  setIsGenerating: (v) => set({ isGenerating: v }),
  setIsExplaining: (v) => set({ isExplaining: v }),
  setSplitRatio: (v) => set({ splitRatio: v }),

  toggleLearned: (fileId, nodeText) =>
    set((s) => {
      const prev = s.learnedNodes[fileId] ?? new Set<string>()
      const next = new Set(prev)
      next.has(nodeText) ? next.delete(nodeText) : next.add(nodeText)
      // Also remove from important if marking as learned
      const imp = new Set(s.importantNodes[fileId] ?? new Set<string>())
      if (next.has(nodeText)) imp.delete(nodeText)
      return {
        learnedNodes: { ...s.learnedNodes, [fileId]: next },
        importantNodes: { ...s.importantNodes, [fileId]: imp },
      }
    }),

  toggleImportant: (fileId, nodeText) =>
    set((s) => {
      const prev = s.importantNodes[fileId] ?? new Set<string>()
      const next = new Set(prev)
      next.has(nodeText) ? next.delete(nodeText) : next.add(nodeText)
      // Also remove from learned if marking as important
      const lrn = new Set(s.learnedNodes[fileId] ?? new Set<string>())
      if (next.has(nodeText)) lrn.delete(nodeText)
      return {
        importantNodes: { ...s.importantNodes, [fileId]: next },
        learnedNodes: { ...s.learnedNodes, [fileId]: lrn },
      }
    }),

  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),

  setLearningPathContent: (fileId, content) =>
    set((s) => ({ learningPathContent: { ...s.learningPathContent, [fileId]: content } })),

  appendLearningPathContent: (fileId, chunk) =>
    set((s) => ({
      learningPathContent: {
        ...s.learningPathContent,
        [fileId]: (s.learningPathContent[fileId] ?? '') + chunk,
      },
    })),

  setIsLoadingLearningPath: (v) => set({ isLoadingLearningPath: v }),
}))

useAppStore.subscribe((state) => saveToStorage(state))
