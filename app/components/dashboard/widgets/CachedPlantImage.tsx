"use client"
import { memo, useEffect, useRef, useState } from "react"
import { TREE_TYPES } from "@/app/constants"
import { PlantIcon } from "../../PlantIcon"

const cache = new Map<string, string>()

function serializeSvg(svg: SVGElement): string {
  const str = new XMLSerializer().serializeToString(svg)
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(str)))}`
}

export const CachedPlantImage = memo(function CachedPlantImage({
  type, size, stage,
}: {
  type: string; size: number; stage: number
}) {
  const key = `${type}-${stage}`
  const ref = useRef<HTMLDivElement>(null)
  const [src, setSrc] = useState(() => cache.get(key) || '')

  useEffect(() => {
    if (src) return
    const cached = cache.get(key)
    if (cached) { setSrc(cached); return }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const svg = ref.current?.querySelector('svg')
        if (!svg) return
        const url = serializeSvg(svg)
        cache.set(key, url)
        setSrc(url)
      })
    })
    return () => cancelAnimationFrame(id)
  }, [key, src])

  if (src) {
    return <img src={src} width={size} height={size} alt="" style={{ display: 'block' }} />
  }

  return (
    <div ref={ref} style={{ width: size, height: size }}>
      <PlantIcon type={type} size={size} stage={stage} hideGround disableSway />
    </div>
  )
})

export const PlantImagePreloader = memo(function PlantImagePreloader() {
  return null
})
