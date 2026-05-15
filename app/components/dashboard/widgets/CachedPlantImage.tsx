"use client"
import { memo, useEffect, useRef, useState } from "react"
import { TREE_TYPES } from "@/app/constants"
import { PlantIcon } from "../../PlantIcon"

const cache = new Map<string, string>()
const RENDER_SIZE = 64

function cacheKey(type: string, stage: number) {
  return `${type}-${stage}`
}

function serializeSvg(svg: SVGElement): string {
  const str = new XMLSerializer().serializeToString(svg)
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(str)))}`
}

export function isPlantCached(type: string, stage: number): boolean {
  return cache.has(cacheKey(type, stage))
}

export const CachedPlantImage = memo(function CachedPlantImage({
  type, size, stage,
}: {
  type: string; size: number; stage: number
}) {
  const key = cacheKey(type, stage)
  const [src, setSrc] = useState(() => cache.get(key) || '')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (src) return
    const cached = cache.get(key)
    if (cached) { setSrc(cached); return }
    if (!containerRef.current) return
    const svg = containerRef.current.querySelector('svg')
    if (!svg) return

    const url = serializeSvg(svg)
    cache.set(key, url)
    setSrc(url)
  }, [key, src])

  if (src) {
    return <img src={src} width={size} height={size} alt="" style={{ display: 'block' }} />
  }

  return (
    <div ref={containerRef} style={{ width: RENDER_SIZE, height: RENDER_SIZE, position: 'absolute', left: -9999, top: -9999, pointerEvents: 'none' }}>
      <PlantIcon type={type} size={RENDER_SIZE} stage={stage} hideGround disableSway />
    </div>
  )
})

export const PlantImagePreloader = memo(function PlantImagePreloader() {
  const ref = useRef<HTMLDivElement>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const id = requestIdleCallback(() => {
      if (!ref.current) return
      const svgs = ref.current.querySelectorAll<SVGElement>('[data-plant-key] svg')
      svgs.forEach(svg => {
        const key = svg.parentElement?.getAttribute('data-plant-key')
        if (key && !cache.has(key)) {
          cache.set(key, serializeSvg(svg))
        }
      })
      setDone(true)
    }, { timeout: 5000 })
    return () => cancelIdleCallback(id)
  }, [])

  if (done) return null

  const types = Object.keys(TREE_TYPES)

  return (
    <div ref={ref} style={{ position: 'absolute', left: -9999, top: -9999, width: 1, height: 1, overflow: 'hidden', pointerEvents: 'none' }} aria-hidden>
      {types.map(type => (
        <div key={type} data-plant-key={cacheKey(type, 4)}>
          <PlantIcon type={type} size={RENDER_SIZE} stage={4} hideGround disableSway />
        </div>
      ))}
    </div>
  )
})
