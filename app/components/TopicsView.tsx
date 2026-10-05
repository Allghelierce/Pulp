"use client"
import { memo, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import type { NoteData, Tree } from "@/app/types"
import { PlantIcon } from "@/app/components/PlantIcon"
import { buildTopicIndex, bestNotebookFor, type TopicRow } from "@/lib/topicIndex"
import { normalizeTopic, freshnessFilter } from "@/lib/topics"

const relTime = (ms: number, now: number) => {
  if (!ms) return "—"
  const d = Math.floor((now - ms) / 86_400_000)
  if (d <= 0) return "today"
  if (d === 1) return "yesterday"
  if (d < 30) return `${d} days ago`
  return `${Math.floor(d / 30)} mo ago`
}

// "tomorrow", "in 3h", "in 5 days" — when a topic's next card comes due.
const dueIn = (ms: number, now: number) => {
  const h = (ms - now) / 3_600_000
  if (h < 1) return "soon"
  const days = Math.round((new Date(ms).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 86_400_000)
  if (days === 0) return `in ${Math.round(h)}h`
  if (days === 1) return "tomorrow"
  return days < 30 ? `in ${days} days` : `in ${Math.round(days / 30)} mo`
}

// Every topic you've studied, most urgent first. The front door to recall:
// find a topic, see how it's doing, recall it, or jump to its trees.
export const TopicsView = memo(function TopicsView({ theme, accent, grove, notes, onClose, onRecall, onShowTopic }: {
  theme: "light" | "dark"
  accent: string
  grove: Tree[]
  notes: NoteData[]
  onClose: () => void
  onRecall: (topic: string, notebookId?: string) => void
  onShowTopic: (topic: string) => void
}) {
  const [query, setQuery] = useState("")
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const refresh = () => setTick(t => t + 1)
    window.addEventListener("pulp-cards-queued", refresh)
    window.addEventListener("focus", refresh)
    return () => { window.removeEventListener("pulp-cards-queued", refresh); window.removeEventListener("focus", refresh) }
  }, [])

  // Esc clears the search first, then closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return
      e.preventDefault()
      if (query) setQuery("")
      else onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [query, onClose])

  const now = Date.now()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- tick is a refresh trigger
  const rows = useMemo(() => buildTopicIndex(grove, Date.now(), new Set(notes.map(n => n.id))), [grove, notes, tick])
  const newestTree = useMemo(() => {
    const m = new Map<string, Tree>()
    for (const t of grove) {
      if (!t?.topic) continue
      const k = normalizeTopic(t.topic)
      const cur = m.get(k)
      if (!cur || t.plantedAt > cur.plantedAt) m.set(k, t)
    }
    return m
  }, [grove])
  const noteName = useMemo(() => new Map(notes.map(n => [n.id, n.subject || "Untitled"])), [notes])

  const q = query.trim().toLowerCase()
  const shown = q
    ? rows.filter(r => r.name.toLowerCase().includes(q) || r.notebookIds.some(id => (noteName.get(id) || "").toLowerCase().includes(q)))
    : rows
  const totalDue = rows.reduce((s, r) => s + r.due, 0)

  const isDark = theme === "dark"
  const font = "Crimson Pro, serif"
  const fg = isDark ? "#e4e4e7" : "#27272a"
  const muted = isDark ? "#a1a1aa" : "#71717a"
  const subtle = isDark ? "#71717a" : "#a1a1aa"
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"
  const rowBg = isDark ? "rgba(255,255,255,0.02)" : "#fff"

  const status = (r: TopicRow) => {
    if (r.saplings > 0) return { text: `sapling · ${Math.ceil(r.recallLeft)} to grow`, color: accent }
    if (r.freshness < 0.999) return { text: "fading", color: isDark ? "#fbbf24" : "#b45309" }
    if (r.fullTrees > 0) return { text: "fully grown", color: isDark ? "#4ade80" : "#16a34a" }
    if (r.banked > 0) return { text: `${Math.round(r.banked * 10) / 10} banked`, color: muted }
    return { text: "no tree yet", color: subtle }
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: isDark ? "#0a0a0b" : "#fafaf8", fontFamily: font, overflowY: "auto" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 16px 48px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 500, color: fg, margin: 0 }}>Recall</h1>
            <div style={{ fontSize: 14, color: muted, marginTop: 4 }}>
              {rows.length === 0 ? "No topics yet" : `${rows.length} topic${rows.length !== 1 ? "s" : ""}`}
              {totalDue > 0 && <> · <span style={{ color: accent }}>{totalDue} card{totalDue !== 1 ? "s" : ""} due</span></>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", color: muted, fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {rows.length > 0 && (
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search topics or notebooks…"
            style={{
              marginTop: 18, width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 10,
              border: `1px solid ${border}`, background: rowBg, color: fg, fontSize: 15, fontFamily: font, outline: "none",
            }}
          />
        )}

        {rows.length === 0 && (
          <div style={{ marginTop: 48, textAlign: "center", color: muted, fontSize: 15, lineHeight: 1.6 }}>
            Finish a focus session with some notes.<br />Pulp names the topic, plants a sapling, and makes cards to recall.
          </div>
        )}

        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {shown.map((r, i) => {
            const tree = newestTree.get(r.key)
            const st = status(r)
            const nb = r.notebookIds.map(id => noteName.get(id)).filter(Boolean)
            return (
              <motion.div
                key={r.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i, 12) * 0.025 }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, border: `1px solid ${border}`, background: rowBg }}
              >
                <button
                  onClick={() => tree && onShowTopic(r.name)}
                  disabled={!tree}
                  title={tree ? "Show in orchard" : undefined}
                  style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 10, border: "none", background: `${accent}10`, display: "flex", alignItems: "center", justifyContent: "center", cursor: tree ? "pointer" : "default", padding: 0 }}
                >
                  {tree
                    ? <div style={{ filter: freshnessFilter(r.freshness), transition: "filter 0.8s ease" }}><PlantIcon type={tree.type} size={38} stage={tree.stage} hideGround /></div>
                    : <span style={{ fontSize: 18, opacity: 0.6 }}>🌰</span>}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16.5, color: fg, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                  <div style={{ fontSize: 12.5, color: subtle, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span style={{ color: st.color }}>{st.text}</span>
                    {nb.length > 0 && <> · {nb.join(", ")}</>}
                    {r.lastStudied > 0 && <> · {relTime(r.lastStudied, now)}</>}
                  </div>
                </div>
                {r.due > 0 ? (() => {
                  const nb = bestNotebookFor(r)
                  // The session opens one notebook, so show that notebook's count.
                  const n = (nb && r.dueByNotebook[nb]) || r.due
                  return (
                  <button
                    onClick={() => onRecall(r.name, nb)}
                    style={{ flexShrink: 0, background: accent, color: "#fff", border: "none", borderRadius: 9, padding: "7px 14px", fontSize: 14, fontFamily: font, cursor: "pointer", whiteSpace: "nowrap" }}
                  >Recall · {n}</button>
                  )
                })() : (
                  <span style={{ flexShrink: 0, fontSize: 12.5, color: subtle, whiteSpace: "nowrap" }}>{r.cards === 0 ? "no cards" : r.nextDue ? `ready ${dueIn(r.nextDue, now)}` : "all caught up"}</span>
                )}
              </motion.div>
            )
          })}
          {q && shown.length === 0 && <div style={{ textAlign: "center", color: muted, fontSize: 14, marginTop: 16 }}>No topics match “{query}”.</div>}
        </div>
      </div>
    </div>
  )
})
