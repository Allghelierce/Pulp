"use client"
import { memo, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { PlantIcon } from "@/app/components/PlantIcon"
import { TREE_TYPES } from "@/app/constants"
import type { PlantedDetail, TaggedDetail } from "@/app/components/VitalitySystem"

const STAGE_NAMES = ["Seed", "Sprout", "Sapling", "Young tree", "Full tree"]
const AUTO_HIDE_MS = 9000

// Reward moment after "Claim Reward": the tree pops in, then the AI-named topic
// and queued cards fill in, with a shortcut to recall it.
export const PlantedToast = memo(function PlantedToast({ theme, accent }: {
  theme: "light" | "dark"
  accent: string
  onReview?: (topic: string, notebookId?: string) => void
}) {
  const [planted, setPlanted] = useState<PlantedDetail | null>(null)
  const [tagged, setTagged] = useState<TaggedDetail | null>(null)
  const [tagFailed, setTagFailed] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const plantedRef = useRef<PlantedDetail | null>(null)

  const armHide = (ms = AUTO_HIDE_MS) => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setPlanted(null), ms)
  }

  useEffect(() => {
    const onPlanted = (e: Event) => {
      const d = (e as CustomEvent<PlantedDetail>).detail
      plantedRef.current = d
      setPlanted(d); setTagged(null); setTagFailed(false)
      // Wait longer while the AI names the topic.
      armHide(d.tagging ? 20000 : AUTO_HIDE_MS)
    }
    const onTagged = (e: Event) => {
      const d = (e as CustomEvent<TaggedDetail>).detail
      if (!plantedRef.current || d.treeId !== plantedRef.current.treeId) return
      if (d.topic) setTagged(d)
      else setTagFailed(true)
      armHide()
    }
    window.addEventListener("pulp-tree-planted", onPlanted)
    window.addEventListener("pulp-tree-tagged", onTagged)
    return () => {
      window.removeEventListener("pulp-tree-planted", onPlanted)
      window.removeEventListener("pulp-tree-tagged", onTagged)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [])

  const isDark = theme === "dark"
  const font = "Crimson Pro, serif"
  const fg = isDark ? "#e4e4e7" : "#27272a"
  const muted = isDark ? "#a1a1aa" : "#71717a"
  const name = planted ? (TREE_TYPES[planted.type]?.name || "Tree") : ""

  let subtitle: React.ReactNode = null
  if (planted) {
    if (planted.noTree) subtitle = planted.wroteSome
      ? "A bit more notes next time — about a sentence every 10 minutes plants a tree"
      : "Write notes during a session to plant a tree"
    else if (planted.grew) subtitle = `Grew to ${STAGE_NAMES[Math.min(4, planted.stage)].toLowerCase()}`
    else if (tagged) {
      const left = Math.max(0, tagged.recallNeeded - tagged.recallDone)
      subtitle = (
        <>
          <span style={{ color: accent }}>{tagged.topic}</span>
          {left <= 0 ? " · fully grown!" : tagged.cards > 0 ? <> · {tagged.cards} card{tagged.cards !== 1 ? "s" : ""} ready tomorrow</> : ""}
        </>
      )
    } else if (planted.tagging && !tagFailed) subtitle = <span style={{ opacity: 0.8 }}>Naming your topic…</span>
    else subtitle = "Recall it later to grow it into a full tree"
  }

  return (
    <AnimatePresence>
      {planted && (
        <motion.div
          key={planted.treeId}
          initial={{ opacity: 0, y: 30, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          onMouseEnter={() => { if (hideTimer.current) clearTimeout(hideTimer.current) }}
          onMouseLeave={() => armHide(4000)}
          style={{
            position: "fixed", left: "50%", bottom: 28, translateX: "-50%", zIndex: 200,
            display: "flex", alignItems: "center", gap: 14, padding: "12px 18px 12px 12px",
            maxWidth: "calc(100vw - 32px)", boxSizing: "border-box",
            background: isDark ? "rgba(18,18,20,0.96)" : "rgba(255,255,255,0.97)",
            border: `1px solid ${accent}40`, borderRadius: 16,
            boxShadow: isDark ? `0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px ${accent}14` : "0 12px 40px rgba(0,0,0,0.12)",
            fontFamily: font,
          }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 12, delay: 0.12 }}
            style={{ width: 56, height: 56, borderRadius: 12, background: `${accent}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            {planted.noTree ? <span style={{ fontSize: 26 }}>⏱️</span> : <PlantIcon type={planted.type} size={50} stage={planted.stage} />}
          </motion.div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 17, color: fg, fontWeight: 600 }}>
              {planted.noTree ? "Session logged" : <>{planted.grew ? `${name} grew` : `${name} ${STAGE_NAMES[Math.min(4, planted.stage)].toLowerCase()} planted`} 🌱</>}
            </div>
            <div style={{ fontSize: 13.5, color: muted, marginTop: 2 }}>{subtitle}</div>
          </div>
          <button
            onClick={() => setPlanted(null)}
            aria-label="Dismiss"
            style={{ background: "none", border: "none", color: muted, fontSize: 18, cursor: "pointer", padding: "0 0 0 4px", lineHeight: 1 }}
          >×</button>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
