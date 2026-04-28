"use client"
import { useRef, useCallback, useEffect } from "react"
import type { NoteData, NoteVersion } from "@/app/types"

const MAX_VERSIONS = 30
const SNAPSHOT_INTERVAL = 5 * 60 * 1000 // 5 minutes
const STORAGE_PREFIX = "pulp-versions-"

function extractVersion(note: NoteData): NoteVersion {
  return {
    timestamp: Date.now(),
    subject: note.subject,
    pages: note.pages,
    boxes: note.boxes,
    lines: note.lines,
    hlines: note.hlines,
    drawings: note.drawings,
    flashcards: note.flashcards,
  }
}

function contentHash(note: NoteData): string {
  return JSON.stringify({
    pages: note.pages,
    boxes: note.boxes,
    lines: note.lines,
    hlines: note.hlines,
    drawings: note.drawings,
    flashcards: note.flashcards,
  })
}

function loadVersions(noteId: string): NoteVersion[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + noteId)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveVersions(noteId: string, versions: NoteVersion[]) {
  try {
    localStorage.setItem(STORAGE_PREFIX + noteId, JSON.stringify(versions.slice(-MAX_VERSIONS)))
  } catch { /* localStorage full — silently skip */ }
}

export function useVersionHistory(
  notes: NoteData[],
  activeTabId: string | null,
) {
  const lastHashRef = useRef<string>("")
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  const getActiveNote = useCallback(() => {
    if (!activeTabId) return null
    return notes.find(n => n.id === activeTabId) ?? null
  }, [notes, activeTabId])

  const takeSnapshot = useCallback(() => {
    const note = getActiveNote()
    if (!note) return
    const hash = contentHash(note)
    if (hash === lastHashRef.current) return
    lastHashRef.current = hash
    const versions = loadVersions(note.id)
    versions.push(extractVersion(note))
    saveVersions(note.id, versions)
  }, [getActiveNote])

  // Auto-snapshot on interval
  useEffect(() => {
    intervalRef.current = setInterval(takeSnapshot, SNAPSHOT_INTERVAL)
    return () => clearInterval(intervalRef.current)
  }, [takeSnapshot])

  // Snapshot when switching away from a note
  const prevTabRef = useRef(activeTabId)
  useEffect(() => {
    if (prevTabRef.current && prevTabRef.current !== activeTabId) {
      const prev = notes.find(n => n.id === prevTabRef.current)
      if (prev) {
        const hash = contentHash(prev)
        if (hash !== lastHashRef.current) {
          lastHashRef.current = hash
          const versions = loadVersions(prev.id)
          versions.push(extractVersion(prev))
          saveVersions(prev.id, versions)
        }
      }
    }
    prevTabRef.current = activeTabId
    if (activeTabId) {
      const note = notes.find(n => n.id === activeTabId)
      if (note) lastHashRef.current = contentHash(note)
    }
  }, [activeTabId, notes])

  const getVersions = useCallback((noteId: string): NoteVersion[] => {
    return loadVersions(noteId)
  }, [])

  const restoreVersion = useCallback((noteId: string, version: NoteVersion, setNotes: React.Dispatch<React.SetStateAction<NoteData[]>>) => {
    // Snapshot current state before restoring
    const current = notes.find(n => n.id === noteId)
    if (current) {
      const versions = loadVersions(noteId)
      versions.push(extractVersion(current))
      saveVersions(noteId, versions)
    }
    setNotes(prev => prev.map(n => {
      if (n.id !== noteId) return n
      return {
        ...n,
        pages: version.pages,
        boxes: version.boxes,
        lines: version.lines,
        hlines: version.hlines,
        drawings: version.drawings,
        flashcards: version.flashcards,
      }
    }))
  }, [notes])

  const deleteVersion = useCallback((noteId: string, timestamp: number) => {
    const versions = loadVersions(noteId).filter(v => v.timestamp !== timestamp)
    saveVersions(noteId, versions)
  }, [])

  return { takeSnapshot, getVersions, restoreVersion, deleteVersion }
}
