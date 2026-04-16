import { create } from 'zustand'

export interface MediaItem {
  id: string
  filename: string
  mimetype: string
  size: number
  path: string
  tags: string
  createdAt: string
}

export interface ScriptData {
  id?: string
  content: string
  contentType: string
  niche: string
  capcut?: string
  hashtags?: string[]
}

interface AppState {
  selectedMedia: MediaItem[]
  currentScript: ScriptData | null
  instagramToken: string
  isGenerating: boolean

  toggleMediaSelection: (media: MediaItem) => void
  setSelectedMedia: (media: MediaItem[]) => void
  setCurrentScript: (script: ScriptData | null) => void
  updateScriptCapcut: (capcut: string) => void
  updateScriptHashtags: (hashtags: string[]) => void
  setInstagramToken: (token: string) => void
  setGenerating: (v: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  selectedMedia: [],
  currentScript: null,
  instagramToken: localStorage.getItem('ig_token') ?? '',
  isGenerating: false,

  toggleMediaSelection: (media) =>
    set((s) => {
      const exists = s.selectedMedia.some((m) => m.id === media.id)
      return {
        selectedMedia: exists
          ? s.selectedMedia.filter((m) => m.id !== media.id)
          : [...s.selectedMedia, media],
      }
    }),

  setSelectedMedia: (media) => set({ selectedMedia: media }),

  setCurrentScript: (script) => set({ currentScript: script }),

  updateScriptCapcut: (capcut) =>
    set((s) => ({
      currentScript: s.currentScript ? { ...s.currentScript, capcut } : null,
    })),

  updateScriptHashtags: (hashtags) =>
    set((s) => ({
      currentScript: s.currentScript ? { ...s.currentScript, hashtags } : null,
    })),

  setInstagramToken: (token) => {
    localStorage.setItem('ig_token', token)
    set({ instagramToken: token })
  },

  setGenerating: (v) => set({ isGenerating: v }),
}))
