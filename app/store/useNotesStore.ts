import { create } from "zustand"
import type { NoteData, FolderData } from "@/app/types"

interface NotesState {
  notes: NoteData[]
  folders: FolderData[]
  activeTabId: string | null
  currentPageIdx: number

  setNotes: (updater: NoteData[] | ((prev: NoteData[]) => NoteData[])) => void
  setFolders: (updater: FolderData[] | ((prev: FolderData[]) => FolderData[])) => void
  setActiveTabId: (id: string | null | ((prev: string | null) => string | null)) => void
  setCurrentPageIdx: (idx: number | ((prev: number) => number)) => void
}

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  folders: [],
  activeTabId: null,
  currentPageIdx: 0,

  setNotes: (updater) =>
    set((s) => ({
      notes: typeof updater === "function" ? updater(s.notes) : updater,
    })),

  setFolders: (updater) =>
    set((s) => ({
      folders: typeof updater === "function" ? updater(s.folders) : updater,
    })),

  setActiveTabId: (id) =>
    set((s) => ({
      activeTabId: typeof id === "function" ? id(s.activeTabId) : id,
    })),
  setCurrentPageIdx: (idx) =>
    set((s) => ({
      currentPageIdx: typeof idx === "function" ? idx(s.currentPageIdx) : idx,
    })),
}))

export const selectActiveNote = (s: NotesState) =>
  s.notes.find((n) => n.id === s.activeTabId)
