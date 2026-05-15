"use client"
import { memo, useEffect, useRef, useState } from "react"
import { TREE_TYPES } from "@/app/constants"
import { PlantIcon } from "../../PlantIcon"

const cache = new Map<string, string>()
let preloadDone = false
const listeners = new Set<() => void>()

const RENDER_SIZE = 64

function cacheKey(type: string, stage: number) {
  return `${type}-${stage}`
}

function serializeSvg(svg: SVGElement): string {
  const str = new XMLSerializer().serializeToString(svg)
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(str)))}`
}

function notifyListeners() {
  listeners.forEach(fn => fn())
}

export const CachedPlantImage = memo(function CachedPlantImage({
  type, size, stage,
}: {
  type: string; size: number; stage: number
}) {
  const key = cacheKey(type, stage)
  const [src, setSrc] = useState(() => cache.get(key) || '')

  useEffect(() => {
    if (src) return
    const cached = cache.get(key)
    if (cached) { setSrc(cached); return }
    const listener = () => {
      const url = cache.get(key)
      if (url) { setSrc(url); listeners.delete(listener) }
    }
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [key, src])

  if (src) {
    return <img src={src} width={size} height={size} alt="" style={{ display: 'block' }} />
  }

  const color = TREE_TYPES[type]?.color || '#888'
  return (
    <svg width={size} height={size} viewBox="0 0 38 38">
      <circle cx={19} cy={22} r={8} fill={color} opacity={0.3} />
    </svg>
  )
})

export const PlantImagePreloader = memo(function PlantImagePreloader() {
  const ref = useRef<HTMLDivElement>(null)
  const [batch, setBatch] = useState(0)
  const [done, setDone] = useState(preloadDone)

  const types = Object.keys(TREE_TYPES)
  const BATCH_SIZE = 8

  useEffect(() => {
    if (done) return
    const start = batch * BATCH_SIZE
    if (start >= types.length) {
      preloadDone = true
      setDone(true)
      notifyListeners()
      return
    }

    const id = requestAnimationFrame(() => {
      if (!ref.current) return
      const svgs = ref.current.querySelectorAll<SVGElement>('[data-plant-key] svg')
      svgs.forEach(svg => {
        const key = svg.parentElement?.getAttribute('data-plant-key')
        if (key && !cache.has(key)) {
          cache.set(key, serializeSvg(svg))
        }
      })
      notifyListeners()
      setBatch(b => b + 1)
    })
    return () => cancelAnimationFrame(id)
  }, [batch, done, types.length])

  if (done) return null

  const start = batch * BATCH_SIZE
  const slice = types.slice(start, start + BATCH_SIZE)

  return (
    <div ref={ref} style={{ position: 'absolute', left: -9999, top: -9999, width: 1, height: 1, overflow: 'hidden', pointerEvents: 'none' }} aria-hidden>
      {slice.map(type => (
        <div key={type} data-plant-key={cacheKey(type, 4)}>
          <PlantIcon type={type} size={RENDER_SIZE} stage={4} hideGround disableSway />
        </div>
      ))}
    </div>
  )
})
