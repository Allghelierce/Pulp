"use client"
// Stage-change celebration for the timer tree. Every plant gets a themed burst
// (petals, crystals, needles, bubbles…) whose size scales with the stage reached
// and the plant's rarity. Plays once per transition, then unmounts itself.
import { memo, useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { TREE_TYPES } from "@/app/constants"

// Visual stages used by the timer: -1 idle seed, 0 seed, 1..4 sprout → mature.
export type VisualStage = -1 | 0 | 1 | 2 | 3 | 4

type Kit = "petal" | "leaf" | "fruit" | "crystal" | "needle" | "snow" | "sand" | "spore" | "bubble" | "star" | "ash" | "blade"

// Particle kit per shape — the "flavor" of each plant's burst.
const SHAPE_KIT: Record<string, Kit[]> = {
  sakura: ["petal", "petal", "leaf"], bloom: ["petal", "petal", "leaf"], lotus: ["petal", "bubble"],
  sunflower: ["petal", "leaf"], ivy: ["leaf", "leaf"], sage: ["leaf", "spore"],
  oak: ["leaf"], birch: ["leaf"], baobab: ["leaf", "sand"], bonsai: ["leaf", "petal"],
  conifer: ["needle"], cypress: ["needle"], juniper: ["needle", "fruit"], cedarwood: ["needle", "leaf"],
  winterveil: ["snow", "needle"], cactus: ["sand", "petal"], agave: ["sand", "blade"],
  bamboo: ["blade", "leaf"], cattail: ["blade", "spore"], palm: ["blade", "sand"],
  mushroom: ["spore", "spore"], coral: ["bubble", "petal"], mangrove: ["bubble", "leaf"],
  whirlpool: ["bubble", "bubble"], leviathan: ["bubble", "crystal"],
  prismatic: ["crystal", "star"], starweaver: ["star", "star"], void: ["star", "crystal"],
  dead: ["ash"],
  citrus: ["fruit", "leaf"], lemon: ["fruit", "leaf"], pear: ["fruit", "leaf"], plum: ["fruit", "leaf"],
  grape: ["fruit", "leaf"], lychee: ["fruit", "leaf"], melon: ["fruit", "leaf"], papaya: ["fruit", "leaf"],
  passionfruit: ["fruit", "petal"], pineapple: ["fruit", "blade"],
}

const RARITY_BOOST: Record<string, number> = {
  common: 1, uncommon: 1.15, rare: 1.3, "true rare": 1.5, premium: 1.6, extinct: 1.7, chroma: 1.8,
}

// Small deterministic RNG so a burst's layout is stable across re-renders.
function rng(seed: number) {
  let s = seed >>> 0 || 1
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

function shade(hex: string, amt: number, alpha = 1): string {
  const n = parseInt(hex.replace("#", ""), 16)
  const c = (v: number) => Math.max(0, Math.min(255, v + amt))
  return `rgba(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)},${alpha})`
}

function Particle({ kit, color, size }: { kit: Kit; color: string; size: number }) {
  const s = size
  switch (kit) {
    case "petal":
      return <svg width={s} height={s} viewBox="0 0 10 10"><path d="M5 0 C9 3 8 8 5 10 C2 8 1 3 5 0Z" fill={shade(color, 50)} opacity={0.95} /></svg>
    case "leaf":
      return <svg width={s} height={s} viewBox="0 0 10 10"><path d="M1 9 C1 3 5 0 9 1 C9 6 6 9 1 9Z" fill={shade(color, -10)} /><path d="M1 9 L7 3" stroke={shade(color, -50)} strokeWidth={0.6} /></svg>
    case "fruit":
      return <svg width={s} height={s} viewBox="0 0 10 10"><circle cx="5" cy="5.5" r="4" fill={color} /><circle cx="3.6" cy="4" r="1.2" fill="#fff" opacity={0.5} /><path d="M5 1.5 L6 0" stroke="#3f6212" strokeWidth={0.8} /></svg>
    case "crystal":
      return <svg width={s} height={s} viewBox="0 0 10 10"><path d="M5 0 L8 4 L5 10 L2 4Z" fill={shade(color, 60)} /><path d="M5 0 L8 4 L5 5Z" fill="#fff" opacity={0.6} /></svg>
    case "needle":
      return <svg width={s} height={s} viewBox="0 0 10 10"><path d="M1 9 L9 1" stroke={shade(color, -20)} strokeWidth={1.4} strokeLinecap="round" /></svg>
    case "snow":
      return <svg width={s} height={s} viewBox="0 0 10 10" stroke="#f1f5f9" strokeWidth={0.9} strokeLinecap="round"><path d="M5 0.5 V9.5 M1 2.8 L9 7.2 M1 7.2 L9 2.8" /></svg>
    case "sand":
      return <svg width={s} height={s} viewBox="0 0 10 10"><circle cx="5" cy="5" r="3" fill="#d6b77a" opacity={0.85} /></svg>
    case "spore":
      return <svg width={s} height={s} viewBox="0 0 10 10"><circle cx="5" cy="5" r="2.2" fill={shade(color, 70)} /><circle cx="5" cy="5" r="4.5" fill={shade(color, 70)} opacity={0.25} /></svg>
    case "bubble":
      return <svg width={s} height={s} viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill={shade(color, 40)} fillOpacity={0.15} stroke={shade(color, 80)} strokeWidth={0.8} /><circle cx="3.5" cy="3.5" r="0.9" fill="#fff" /></svg>
    case "star":
      return <svg width={s} height={s} viewBox="0 0 10 10"><path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4Z" fill="#fff" /><circle cx="5" cy="5" r="1.6" fill={shade(color, 60)} /></svg>
    case "ash":
      return <svg width={s} height={s} viewBox="0 0 10 10"><circle cx="5" cy="5" r="2.5" fill="#71717a" opacity={0.7} /></svg>
    case "blade":
      return <svg width={s} height={s} viewBox="0 0 10 10"><path d="M2 10 Q4 4 9 0 Q6 5 4 10Z" fill={shade(color, 10)} /></svg>
  }
}

interface P { kit: Kit; x: number; y: number; rot: number; size: number; delay: number; dur: number; rise: boolean }

// Floaty kits drift up; heavy kits arc out and fall.
const FLOATS: Kit[] = ["bubble", "spore", "star", "snow", "ash"]

export const StageBurst = memo(function StageBurst({ type, from, to, seed }: { type: string; from: VisualStage; to: VisualStage; seed: number }) {
  const info = TREE_TYPES[type] || TREE_TYPES.tangerine
  const color: string = info.color
  const shape: string = info.shape || "oak"
  const boost = RARITY_BOOST[info.rarity] ?? 1
  const isGem = info.category === "gem"
  const category: string = info.category
  const final = to === 4
  // How dramatic: seed crack < sprout < sapling < young < mature, × rarity.
  const level = Math.max(1, to) * boost * (to - from > 1 ? 1.2 : 1)
  const count = Math.round((to <= 0 ? 6 : 6 + level * 4))

  const parts = useMemo<P[]>(() => {
    const kits: Kit[] = SHAPE_KIT[shape] ?? (category === "flora" ? ["petal", "leaf"] : ["leaf"])
    const r = rng(seed * 7919 + to * 31 + shape.length)
    return Array.from({ length: count }, (_, i) => {
      const kit = kits[i % kits.length]
      const rise = FLOATS.includes(kit)
      const a = (-Math.PI / 2) + (r() - 0.5) * Math.PI * (rise ? 0.9 : 1.5)
      const dist = 30 + r() * (24 + level * 10)
      return {
        kit, rise,
        x: Math.cos(a) * dist,
        y: Math.sin(a) * dist * (rise ? 1.4 : 0.9),
        rot: (r() - 0.5) * 540,
        size: 5 + r() * (4 + level),
        delay: 0.12 + r() * 0.25,
        dur: 1.1 + r() * 0.9 + (final ? 0.5 : 0),
      }
    })
  }, [seed, to, count, level, final, shape, category])

  // Dirt clods kicked up at the base on every transition (bigger for the seed crack).
  const clods = useMemo(() => {
    const r = rng(seed * 104729 + 3)
    const n = to <= 1 ? 7 : 4
    return Array.from({ length: n }, () => ({ x: (r() - 0.5) * 60, y: -8 - r() * 18, s: 2 + r() * 3, d: 0.5 + r() * 0.3 }))
  }, [seed, to])

  const glow = isGem ? shade(color, 70) : shade(color, 40)
  const glowSoft = shade(color, isGem ? 70 : 40, 0.55)
  // Anchor sits on the soil line; height of the plant grows with the stage.
  const plantH = 40 + Math.max(0, to) * 14

  return (
    <div className="absolute left-1/2 pointer-events-none z-30" style={{ bottom: to <= 0 ? 22 : 32, width: 0, height: 0 }}>
      {/* Soil shockwave */}
      <motion.div
        className="absolute rounded-full"
        style={{ left: -40, top: -6, width: 80, height: 12, border: `1.5px solid ${glow}` }}
        initial={{ scale: 0.2, opacity: 0.9 }}
        animate={{ scale: 1.6 + level * 0.15, opacity: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />

      {/* Dirt clods */}
      {clods.map((c, i) => (
        <motion.div key={`c${i}`} className="absolute rounded-full"
          style={{ width: c.s, height: c.s, background: "#5b4630", left: 0, top: 0 }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: c.x, y: [0, c.y, 6], opacity: [1, 1, 0] }}
          transition={{ duration: c.d, ease: "easeOut", times: [0, 0.55, 1] }}
        />
      ))}

      {/* Bloom of light behind the plant */}
      {to >= 1 && (
        <motion.div className="absolute rounded-full"
          style={{ left: -plantH * 0.6, top: -plantH * 1.1, width: plantH * 1.2, height: plantH * 1.2, background: `radial-gradient(circle, ${glowSoft} 0%, transparent 70%)` }}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: [0.3, 1.25, 1], opacity: [0, 1, 0] }}
          transition={{ duration: final ? 1.8 : 1.1, ease: "easeOut" }}
        />
      )}

      {/* God rays for the final stage (and rare+ plants from sapling up) */}
      {(final || (to >= 3 && boost >= 1.3)) && (
        <motion.div className="absolute" style={{ left: 0, top: -plantH * 0.55, width: 0, height: 0 }}
          initial={{ rotate: 0, opacity: 0, scale: 0.4 }}
          animate={{ rotate: 40, opacity: [0, 0.85, 0], scale: [0.4, 1.1, 1.2] }}
          transition={{ duration: 2.2, ease: "easeOut" }}
        >
          {Array.from({ length: final ? 12 : 8 }, (_, i) => (
            <div key={i} className="absolute"
              style={{
                left: -1.5, top: 0, width: 3, height: plantH * 0.75,
                transformOrigin: "50% 0%", transform: `rotate(${(360 / (final ? 12 : 8)) * i}deg)`,
                background: `linear-gradient(${glow}, transparent)`, borderRadius: 2, opacity: 0.55,
              }} />
          ))}
        </motion.div>
      )}

      {/* Rising spiral of motes — the "growth pulse" */}
      {to >= 1 && Array.from({ length: 5 + Math.round(level) }, (_, i) => (
        <motion.div key={`m${i}`} className="absolute rounded-full"
          style={{ width: 3, height: 3, left: -1.5, top: 0, background: glow, boxShadow: `0 0 6px ${glow}` }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{
            x: [0, Math.sin(i * 1.7) * 18, Math.sin(i * 1.7 + 2) * 10],
            y: [0, -plantH * 0.5, -plantH * 1.05],
            opacity: [0, 1, 0],
          }}
          transition={{ duration: 1.2, delay: i * 0.06, ease: "easeOut" }}
        />
      ))}

      {/* Themed particles */}
      {parts.map((p, i) => (
        <motion.div key={i} className="absolute" style={{ left: -p.size / 2, top: -plantH * 0.45 - p.size / 2 }}
          initial={{ x: 0, y: 0, rotate: 0, scale: 0, opacity: 0 }}
          animate={p.rise
            ? { x: [0, p.x * 0.6, p.x], y: [0, p.y * 0.6, p.y - 20], rotate: p.rot, scale: [0, 1.1, 0.7], opacity: [0, 1, 0] }
            : { x: [0, p.x * 0.7, p.x], y: [0, p.y, p.y + 50], rotate: p.rot, scale: [0, 1.2, 0.9], opacity: [0, 1, 0] }}
          transition={{ duration: p.dur, delay: p.delay, ease: p.rise ? "easeOut" : [0.2, 0.7, 0.4, 1] }}
        >
          <Particle kit={p.kit} color={color} size={p.size} />
        </motion.div>
      ))}

      {/* Gem trees: prismatic ring shimmer */}
      {isGem && to >= 2 && (
        <motion.div className="absolute rounded-full"
          style={{ left: -plantH * 0.5, top: -plantH * 0.95, width: plantH, height: plantH, border: `2px solid ${glow}`, boxShadow: `0 0 14px ${glow}, inset 0 0 14px ${glow}` }}
          initial={{ scale: 0.4, opacity: 0, rotate: 0 }}
          animate={{ scale: 1.5, opacity: [0, 0.9, 0], rotate: 90 }}
          transition={{ duration: 1.3, ease: "easeOut", delay: 0.1 }}
        />
      )}
    </div>
  )
})

// Tracks stage changes and returns the active burst (if any) plus a key that
// changes on every new transition, so the plant can replay its entrance.
export function useStageTransition(stage: VisualStage, enabled: boolean) {
  const prev = useRef(stage)
  const [burst, setBurst] = useState<{ from: VisualStage; to: VisualStage; seed: number } | null>(null)
  useEffect(() => {
    const from = prev.current
    prev.current = stage
    // Celebrate forward growth only; resets / backward jumps just swap quietly.
    if (!enabled || stage <= from || stage < 0) return
    setBurst({ from, to: stage, seed: Date.now() & 0xffff })
  }, [stage, enabled])
  useEffect(() => {
    if (!burst) return
    const t = setTimeout(() => setBurst(null), 2600)
    return () => clearTimeout(t)
  }, [burst])
  return burst
}

// Entrance motion for the new plant, by stage reached. Bottom-anchored
// squash-and-stretch that grows bigger and bouncier for later stages.
export function stageEntrance(to: VisualStage) {
  if (to <= 0) return {
    initial: { y: -40, scaleX: 0.6, scaleY: 1.3, opacity: 0 },
    animate: { y: [-40, 0, -6, 0], scaleX: [0.6, 1.25, 0.95, 1], scaleY: [1.3, 0.75, 1.05, 1], opacity: 1 },
    transition: { duration: 0.8, times: [0, 0.5, 0.75, 1], ease: "easeOut" as const },
  }
  const amp = 0.08 + to * 0.03
  return {
    initial: { scaleX: 1 + amp, scaleY: 0.35, opacity: 0.4, filter: "brightness(2.2)" },
    animate: {
      scaleX: [1 + amp, 1 - amp, 1 + amp * 0.5, 1],
      scaleY: [0.35, 1 + amp * 1.6, 1 - amp * 0.4, 1],
      opacity: 1,
      filter: ["brightness(2.2)", "brightness(1.4)", "brightness(1)", "brightness(1)"],
    },
    transition: { duration: 0.75 + to * 0.12, times: [0, 0.45, 0.75, 1], ease: "easeOut" as const },
  }
}

export const stageExit = {
  scale: 0.6, opacity: 0, filter: "blur(4px) brightness(1.8)",
  transition: { duration: 0.35, ease: "easeIn" as const },
}
