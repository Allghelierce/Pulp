"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export function useTerrainCache(paletteKey: string) {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const prevKeyRef = useRef("")
  const rasterizing = useRef(false)

  const rasterize = useCallback(() => {
    const svg = svgRef.current
    if (!svg || rasterizing.current) return
    rasterizing.current = true

    const rect = svg.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.round(rect.width * dpr)
    const h = Math.round(rect.height * dpr)

    if (w === 0 || h === 0) {
      rasterizing.current = false
      return
    }

    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink")
    clone.setAttribute("width", String(w))
    clone.setAttribute("height", String(h))
    clone.removeAttribute("class")
    clone.removeAttribute("style")

    clone.querySelectorAll("animateTransform, animate").forEach(el => {
      const parent = el.parentElement
      if (parent) parent.remove()
      else el.remove()
    })

    const serializer = new XMLSerializer()
    let svgString = serializer.serializeToString(clone)

    // Ensure xmlns is present (some browsers strip it)
    if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
      svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
    }

    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h)
        try {
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
          console.log('[TerrainCache] rasterized', w, 'x', h, 'bytes:', dataUrl.length)
          setCachedUrl(dataUrl)
        } catch (e) {
          console.warn('[TerrainCache] tainted canvas', e)
        }
      }
      rasterizing.current = false
      URL.revokeObjectURL(url)
    }
    img.onerror = (e) => {
      console.warn('[TerrainCache] img load failed', e)
      rasterizing.current = false
      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [])

  useEffect(() => {
    if (paletteKey === prevKeyRef.current) return
    prevKeyRef.current = paletteKey
    rasterizing.current = false

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        rasterize()
      })
    })
  }, [paletteKey, rasterize])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    let debounce: ReturnType<typeof setTimeout>
    const ro = new ResizeObserver(() => {
      clearTimeout(debounce)
      debounce = setTimeout(() => {
        rasterizing.current = false
        rasterize()
      }, 200)
    })
    ro.observe(svg)
    return () => { ro.disconnect(); clearTimeout(debounce) }
  }, [rasterize])

  return { svgRef, cachedUrl }
}
