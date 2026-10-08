"use client"
import { useSyncExternalStore } from "react"

// Split-screen / narrow window. Below this, Pulp trims chrome: hides the
// hanging orange, collapses the sidebar, floats panels over the page, etc.
// 1024 (not 900): between ~900 and ~1100 the open sidebar squeezed the page and
// the orange overlapped it, so a slow window drag lingered in a broken-looking band.
export const NARROW_PX = 1024
const QUERY = `(max-width: ${NARROW_PX - 1}px)`

// Settled narrow state. Window width flickers while switching desktops/Spaces
// (and while hidden), which used to reopen the sidebar in split screen; a change
// only counts once it has held for SETTLE_MS while the window is visible.
const SETTLE_MS = 350
let settled: boolean | null = null
const listeners = new Set<() => void>()
let teardown: (() => void) | null = null

function start() {
  const mq = window.matchMedia(QUERY)
  settled = mq.matches
  let timer: ReturnType<typeof setTimeout> | undefined
  const check = () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      if (document.visibilityState !== "visible") return // re-checked when shown
      if (mq.matches === settled) return
      settled = mq.matches
      listeners.forEach(l => l())
    }, SETTLE_MS)
  }
  mq.addEventListener("change", check)
  document.addEventListener("visibilitychange", check)
  teardown = () => { clearTimeout(timer); mq.removeEventListener("change", check); document.removeEventListener("visibilitychange", check) }
}

function subscribe(cb: () => void) {
  if (!teardown) start()
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
    if (!listeners.size && teardown) { teardown(); teardown = null; settled = null }
  }
}

function snapshot(): boolean {
  if (settled === null) settled = window.matchMedia(QUERY).matches
  return settled
}

export function useNarrow(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false)
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
