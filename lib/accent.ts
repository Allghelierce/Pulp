// The user's accent color (Settings → Personalization). Pulp orange (#d97706) is the
// default AND the brand color: the mascot, sap, logo and orchard art stay orange no
// matter what. Interactive UI — primary buttons, selected states, progress, focus
// rings, recall chips — follows the user's accent.
//
// Two ways to use it:
//  - Components that receive an `accent` prop get a hex from accentForTheme() (still a
//    plain #rrggbb, so `${accent}14`-style alpha suffixes keep working).
//  - Everything else uses the CSS variables set on <html>: ACCENT / accentAlpha() /
//    ACCENT_CONTRAST below (or Tailwind arbitrary values like bg-[var(--accent)]).

import type { CSSProperties } from "react"

export const BRAND_ORANGE = "#d97706"

/** CSS value for the accent color. Use in inline styles / SVG style props (not canvas). */
export const ACCENT = "var(--accent)"
/** Text/icon color that reads well ON the accent (white or near-black). */
export const ACCENT_CONTRAST = "var(--accent-contrast)"
/** A slightly stronger accent for hover/pressed. */
export const ACCENT_STRONG = "var(--accent-strong)"
/** Accent at an opacity, e.g. accentAlpha(0.12) for tinted backgrounds/borders. */
export const accentAlpha = (a: number) => `rgb(var(--accent-rgb) / ${a})`
/**
 * Spread into the style of a surface that is dark in BOTH themes (sidebar, orchard glass
 * bar, mascot bubbles): re-points the accent variables at the dark-theme accent so
 * ACCENT / accentAlpha() / Tailwind var(--accent) inside it stay visible in light theme.
 */
export const ACCENT_DARK_SURFACE = {
  "--accent": "var(--accent-dark)",
  "--accent-rgb": "var(--accent-dark-rgb)",
  "--accent-contrast": "var(--accent-dark-contrast)",
  "--accent-strong": "var(--accent-dark-strong)",
} as CSSProperties

type RGB = [number, number, number]

function parseHex(hex: string): RGB | null {
  const m = /^#?([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const toHex = ([r, g, b]: RGB) => "#" + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")

function luminance([r, g, b]: RGB): number {
  const lin = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}
function contrast(a: RGB, b: RGB): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

const BG: Record<"light" | "dark", RGB> = { dark: [9, 9, 11], light: [245, 243, 239] }
// Minimum contrast vs the page. Pulp orange (6.2 dark / 2.87 light) stays exact on both;
// dark picks (Obsidian) get lifted enough on dark to read as a highlight, not a disabled grey,
// and light picks (Cyan, Green) get darkened on light until they read like orange does.
const MIN_CONTRAST: Record<"light" | "dark", number> = { dark: 4, light: 2.8 }

/**
 * The accent adjusted to stay visible on the current theme: very dark picks (Obsidian)
 * get lightened on dark backgrounds, very light ones darkened on light backgrounds.
 * Pulp orange already passes on both and is returned unchanged.
 */
export function accentForTheme(hex: string, theme: "light" | "dark"): string {
  const rgb = parseHex(hex) ?? parseHex(BRAND_ORANGE)!
  const bg = BG[theme]
  const min = MIN_CONTRAST[theme]
  if (contrast(rgb, bg) >= min) return toHex(rgb)
  const toward: RGB = theme === "dark" ? [255, 255, 255] : [0, 0, 0]
  for (let t = 0.05; t <= 1; t += 0.05) {
    const c = mix(rgb, toward, t)
    if (contrast(c, bg) >= min) return toHex(c)
  }
  return toHex(toward)
}

/** Text on the accent: white (Pulp's style; orange is 3.2:1) unless the color is too light for it. */
export function readableOn(hex: string): string {
  const rgb = parseHex(hex) ?? parseHex(BRAND_ORANGE)!
  return contrast(rgb, [255, 255, 255]) >= 3 ? "#ffffff" : "#111111"
}

function themeVars(hex: string, theme: "light" | "dark", prefix: string): Record<string, string> {
  const ui = accentForTheme(hex, theme)
  const rgb = parseHex(ui)!
  const strong = toHex(mix(rgb, theme === "dark" ? [255, 255, 255] : [0, 0, 0], 0.15))
  return {
    [prefix]: ui,
    [`${prefix}-rgb`]: rgb.map(Math.round).join(" "),
    [`${prefix}-contrast`]: readableOn(ui),
    [`${prefix}-strong`]: strong,
  }
}

/**
 * CSS custom properties for <html>: --accent, --accent-rgb, --accent-contrast, --accent-strong,
 * plus --accent-dark(-rgb/-contrast/-strong) for always-dark surfaces (see ACCENT_DARK_SURFACE).
 */
export function accentCssVars(hex: string, theme: "light" | "dark"): Record<string, string> {
  return { ...themeVars(hex, theme, "--accent"), ...themeVars(hex, "dark", "--accent-dark") }
}
