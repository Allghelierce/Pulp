"use client"
import { useRef, useCallback, useEffect } from "react"
import type { NoteData, NoteVersion } from "@/app/types"

const MAX_VERSIONS = 30
const SNAPSHOT_INTERVAL = 5 * 60 * 1000
const MIN_SNAPSHOT_GAP = 10_000
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

  }
}

function contentHash(note: NoteData): string {
  return JSON.stringify({
    pages: note.pages,
    boxes: note.boxes,
    lines: note.lines,
    hlines: note.hlines,
    drawings: note.drawings,

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

// `force` skips the min-gap throttle (used before a restore, so recent edits are kept).
function snapshotNote(note: NoteData, lastHashMap: Map<string, string>, force = false): NoteVersion[] {
  const hash = contentHash(note)
  const prev = lastHashMap.get(note.id)
  if (hash === prev) return loadVersions(note.id)

  const versions = loadVersions(note.id)
  const last = versions[versions.length - 1]
  if (!force && last && Date.now() - last.timestamp < MIN_SNAPSHOT_GAP) return versions

  lastHashMap.set(note.id, hash)
  versions.push(extractVersion(note))
  saveVersions(note.id, versions)
  return versions
}

export function useVersionHistory(
  notes: NoteData[],
  activeTabId: string | null,
) {
  const notesRef = useRef(notes)
  notesRef.current = notes
  const activeTabRef = useRef(activeTabId)
  const hashMapRef = useRef(new Map<string, string>())
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)

  const takeSnapshot = useCallback((): NoteVersion[] => {
    const tabId = activeTabRef.current
    if (!tabId) return []
    const note = notesRef.current.find(n => n.id === tabId)
    if (!note) return []
    return snapshotNote(note, hashMapRef.current)
  }, [])

  useEffect(() => {
    intervalRef.current = setInterval(takeSnapshot, SNAPSHOT_INTERVAL)
    return () => clearInterval(intervalRef.current)
  }, [takeSnapshot])

  // Seed hash when switching to a note, snapshot when leaving one
  useEffect(() => {
    const prevId = activeTabRef.current
    if (prevId && prevId !== activeTabId) {
      const prev = notesRef.current.find(n => n.id === prevId)
      if (prev) snapshotNote(prev, hashMapRef.current)
    }
    activeTabRef.current = activeTabId
    if (activeTabId) {
      const note = notesRef.current.find(n => n.id === activeTabId)
      if (note) hashMapRef.current.set(activeTabId, contentHash(note))
    }
  }, [activeTabId])

  // Snapshot on page unload
  useEffect(() => {
    const handler = () => {
      const tabId = activeTabRef.current
      if (!tabId) return
      const note = notesRef.current.find(n => n.id === tabId)
      if (note) snapshotNote(note, hashMapRef.current)
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [])

  const getVersions = useCallback((noteId: string): NoteVersion[] => {
    return loadVersions(noteId)
  }, [])

  const restoreVersion = useCallback((noteId: string, version: NoteVersion, setNotes: (updater: NoteData[] | ((prev: NoteData[]) => NoteData[])) => void) => {
    const current = notesRef.current.find(n => n.id === noteId)
    if (current) snapshotNote(current, hashMapRef.current, true)

    setNotes(prev => prev.map(n => {
      if (n.id !== noteId) return n
      return {
        ...n,
        pages: version.pages,
        boxes: version.boxes,
        lines: version.lines,
        hlines: version.hlines,
        drawings: version.drawings,
      }
    }))
    hashMapRef.current.set(noteId, JSON.stringify({
      pages: version.pages,
      boxes: version.boxes,
      lines: version.lines,
      hlines: version.hlines,
      drawings: version.drawings,
    }))
  }, [])

  const deleteVersion = useCallback((noteId: string, timestamp: number) => {
    const versions = loadVersions(noteId).filter(v => v.timestamp !== timestamp)
    saveVersions(noteId, versions)
  }, [])

  return { takeSnapshot, getVersions, restoreVersion, deleteVersion }
}
