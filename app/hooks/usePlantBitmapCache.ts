"use client"

const MAX_CACHE = 200
const cache = new Map<string, { dataUrl: string; w: number; h: number; lastUsed: number }>()
// Half-resolution opacity masks, so the grove can hover-test the drawn tree
// rather than its (mostly transparent) image box.
const masks = new Map<string, { alpha: Uint8Array; mw: number; mh: number }>()
const pending = new Set<string>()
const listeners = new Set<() => void>()

function evictOldest() {
  if (cache.size <= MAX_CACHE) return
  let oldestKey = ""
  let oldestTime = Infinity
  for (const [k, v] of cache) {
    if (v.lastUsed < oldestTime) { oldestTime = v.lastUsed; oldestKey = k }
  }
  if (oldestKey) { cache.delete(oldestKey); masks.delete(oldestKey) }
}

function notifyListeners() {
  for (const fn of listeners) fn()
}

export function getCacheKey(type: string, size: number, stage: number, isDark: boolean): string {
  return `${type}:${size}:${stage}:${isDark ? 1 : 0}`
}

export function getPlantBitmap(key: string): { dataUrl: string; w: number; h: number } | null {
  const entry = cache.get(key)
  if (!entry) return null
  entry.lastUsed = Date.now()
  return entry
}

/** Opacity (0-255) of the drawn plant at a fraction (u, v ∈ 0..1) of its image box; null if not cached. */
export function getPlantAlphaAt(key: string, u: number, v: number, spread = 1): number | null {
  const m = masks.get(key)
  if (!m) return null
  const cx = Math.floor(u * m.mw), cy = Math.floor(v * m.mh)
  let best = 0
  for (let dy = -spread; dy <= spread; dy++) for (let dx = -spread; dx <= spread; dx++) {
    const x = cx + dx, y = cy + dy
    if (x < 0 || y < 0 || x >= m.mw || y >= m.mh) continue
    const a = m.alpha[y * m.mw + x]
    if (a > best) best = a
  }
  return best
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

  const clone = svgElement.cloneNode(true) as SVGSVGElement
  clone.setAttribute("width", String(width))
  clone.setAttribute("height", String(height))

  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(clone)
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
      try {
        const data = ctx.getImageData(0, 0, cw, ch).data
        const mw = Math.ceil(cw / 2), mh = Math.ceil(ch / 2)
        const alpha = new Uint8Array(mw * mh)
        for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) alpha[y * mw + x] = data[((y * 2) * cw + x * 2) * 4 + 3]
        masks.set(key, { alpha, mw, mh })
      } catch { /* tainted canvas: hover falls back to an ellipse */ }
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
