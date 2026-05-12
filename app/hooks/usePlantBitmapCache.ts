"use client"

const MAX_CACHE = 200
const cache = new Map<string, { dataUrl: string; w: number; h: number; lastUsed: number }>()
const pending = new Set<string>()
const listeners = new Set<() => void>()

function evictOldest() {
  if (cache.size <= MAX_CACHE) return
  let oldestKey = ""
  let oldestTime = Infinity
  for (const [k, v] of cache) {
    if (v.lastUsed < oldestTime) { oldestTime = v.lastUsed; oldestKey = k }
  }
  if (oldestKey) cache.delete(oldestKey)
}

function notifyListeners() {
  for (const fn of listeners) fn()
}

export function getCacheKey(type: string, size: number, stage: number, dirtSeed: number, dirtDark: boolean, dirtDepth: number, dirtTilt: number): string {
  return `${type}:${size}:${stage}:${dirtSeed}:${dirtDark ? 1 : 0}:${dirtDepth.toFixed(2)}:${dirtTilt.toFixed(1)}`
}

export function getPlantBitmap(key: string): { dataUrl: string; w: number; h: number } | null {
  const entry = cache.get(key)
  if (!entry) return null
  entry.lastUsed = Date.now()
  return entry
}

export function isRasterizing(key: string): boolean {
  return pending.has(key)
}

export function rasterizePlantSvg(
  key: string,
  svgElement: SVGSVGElement,
  width: number,
  height: number,
) {
  if (cache.has(key) || pending.has(key)) return
  pending.add(key)

  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(svgElement)
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const cw = Math.round(width * dpr)
  const ch = Math.round(height * dpr)

  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement("canvas")
    canvas.width = cw
    canvas.height = ch
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(img, 0, 0, cw, ch)
      const dataUrl = canvas.toDataURL("image/png")
      cache.set(key, { dataUrl, w: width, h: height, lastUsed: Date.now() })
      evictOldest()
      notifyListeners()
    }
    pending.delete(key)
    URL.revokeObjectURL(url)
  }
  img.onerror = () => {
    pending.delete(key)
    URL.revokeObjectURL(url)
  }
  img.src = url
}

export function subscribeBitmapCache(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
