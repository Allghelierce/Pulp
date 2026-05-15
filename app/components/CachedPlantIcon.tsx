"use client"
import { memo, useRef, useEffect, useState, useCallback } from "react"
import { PlantIcon, ANIMATED_SHAPES } from "./PlantIcon"
import { TREE_TYPES } from "@/app/constants"
import {
  getCacheKey, getPlantBitmap, isRasterizing,
  rasterizePlantSvg, subscribeBitmapCache,
} from "@/app/hooks/usePlantBitmapCache"

export const CachedPlantIcon = memo(function CachedPlantIcon({
  type, size = 40, stage = 0, hideGround = false,
  dirtSeed = 0, dirtDark = false, dirtDepth = 0.5, dirtTilt = 0,
}: {
  type: string; size?: number; stage?: number; hideGround?: boolean
  dirtSeed?: number; dirtDark?: boolean; dirtDepth?: number; dirtTilt?: number
}) {
  const shape = (TREE_TYPES[type] || TREE_TYPES.tangerine).shape || "oak"
  const isAnimated = ANIMATED_SHAPES.has(shape)

  const key = getCacheKey(type, size, stage, dirtDark)
  const cached = getPlantBitmap(key)

  const [, rerender] = useState(0)
  const svgRef = useRef<HTMLDivElement>(null)
  const rasterized = useRef(false)

  useEffect(() => {
    if (isAnimated || cached || rasterized.current) return
    return subscribeBitmapCache(() => {
      if (getPlantBitmap(key)) rerender(c => c + 1)
    })
  }, [key, isAnimated, cached])

  const handleRef = useCallback((el: HTMLDivElement | null) => {
    (svgRef as React.MutableRefObject<HTMLDivElement | null>).current = el
    if (!el || isAnimated || rasterized.current || isRasterizing(key)) return
    const svg = el.querySelector("svg")
    if (!svg) return
    rasterized.current = true
    const w = size
    const h = Math.round(size * 1.3)
    requestAnimationFrame(() => {
      rasterizePlantSvg(key, svg, w, h)
    })
  }, [key, size, isAnimated])

  useEffect(() => {
    rasterized.current = false
    if (isAnimated || getPlantBitmap(key) || isRasterizing(key)) return
    const el = svgRef.current
    if (!el) return
    const svg = el.querySelector("svg")
    if (!svg) return
    rasterized.current = true
    requestAnimationFrame(() => {
      rasterizePlantSvg(key, svg, size, Math.round(size * 1.3))
    })
  }, [key, size, isAnimated])

  const typeInfo = TREE_TYPES[type] || TREE_TYPES.tangerine
  const swayHash = (type.charCodeAt(0) + (type.charCodeAt(1) || 0)) % 10
  const swayDuration = stage >= 4 ? 8 + (swayHash % 3) : stage >= 3 ? 6 + (swayHash % 3) : 4 + (swayHash % 2)
  const swayDelay = -(swayHash * 0.7)
  const swayDeg = stage >= 4 ? 0.6 : stage >= 3 ? 1.0 : stage >= 2 ? 1.5 : 2.0

  if (isAnimated) {
    return <PlantIcon type={type} size={size} stage={stage} hideGround={hideGround} dirtSeed={dirtSeed} dirtDark={dirtDark} dirtDepth={dirtDepth} dirtTilt={dirtTilt} />
  }

  if (cached) {
    return (
      <div style={{
        width: size,
        height: Math.round(size * 1.3),
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        transformOrigin: "center bottom",
        "--sway-deg": `${swayDeg}deg`,
        animation: `plantSway ${swayDuration}s ease-in-out ${swayDelay}s infinite`,
      } as React.CSSProperties}>
        <img
          src={cached.dataUrl}
          width={cached.w}
          height={cached.h}
          alt=""
          draggable={false}
          style={{ pointerEvents: "none", display: "block" }}
        />
      </div>
    )
  }

  return (
    <div ref={handleRef}>
      <PlantIcon type={type} size={size} stage={stage} hideGround={hideGround} dirtSeed={dirtSeed} dirtDark={dirtDark} dirtDepth={dirtDepth} dirtTilt={dirtTilt} disableSway />
    </div>
  )
})
