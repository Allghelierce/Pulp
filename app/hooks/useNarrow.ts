"use client"
import { useSyncExternalStore } from "react"

// Split-screen / narrow window. Below this, Pulp trims chrome: hides the
// hanging orange, collapses the sidebar, floats panels over the page, etc.
// 1024 (not 900): between ~900 and ~1100 the open sidebar squeezed the page and
// the orange overlapped it, so a slow window drag lingered in a broken-looking band.
export const NARROW_PX = 1024
const QUERY = `(max-width: ${NARROW_PX - 1}px)`

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

export function useNarrow(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false)
}

function subscribeResize(cb: () => void) {
  window.addEventListener("resize", cb)
  return () => window.removeEventListener("resize", cb)
}

// Live window width (for scaling wide scenes like the market card fan).
export function useWindowWidth(): number {
  return useSyncExternalStore(subscribeResize, () => window.innerWidth, () => 1440)
}

// True while the window is at least `px` wide. Re-renders only when that flips, not per resize event.
export function useWiderThan(px: number): boolean {
  return useSyncExternalStore(subscribeResize, () => window.innerWidth >= px, () => true)
}
