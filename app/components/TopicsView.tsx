"use client"
import { memo, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import type { NoteData, Tree } from "@/app/types"
import { PlantIcon } from "@/app/components/PlantIcon"
import { buildTopicIndex, bestNotebookFor, type TopicRow } from "@/lib/topicIndex"
import { normalizeTopic, freshnessFilter } from "@/lib/topics"
import { getPalette, getType, chipButton, FONT_SERIF } from "@/app/theme/palette"

const relTime = (ms: number, now: number) => {
  if (!ms) return "not studied yet"
  const d = Math.floor((now - ms) / 86_400_000)
  if (d <= 0) return "today"
  if (d === 1) return "yesterday"
  if (d < 30) return `${d} days ago`
  return `${Math.floor(d / 30)} mo ago`
}

type GroupKey = "due" | "saplings" | "fading" | "fresh" | "resting"
const GROUPS: { key: GroupKey; label: string; hint: string }[] = [
  { key: "due", label: "Due now", hint: "cards waiting for you" },
  { key: "saplings", label: "Saplings", hint: "recall grows them to full trees" },
  { key: "fading", label: "Fading", hint: "overdue — losing color" },
  { key: "fresh", label: "Growing strong", hint: "all caught up" },
  { key: "resting", label: "Resting", hint: "no cards yet" },
]
const groupOf = (r: TopicRow): GroupKey =>
  r.due > 0 ? "due" : r.saplings > 0 ? "saplings" : r.freshness < 0.999 ? "fading" : r.cards > 0 || r.fullTrees > 0 ? "fresh" : "resting"

// Fixed starfield so it doesn't reshuffle on re-render (matches the market night sky).
const STARS = Array.from({ length: 38 }, (_, i) => {
  const r = (n: number) => { const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453; return x - Math.floor(x) }
  return { x: r(1) * 100, y: r(2) * 34, s: r(3) < 0.15 ? 2 : 1, o: 0.25 + r(4) * 0.5, d: r(5) * 4 }
})

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

  const now = Date.now()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- tick is a refresh trigger
  const rows = useMemo(() => buildTopicIndex(grove), [grove, tick])
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
  const grouped = GROUPS.map(g => ({ ...g, rows: shown.filter(r => groupOf(r) === g.key) })).filter(g => g.rows.length > 0)

  const totalDue = rows.reduce((s, r) => s + r.due, 0)
  const saplings = rows.reduce((s, r) => s + r.saplings, 0)
  const toGrow = rows.reduce((s, r) => s + r.recallLeft, 0)
  const fading = rows.filter(r => r.freshness < 0.999).length
  const firstDue = rows.find(r => r.due > 0)

  const isDark = theme === "dark"
  const p = getPalette(isDark)
  const type = getType(p)
  const cardBg = isDark ? "#1c1915" : "#ffffff"
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"
  const cardShadow = isDark ? "0 4px 20px rgba(0,0,0,0.45), 0 1px 4px rgba(0,0,0,0.35)" : "0 2px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)"
  const green = isDark ? "#7fb069" : "#4d7c0f"
  const amberSoft = isDark ? "#fbbf24" : "#b45309"
  const fg = p.textPrimary

  const status = (r: TopicRow) => {
    if (r.saplings > 0) return { text: `sapling · ${r.recallLeft} to grow`, color: accent }
    if (r.freshness < 0.999) return { text: "fading", color: amberSoft }
    if (r.fullTrees > 0) return { text: "fully grown", color: green }
    if (r.banked > 0) return { text: `${Math.round(r.banked * 10) / 10} banked`, color: p.textSecondary }
    return { text: r.cards > 0 ? "no tree yet" : "resting", color: p.textMuted }
  }

  const stat = (label: string, value: number | string, sub: string, color: string, i: number) => (
    <motion.div
      key={label}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 + i * 0.05 }}
      style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, boxShadow: cardShadow, padding: "14px 16px" }}
    >
      <div style={{ ...type.eyebrow, fontSize: 9 }}>{label}</div>
      <div style={{ fontFamily: FONT_SERIF, fontSize: 30, lineHeight: 1.1, color, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontFamily: FONT_SERIF, fontSize: 11.5, color: p.textSecondary, marginTop: 2 }}>{sub}</div>
    </motion.div>
  )

  return (
    <div style={{
      position: "absolute", inset: 0, overflowY: "auto", fontFamily: FONT_SERIF,
      background: isDark
        ? "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(217,119,6,0.09), transparent 70%), linear-gradient(180deg, #0c0b09 0%, #12100d 55%, #15130f 100%)"
        : "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(217,119,6,0.08), transparent 70%), #f5f3ef",
    }}>
      {/* Night sky */}
      {isDark && (
        <div aria-hidden style={{ position: "absolute", inset: 0, height: 420, pointerEvents: "none", overflow: "hidden" }}>
          {STARS.map((s, i) => (
            <motion.div key={i}
              animate={{ opacity: [s.o, s.o * 0.3, s.o] }}
              transition={{ duration: 3 + s.d, repeat: Infinity, delay: s.d }}
              style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, borderRadius: "50%", background: "#e8e4dc" }} />
          ))}
        </div>
      )}

      {/* Orchard hills along the bottom */}
      <svg aria-hidden viewBox="0 0 1200 160" preserveAspectRatio="none"
        style={{ position: "fixed", left: 0, right: 0, bottom: 0, width: "100%", height: 140, pointerEvents: "none", opacity: isDark ? 0.55 : 0.35 }}>
        <path d="M0 110 Q 200 60 420 95 T 820 85 T 1200 90 V160 H0Z" fill={isDark ? "#1a2416" : "#c9d4b4"} />
        <path d="M0 130 Q 260 95 520 120 T 1000 110 T 1200 118 V160 H0Z" fill={isDark ? "#141c11" : "#b5c29c"} />
      </svg>

      <div style={{ position: "relative", maxWidth: 760, margin: "0 auto", padding: "22px 16px 160px" }}>
        {/* Title + ornamental divider — matches Stats / Market */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={type.viewTitle}>Recall</span>
          <svg width="220" height="12" viewBox="0 0 220 12" style={{ marginTop: 10, opacity: isDark ? 0.4 : 0.3 }}>
            <line x1="0" y1="6" x2="95" y2="6" stroke={fg} strokeWidth="0.5" />
            <polygon points="110,2 114,6 110,10 106,6" fill={fg} opacity="0.6" />
            <line x1="125" y1="6" x2="220" y2="6" stroke={fg} strokeWidth="0.5" />
          </svg>
          <div style={{ marginTop: 10, fontSize: 14, fontStyle: "italic", color: p.textSecondary }}>
            what you learned, kept alive
          </div>
        </div>
        <button onClick={onClose} aria-label="Close" style={{ ...chipButton(p), position: "absolute", top: 22, right: 16 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          Close
        </button>

        {rows.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ marginTop: 48, textAlign: "center", padding: "40px 24px", background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 20, boxShadow: cardShadow }}
          >
            <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} style={{ display: "inline-block" }}>
              <PlantIcon type="tangerine" size={64} isSeed />
            </motion.div>
            <div style={{ fontSize: 20, color: fg, marginTop: 10 }}>Nothing to recall yet</div>
            <div style={{ fontSize: 14, color: p.textSecondary, marginTop: 8, lineHeight: 1.6 }}>
              Finish a focus session with some notes.<br />Pulp names the topic, plants a sapling, and makes cards to recall.
            </div>
          </motion.div>
        ) : (
          <>
            {/* Summary */}
            <div style={{ marginTop: 26, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
              {stat("Due now", totalDue, totalDue === 1 ? "card waiting" : "cards waiting", totalDue > 0 ? accent : fg, 0)}
              {stat("Topics", rows.length, `${rows.filter(r => r.fullTrees > 0).length} fully grown`, fg, 1)}
              {stat("Saplings", saplings, saplings > 0 ? `${toGrow} answers to grow` : "none waiting", saplings > 0 ? accent : fg, 2)}
              {stat("Fading", fading, fading > 0 ? "overdue topics" : "all fresh", fading > 0 ? amberSoft : green, 3)}
            </div>

            {/* Up next */}
            {firstDue && (
              <motion.button
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.25 }}
                whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }}
                onClick={() => onRecall(firstDue.name, bestNotebookFor(firstDue))}
                style={{
                  marginTop: 10, width: "100%", display: "flex", alignItems: "center", gap: 14, textAlign: "left", cursor: "pointer",
                  padding: "14px 18px", borderRadius: 16, fontFamily: FONT_SERIF,
                  background: isDark ? "linear-gradient(100deg, rgba(217,119,6,0.18), rgba(217,119,6,0.05))" : "linear-gradient(100deg, rgba(217,119,6,0.14), rgba(217,119,6,0.03))",
                  border: `1px solid ${accent}55`, boxShadow: `0 0 24px ${accent}14`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...type.eyebrow, fontSize: 9, color: accent }}>Up next</div>
                  <div style={{ fontSize: 19, color: fg, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{firstDue.name}</div>
                </div>
                <span style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8, background: accent, color: "#fff", borderRadius: 999, padding: "8px 16px", fontSize: 14, boxShadow: `0 4px 14px ${accent}55` }}>
                  Start · {firstDue.due}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </span>
              </motion.button>
            )}

            {/* Search */}
            <div style={{ marginTop: 18, position: "relative" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={p.textMuted} strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
              </svg>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search topics or notebooks…"
                style={{
                  width: "100%", boxSizing: "border-box", padding: "10px 14px 10px 36px", borderRadius: 12,
                  border: `1px solid ${cardBorder}`, background: isDark ? "rgba(255,255,255,0.03)" : "#fff", color: fg, fontSize: 15, fontFamily: FONT_SERIF, outline: "none",
                }}
              />
            </div>

            {/* Groups */}
            {grouped.map(g => (
              <section key={g.key} style={{ marginTop: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ ...type.sectionHeader, color: g.key === "due" ? accent : p.textSecondary }}>{g.label}</span>
                  <span style={{ fontSize: 11, color: p.textMuted, fontVariantNumeric: "tabular-nums" }}>{g.rows.length}</span>
                  <span style={{ flex: 1, height: 1, background: cardBorder }} />
                  <span style={{ fontSize: 11, fontStyle: "italic", color: p.textMuted }}>{g.hint}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {g.rows.map((r, i) => {
                    const tree = newestTree.get(r.key)
                    const st = status(r)
                    const nb = r.notebookIds.map(id => noteName.get(id)).filter(Boolean)
                    const fresh = Math.max(0, Math.min(1, r.freshness))
                    return (
                      <motion.div
                        key={r.key}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -1 }}
                        transition={{ duration: 0.22, delay: Math.min(i, 12) * 0.03 }}
                        style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px 10px 10px", borderRadius: 14, border: `1px solid ${cardBorder}`, background: cardBg, boxShadow: cardShadow }}
                      >
                        {/* Little plot: plant on a mossy mound */}
                        <button
                          onClick={() => tree && onShowTopic(r.name)}
                          disabled={!tree}
                          title={tree ? "Show in orchard" : undefined}
                          style={{
                            position: "relative", width: 54, height: 54, flexShrink: 0, borderRadius: 12, padding: 0, overflow: "hidden",
                            border: `1px solid ${cardBorder}`, cursor: tree ? "pointer" : "default",
                            background: isDark ? "linear-gradient(180deg, #14120f 0%, #1a1814 60%, #24301d 60%, #1c2617 100%)" : "linear-gradient(180deg, #faf8f3 0%, #f1ede4 60%, #c9d4b4 60%, #b5c29c 100%)",
                          }}
                        >
                          <div style={{ position: "absolute", left: 0, right: 0, bottom: 6, display: "flex", justifyContent: "center", filter: freshnessFilter(r.freshness), transition: "filter 0.8s ease" }}>
                            {tree
                              ? <PlantIcon type={tree.type} size={42} stage={tree.stage} hideGround />
                              : <PlantIcon type="tangerine" size={38} isSeed hideGround />}
                          </div>
                        </button>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 17, color: fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                          <div style={{ fontSize: 12.5, color: p.textMuted, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <span style={{ color: st.color }}>{st.text}</span>
                            {nb.length > 0 && <> · {nb.join(", ")}</>}
                            {" · "}{relTime(r.lastStudied, now)}
                          </div>
                          {/* Freshness meter */}
                          {r.cards > 0 && (
                            <div title={`${Math.round(fresh * 100)}% fresh`} style={{ marginTop: 6, width: 120, maxWidth: "60%", height: 3, borderRadius: 2, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                              <motion.div
                                initial={{ width: 0 }} animate={{ width: `${Math.max(4, fresh * 100)}%` }} transition={{ duration: 0.8, delay: 0.1 + Math.min(i, 12) * 0.03 }}
                                style={{ height: "100%", borderRadius: 2, background: fresh >= 0.999 ? green : fresh > 0.5 ? amberSoft : "#dc6a4a" }}
                              />
                            </div>
                          )}
                        </div>

                        {r.due > 0 ? (
                          <motion.button
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                            onClick={() => onRecall(r.name, bestNotebookFor(r))}
                            style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 7, background: accent, color: "#fff", border: "none", borderRadius: 999, padding: "6px 7px 6px 14px", fontSize: 14, fontFamily: FONT_SERIF, cursor: "pointer", whiteSpace: "nowrap", boxShadow: `0 3px 12px ${accent}40` }}
                          >
                            Recall
                            <span style={{ background: "rgba(255,255,255,0.22)", borderRadius: 999, padding: "0 7px", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{r.due}</span>
                          </motion.button>
                        ) : r.cards > 0 ? (
                          <span style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: green, whiteSpace: "nowrap" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                            caught up
                          </span>
                        ) : (
                          <span style={{ flexShrink: 0, fontSize: 12.5, color: p.textMuted, whiteSpace: "nowrap" }}>no cards</span>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </section>
            ))}
            {q && shown.length === 0 && <div style={{ textAlign: "center", color: p.textSecondary, fontSize: 14, marginTop: 24, fontStyle: "italic" }}>No topics match “{query}”.</div>}
          </>
        )}
      </div>
    </div>
  )
})
