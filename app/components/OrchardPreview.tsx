"use client"

import { memo, useMemo } from "react"
import { PlantIcon } from "./PlantIcon"
import { TREE_TYPES } from "@/app/constants"
import { topicFreshness, freshnessFilter, normalizeTopic } from "@/lib/topics"

export type PreviewTree = {
  type: string; stage?: number; x: number; y: number
  topic?: string; recallNeeded?: number; recallDone?: number
}

/**
 * Static orchard for marketing surfaces (landing belt cards).
 * Reuses the real landing terrain background (`/landing-terrain.png`) plus real
 * <PlantIcon> sprites — the same building blocks as <LandingTerrain>, but with a
 * small, hand-placed tree set so it stays cheap when duplicated across the belt.
 */
export const OrchardPreview = memo(function OrchardPreview({
  trees,
  baseSize = 64,
  scale = 1,
  posX = 50,
  posY = 60,
}: {
  trees: PreviewTree[]
  baseSize?: number
  /** zoom into the terrain for variety between cards */
  scale?: number
  /** background focal point (objectPosition %) */
  posX?: number
  posY?: number
}) {
  // Freshness per topic (reads localStorage) — once per tree set, not per render frame.
  const freshByTopic = useMemo(() => {
    const m: Record<string, number> = {}
    for (const t of trees) {
      if (!t.topic) continue
      const k = normalizeTopic(t.topic)
      if (!(k in m)) m[k] = topicFreshness(t.topic)
    }
    return m
  }, [trees])

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${scale})`, transformOrigin: `${posX}% ${posY}%` }}>
        {/* Plain <img>: decorative background, duplicated across belt cards. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/landing-terrain.png"
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: `${posX}% ${posY}%`,
            pointerEvents: "none",
          }}
        />

        {trees.map((t, i) => {
          // depthT: 0 = far/top (small), 1 = near/bottom (large)
          const depthT = Math.max(0, Math.min(1, (t.y - 50) / 40))
          const depthScale = 0.6 + depthT * 0.55
          const size = Math.round((baseSize * depthScale) / 16) * 16 || 16
          const scaleY = 0.74 + depthT * 0.26
          const base = "brightness(0.82) saturate(0.85)"
          const filter = t.topic ? `${base} ${freshnessFilter(freshByTopic[normalizeTopic(t.topic)] ?? 1)}` : base
          let label: string | undefined
          if (t.topic) {
            label = `${TREE_TYPES[t.type]?.name ?? t.type} · ${t.topic}`
            if (t.recallNeeded != null && (t.recallDone || 0) < t.recallNeeded) label += ` · ${Math.floor(t.recallDone || 0)}/${t.recallNeeded} recalled`
          }
          return (
            <div
              key={i}
              title={label}
              style={{
                position: "absolute",
                left: `${t.x}%`,
                top: `${t.y}%`,
                transform: `translate(-50%, -76%) scaleY(${scaleY})`,
                transformOrigin: "center bottom",
                zIndex: Math.round(t.y),
                filter,
                pointerEvents: label ? "auto" : "none",
              }}
            >
              <PlantIcon type={t.type} size={size} stage={t.stage ?? 3} hideGround />
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: -2,
                  width: size * 0.6,
                  height: size * 0.08,
                  transform: "translateX(-50%)",
                  borderRadius: "50%",
                  background: "radial-gradient(ellipse, rgba(0,0,0,0.13) 0%, transparent 70%)",
                }}
              />
            </div>
          )
        })}
      </div>

      {/* soft inner vignette to match LandingTerrain */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          boxShadow: "inset 18px 0 28px -10px rgba(8,10,8,0.28), inset 0 0 70px rgba(0,0,0,0.12)",
        }}
      />
    </div>
  )
})
