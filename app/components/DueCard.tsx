"use client"
import { memo, useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { loadDeck } from "@/lib/recallSchedule"
import { normalizeTopic } from "@/lib/topics"

interface Due { count: number; topics: string[] }

// Due recall cards for this notebook, most-due topic first.
function readDue(noteId: string): Due {
  const deck = loadDeck(noteId)
  if (!deck) return { count: 0, topics: [] }
  const now = Date.now()
  const byTopic = new Map<string, { name: string; n: number }>()
  let count = 0
  for (const c of deck.cards) {
    if (c.due > now) continue
    count++
    if (!c.topic) continue
    const k = normalizeTopic(c.topic)
    const e = byTopic.get(k) ?? { name: c.topic, n: 0 }
    e.n++
    byTopic.set(k, e)
  }
  return { count, topics: [...byTopic.values()].sort((a, b) => b.n - a.n).map(e => e.name) }
}

// "5 cards due · Photosynthesis  [Recall now]" — keeps recall front and center
// on the notebook itself. Dismiss hides it until the due count changes.
export const DueCard = memo(function DueCard({ noteId, theme, accent, hidden, onReview }: {
  noteId: string | null
  theme: "light" | "dark"
  accent: string
  hidden?: boolean
  onReview: () => void
}) {
  const [tick, setTick] = useState(0)
  const [dismissedAt, setDismissedAt] = useState<string | null>(null)
  // `hidden` flips when review closes — re-read so the count reflects that session.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- tick/hidden are refresh triggers
  const due = useMemo<Due>(() => (noteId ? readDue(noteId) : { count: 0, topics: [] }), [noteId, tick, hidden])

  useEffect(() => {
    const refresh = () => setTick(t => t + 1)
    const id = setInterval(refresh, 60_000)
    window.addEventListener("pulp-cards-queued", refresh)
    window.addEventListener("focus", refresh)
    return () => {
      clearInterval(id)
      window.removeEventListener("pulp-cards-queued", refresh)
      window.removeEventListener("focus", refresh)
    }
  }, [])

  const key = `${noteId}:${due.count}`
  const show = !hidden && !!noteId && due.count > 0 && dismissedAt !== key
  const isDark = theme === "dark"
  const font = "Crimson Pro, serif"
  const [first, ...rest] = due.topics

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          style={{
            position: "absolute", top: 58, left: "50%", translateX: "-50%", zIndex: 40,
            display: "flex", alignItems: "center", gap: 12, padding: "8px 8px 8px 16px",
            maxWidth: "calc(100% - 32px)", boxSizing: "border-box",
            background: isDark ? "rgba(24,24,27,0.95)" : "rgba(255,255,255,0.97)",
            border: `1px solid ${accent}55`, borderRadius: 12,
            boxShadow: isDark ? "0 6px 24px rgba(0,0,0,0.45)" : "0 6px 24px rgba(0,0,0,0.1)",
            fontFamily: font, whiteSpace: "nowrap",
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: accent, boxShadow: `0 0 8px ${accent}`, flexShrink: 0 }} />
          <span style={{ fontSize: 15, color: isDark ? "#e4e4e7" : "#27272a", overflow: "hidden", textOverflow: "ellipsis" }}>
            <b style={{ fontWeight: 600 }}>{due.count} card{due.count !== 1 ? "s" : ""} due</b>
            {first && <span style={{ color: isDark ? "#a1a1aa" : "#71717a" }}> · {first}{rest.length > 0 && ` +${rest.length} more`}</span>}
          </span>
          <button
            onClick={onReview}
            style={{ background: accent, color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 14, fontFamily: font, cursor: "pointer" }}
          >Recall now</button>
          <button
            onClick={() => setDismissedAt(key)}
            aria-label="Hide"
            style={{ background: "none", border: "none", color: isDark ? "#71717a" : "#a1a1aa", fontSize: 17, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}
          >×</button>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
