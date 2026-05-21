"use client"
import { useState, useRef, useEffect, memo, useCallback, useMemo, lazy, Suspense, startTransition } from "react"
import { LazyMotion, domAnimation, m, motion } from "framer-motion"
import { flushSync } from "react-dom"
import { supabase } from "@/lib/supabase"
import { apiFetch } from "@/lib/apiFetch"
import { sanitizeHTML } from "@/lib/sanitize"
import * as db from "@/lib/db"
import type { TextBox as TextBoxType, NoteData, FolderData, DialogConfig, Bookmark, Achievement, Tree, SlashMenuState, User } from "@/app/types"
import { TREE_TYPES } from "@/app/constants"
import { useGroveStore, selectGroveData } from "@/app/store/useGroveStore"
import { uid } from "@/app/lib/uid"
import { getPaperBg, getInkColor, isDarkPaper, type PaperStyle } from "@/app/lib/paperStyle"
import { useEditor } from "@/app/hooks/useEditor"
import { useBoxDrawing } from "@/app/hooks/useBoxDrawing"
import { useDrawing } from "@/app/hooks/useDrawing"
import { useVersionHistory } from "@/app/hooks/useVersionHistory"
import { useNotesStore } from "@/app/store/useNotesStore"
import { AppDialog } from "@/app/components/AppDialog"
import { Sidebar } from "@/app/components/Sidebar"
import { DocumentToolbar } from "@/app/components/DocumentToolbar"
import { HangingOrange } from "@/app/components/HangingOrange"
import { OrangeAIHub } from "@/app/components/OrangeAIHub"
const _preloadShelf = () => import("@/app/components/ShelfView")
import { ImageUploadModal } from "@/app/components/ImageUploadModal"
const _preloadImageUpload = () => import("@/app/components/ImageUploadModal")
const _preloadCover = () => import("@/app/components/CoverModal")
import { SlashMenu } from "@/app/components/SlashMenu"
import { VitalitySystem } from "@/app/components/VitalitySystem"
import { PulpLoadingScreen } from "@/app/components/PulpLoadingScreen"
import { PlantImagePreloader } from "@/app/components/dashboard/widgets/CachedPlantImage"
const _preloadOrchard = () => import("@/app/components/OrchardView")
const _preloadBoutique = () => import("@/app/components/BoutiqueView")
const _preloadStats = () => import("@/app/components/StatsView")
const _preloadDashboard = () => import("@/app/components/DashboardView")
const _preloadLeaderboard = () => import("@/app/components/LeaderboardView")

const _preloadSettings = () => import("@/app/components/settings/SettingsView")
const _preloadAiCmd = () => import("@/app/components/AiCommandBar")
const _preloadChat = () => import("@/app/components/NotebookChat")
const _preloadVersionHistory = () => import("@/app/components/VersionHistoryPanel")
const _preloadGrid = () => import("@/app/components/GridView")
const _preloadAiInline = () => import("@/app/components/AiInlineMenu")
const _preloadAiResult = () => import("@/app/components/AiResultModal")

const OrchardView = lazy(() => _preloadOrchard().then(m => ({ default: m.OrchardView })))
const BoutiqueView = lazy(() => _preloadBoutique().then(m => ({ default: m.BoutiqueView })))
const StatsView = lazy(() => _preloadStats().then(m => ({ default: m.StatsView })))
const DashboardView = lazy(() => _preloadDashboard().then(m => ({ default: m.DashboardView })))
const LeaderboardView = lazy(() => _preloadLeaderboard().then(m => ({ default: m.LeaderboardView })))

const SettingsView = lazy(() => _preloadSettings().then(m => ({ default: m.SettingsView })))
const AiCommandBar = lazy(() => _preloadAiCmd().then(m => ({ default: m.AiCommandBar })))
const NotebookChat = lazy(() => _preloadChat().then(m => ({ default: m.NotebookChat })))
const VersionHistoryPanel = lazy(() => _preloadVersionHistory().then(m => ({ default: m.VersionHistoryPanel })))
const GridView = lazy(() => _preloadGrid().then(m => ({ default: m.GridView })))
const AiInlineMenu = lazy(() => _preloadAiInline().then(m => ({ default: m.AiInlineMenu })))
const AiResultModal = lazy(() => _preloadAiResult().then(m => ({ default: m.AiResultModal })))
const ShelfView = lazy(() => _preloadShelf().then(m => ({ default: m.ShelfView })))
const CoverModal = lazy(() => _preloadCover().then(m => ({ default: m.CoverModal })))
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { AnimatedCreateButton } from "@/app/components/AnimatedCreateButton"

function PageNumberInput({ currentPageIdx, totalPages, onOpenGrid }: {
  currentPageIdx: number; totalPages: number; theme?: "light" | "dark"; onOpenGrid: () => void
}) {
  const color = "#3f3f46"
  const fontStyle: React.CSSProperties = { color, fontFamily: 'Crimson Pro, serif', fontWeight: 400, fontSize: 15, letterSpacing: '0.01em' }

  return (
    <div
      className="px-1 cursor-pointer select-none hover:bg-black/5 rounded transition-colors"
      title="Open page grid"
      style={{ ...fontStyle }}
      onClick={onOpenGrid}
    >
      <AnimatedCounter value={currentPageIdx + 1} />
    </div>
  )
}

const noop = () => { }

// ─── Memoized global styles — prevents font flickering on every NoteApp re-render
const GlobalStyles = memo(function GlobalStyles({ reduceMotion, reduceVisuals, theme, handwrittenEffect }: { reduceMotion: boolean, reduceVisuals: boolean, theme: "light" | "dark", handwrittenEffect: boolean }) {
  useEffect(() => {
    if (reduceMotion) document.documentElement.setAttribute('data-reduce-motion', 'true')
    else document.documentElement.removeAttribute('data-reduce-motion')
  }, [reduceMotion])
  return (<>
    <style dangerouslySetInnerHTML={{
      __html: `${reduceMotion ? "*, *::before, *::after { transition: none !important; animation: none !important; } .anim-slide-up, .anim-fade-in { opacity: 1 !important; transform: none !important; filter: none !important; }" : ""}${reduceVisuals ? " .animate-pulse, .pulp-pulse, [class*='animate-'] { animation: none !important; } .neon-checkbox__effects, .bg-effect, .smear-effect, [class*='effect'] { filter: none !important; box-shadow: none !important; }" : ""} .ls-toolbar { font-family: 'Inter', system-ui, -apple-system, sans-serif !important; letter-spacing: -0.01em; } @keyframes slide-up-fade { 0% { opacity: 0; transform: translateY(12px); filter: blur(2px); } 100% { opacity: 1; transform: translateY(0); filter: blur(0); } } @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } } @keyframes leaf-sway { 0% { transform: rotate(-2.2deg) translateX(-0.8px); } 25% { transform: rotate(-0.8deg) translateX(-0.3px); } 50% { transform: rotate(2.2deg) translateX(0.8px); } 75% { transform: rotate(0.8deg) translateX(0.3px); } 100% { transform: rotate(-2.2deg) translateX(-0.8px); } } @keyframes bulb-pull { 0% { transform: translateY(0); } 30% { transform: translateY(15px); } 65% { transform: translateY(-4px); } 100% { transform: translateY(0); } } @keyframes orange-bounce { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-20px) scale(1.05); } } @keyframes orange-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .anim-slide-up { opacity: 0; animation: slide-up-fade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; } .anim-fade-in { opacity: 0; animation: fade-in 0.4s ease-out forwards; }                              @keyframes erase-smudge {
                               0% { opacity: 0.55; transform: scaleX(1) scaleY(1); filter: blur(0px); }
                               25% { opacity: 0.4; transform: scaleX(1.3) scaleY(0.7); filter: blur(1px); }
                               50% { opacity: 0.2; transform: scaleX(1.8) scaleY(0.4); filter: blur(2.5px); }
                               100% { opacity: 0; transform: scaleX(2.5) scaleY(0.15); filter: blur(4px); }
                             }
                             .erased {
                               display: block;
                               animation: erase-smudge 0.35s forwards cubic-bezier(0.2, 0, 0.4, 1);
                               pointer-events: none;
                               user-select: none;
                               white-space: pre;
                               margin: 0 !important;
                               padding: 0 !important;
                               text-align: left;
                               transform-origin: left center;
                               justify-content: center;
                             } [contenteditable] { outline: none !important; cursor: url('/pencil.png'), text; user-select: text; -webkit-user-select: text; } input, textarea { user-select: text; -webkit-user-select: text; } [data-box-style="margin"], [data-box-style="margin"] * { color: rgba(0,0,0,0.32) !important; }` }} />
    {theme === "dark" && <style dangerouslySetInnerHTML={{ __html: `.ls-toolbar { background-color: rgba(18,18,20,0.85) !important; border-color: rgba(255,255,255,0.08) !important; box-shadow: 0 4px 32px rgba(0,0,0,0.5) !important; backdrop-filter: blur(16px) !important; -webkit-backdrop-filter: blur(16px) !important; } .ls-toolbar .hover\\:bg-zinc-200, .ls-toolbar .hover\\:bg-zinc-100 { color: #A1A1AA !important; background-color: transparent !important; border-color: transparent !important; box-shadow: none !important; } .ls-toolbar .hover\\:bg-zinc-200:hover, .ls-toolbar .hover\\:bg-zinc-100:hover { background-color: rgba(255,255,255,0.08) !important; color: #FAFAFA !important; } .ls-toolbar select, .ls-toolbar input { background-color: rgba(255,255,255,0.05) !important; color: #FAFAFA !important; border-color: rgba(255,255,255,0.08) !important; } .ls-toolbar .text-zinc-600 { color: #A1A1AA !important; } .ls-toolbar .border-zinc-200, .ls-toolbar .border-zinc-200\\/80 { border-color: rgba(255,255,255,0.08) !important; } .ls-toolbar .bg-white, .ls-toolbar .bg-zinc-50 { background-color: transparent !important; }` }} />}
    <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
      <filter id="handwritten-jitter" colorInterpolationFilters="sRGB" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035 0.025" numOctaves="2" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="handwritten-jitter-subtle" colorInterpolationFilters="sRGB" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04 0.025" numOctaves="2" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.0" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="pen-ink" colorInterpolationFilters="sRGB" x="-3%" y="-3%" width="106%" height="106%">
        <feTurbulence type="fractalNoise" baseFrequency="0.03 0.05" numOctaves="2" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4" xChannelSelector="R" yChannelSelector="G" result="wobble" />
        <feGaussianBlur in="wobble" stdDeviation="0.1" result="blur" />
        <feComponentTransfer in="blur">
          <feFuncA type="gamma" amplitude="1.05" exponent="1.1" />
        </feComponentTransfer>
      </filter>
      <filter id="hand-rule" colorInterpolationFilters="sRGB" x="-2%" y="-30%" width="104%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency="0.015 0.08" numOctaves="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="hand-rule-v" colorInterpolationFilters="sRGB" x="-30%" y="-2%" width="160%" height="104%">
        <feTurbulence type="fractalNoise" baseFrequency="0.08 0.015" numOctaves="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  </>)
})

function htmlToPlain(html: string): string {
  return html.replace(/<br\s*\/?>\n/gi, "\n").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")
}

const MarginEngravings = memo(function MarginEngravings({ theme }: { theme: "light" | "dark" }) {
  const dk = theme === "dark"
  const color = dk ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.055)"
  const style: React.CSSProperties = { position: "sticky", top: 120, pointerEvents: "none", flexShrink: 0, width: 0, overflow: "visible", zIndex: 0 }
  return (<>
    {/* Left gutter */}
    <div style={{ ...style, order: -1 }}>
      <svg width="120" height="280" viewBox="0 0 120 280" fill="none" style={{ position: "absolute", right: 20, top: 0 }}>
        {/* Fern frond */}
        <path d="M60 280 C60 280 60 20 60 10" stroke={color} strokeWidth="1.2" />
        <path d="M60 240 C40 230 25 215 20 195" stroke={color} strokeWidth="0.8" fill="none" />
        <path d="M60 240 C80 230 95 215 100 195" stroke={color} strokeWidth="0.8" fill="none" />
        <path d="M60 200 C38 188 22 170 18 148" stroke={color} strokeWidth="0.8" fill="none" />
        <path d="M60 200 C82 188 98 170 102 148" stroke={color} strokeWidth="0.8" fill="none" />
        <path d="M60 160 C42 150 30 135 28 118" stroke={color} strokeWidth="0.8" fill="none" />
        <path d="M60 160 C78 150 90 135 92 118" stroke={color} strokeWidth="0.8" fill="none" />
        <path d="M60 125 C46 116 38 104 36 90" stroke={color} strokeWidth="0.7" fill="none" />
        <path d="M60 125 C74 116 82 104 84 90" stroke={color} strokeWidth="0.7" fill="none" />
        <path d="M60 95 C50 88 44 78 43 66" stroke={color} strokeWidth="0.6" fill="none" />
        <path d="M60 95 C70 88 76 78 77 66" stroke={color} strokeWidth="0.6" fill="none" />
        <path d="M60 68 C54 62 50 54 50 44" stroke={color} strokeWidth="0.5" fill="none" />
        <path d="M60 68 C66 62 70 54 70 44" stroke={color} strokeWidth="0.5" fill="none" />
        {/* Small leaf veins */}
        <path d="M38 218 C32 210 28 202 25 195" stroke={color} strokeWidth="0.4" fill="none" />
        <path d="M82 218 C88 210 92 202 95 195" stroke={color} strokeWidth="0.4" fill="none" />
        <path d="M40 175 C34 166 30 157 27 148" stroke={color} strokeWidth="0.4" fill="none" />
        <path d="M80 175 C86 166 90 157 93 148" stroke={color} strokeWidth="0.4" fill="none" />
      </svg>
    </div>
    {/* Right gutter */}
    <div style={style}>
      <svg width="100" height="200" viewBox="0 0 100 200" fill="none" style={{ position: "absolute", left: 20, top: 60 }}>
        {/* Wildflower stem cluster */}
        <path d="M50 200 C48 160 44 120 42 80 C40 50 46 30 50 10" stroke={color} strokeWidth="1" />
        <path d="M50 200 C54 165 60 130 65 100 C70 75 68 45 62 20" stroke={color} strokeWidth="0.8" />
        <path d="M50 200 C44 170 36 140 30 110 C25 85 30 55 38 25" stroke={color} strokeWidth="0.8" />
        {/* Flower heads */}
        <circle cx="50" cy="10" r="5" stroke={color} strokeWidth="0.7" fill="none" />
        <circle cx="50" cy="10" r="2" stroke={color} strokeWidth="0.5" fill="none" />
        <circle cx="62" cy="20" r="4" stroke={color} strokeWidth="0.7" fill="none" />
        <circle cx="62" cy="20" r="1.5" stroke={color} strokeWidth="0.5" fill="none" />
        <circle cx="38" cy="25" r="4.5" stroke={color} strokeWidth="0.7" fill="none" />
        <circle cx="38" cy="25" r="1.8" stroke={color} strokeWidth="0.5" fill="none" />
        {/* Leaves on stems */}
        <path d="M44 100 C36 95 30 100 34 108" stroke={color} strokeWidth="0.6" fill="none" />
        <path d="M56 130 C64 126 68 132 62 138" stroke={color} strokeWidth="0.6" fill="none" />
        <path d="M46 150 C38 146 34 152 40 158" stroke={color} strokeWidth="0.6" fill="none" />
      </svg>
    </div>
  </>)
})

// ─── Memoized spiral binding — NEVER re-renders during box operations ──────────
const SpiralBinding = memo(function SpiralBinding({ theme, showBinding, bindingCompact, paperBg }: {
  theme: "light" | "dark"; showBinding: boolean; bindingCompact: boolean; paperBg: string
}) {
  if (!showBinding) return null
  const isDark = theme === "dark"
  const wire = isDark ? '#888' : '#D4AF37'
  const wireHi = isDark ? '#aaa' : '#FFF3A3'
  const wireShadow = isDark ? '#555' : '#8B6914'

  if (!bindingCompact) return (
    <div className="absolute left-[-20px] top-0 bottom-0 w-[44px] z-30 pointer-events-none" style={{ overflow: 'visible' }}>
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="wire-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={wireShadow} />
            <stop offset="50%" stopColor={wire} />
            <stop offset="100%" stopColor={wireShadow} />
          </linearGradient>
          <linearGradient id="wire-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={wire} />
            <stop offset="30%" stopColor={wireHi} />
            <stop offset="60%" stopColor={wire} />
            <stop offset="100%" stopColor={wireShadow} />
          </linearGradient>
        </defs>
        {Array.from({ length: 36 }).map((_, i) => {
          const cy = 28 + i * 30
          const holeX = 30
          const holeW = 12
          const holeH = 10
          const ringX = 20
          const ringRx = 18
          const ringRy = 7
          return (
            <g key={i}>
              {/* Back half — loops left behind paper */}
              <path d={`M ${ringX},${cy - ringRy} A ${ringRx},${ringRy} 0 0,0 ${ringX},${cy + ringRy}`} fill="none" stroke="url(#wire-back)" strokeWidth="3" />
              <path d={`M ${ringX + 1},${cy - ringRy + 1} A ${ringRx - 1},${ringRy - 1} 0 0,0 ${ringX + 1},${cy + ringRy + 1}`} fill="none" stroke="black" strokeWidth="2" opacity="0.06" />
              {/* Hole shadow */}
              <rect x={holeX - holeW / 2 + 1} y={cy - holeH / 2 + 1} width={holeW} height={holeH} rx="2" fill="rgba(0,0,0,0.25)" />
              {/* Hole */}
              <rect x={holeX - holeW / 2} y={cy - holeH / 2} width={holeW} height={holeH} rx="2" fill={isDark ? '#0a0a0a' : '#111'} />
              <rect x={holeX - holeW / 2} y={cy - holeH / 2} width={holeW} height={holeH} rx="2" fill="none" stroke={isDark ? '#222' : '#444'} strokeWidth="0.5" />
              {/* Front half — loops right over paper */}
              <path d={`M ${ringX},${cy - ringRy} A ${ringRx},${ringRy} 0 0,1 ${ringX},${cy + ringRy}`} fill="none" stroke="url(#wire-front)" strokeWidth="3.5" />
              <path d={`M ${ringX},${cy - ringRy} A ${ringRx},${ringRy} 0 0,1 ${ringX},${cy + ringRy}`} fill="none" stroke={wireHi} strokeWidth="0.8" opacity="0.35" />
              <path d={`M ${ringX + 1},${cy - ringRy + 1} A ${ringRx},${ringRy} 0 0,1 ${ringX + 1},${cy + ringRy + 1}`} fill="none" stroke="black" strokeWidth="2" opacity="0.04" />
            </g>
          )
        })}
      </svg>
    </div>
  )
  return (
    <div className="absolute top-[-20px] left-0 right-0 h-[44px] z-30 pointer-events-none" style={{ overflow: 'visible' }}>
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="wire-h-back" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor={wireShadow} />
            <stop offset="50%" stopColor={wire} />
            <stop offset="100%" stopColor={wireShadow} />
          </linearGradient>
          <linearGradient id="wire-h-front" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor={wire} />
            <stop offset="30%" stopColor={wireHi} />
            <stop offset="60%" stopColor={wire} />
            <stop offset="100%" stopColor={wireShadow} />
          </linearGradient>
        </defs>
        {Array.from({ length: 30 }).map((_, i) => {
          const cx = 40 + i * 30
          const holeY = 24
          const holeW = 6
          const holeH = 10
          const ringRx = 7
          const ringRy = 18
          return (
            <g key={i}>
              <path d={`M ${cx - ringRx},${holeY} A ${ringRx},${ringRy} 0 0,0 ${cx + ringRx},${holeY}`} fill="none" stroke="url(#wire-h-back)" strokeWidth="3" />
              <rect x={cx - holeW / 2 + 1} y={holeY - holeH / 2 + 1} width={holeW} height={holeH} rx="1.5" fill="rgba(0,0,0,0.2)" />
              <rect x={cx - holeW / 2} y={holeY - holeH / 2} width={holeW} height={holeH} rx="1.5" fill={isDark ? '#0a0a0a' : '#1a1a1a'} />
              <rect x={cx - holeW / 2} y={holeY - holeH / 2} width={holeW} height={holeH} rx="1.5" fill="none" stroke={isDark ? '#222' : '#555'} strokeWidth="0.5" />
              <path d={`M ${cx - ringRx},${holeY} A ${ringRx},${ringRy} 0 0,1 ${cx + ringRx},${holeY}`} fill="none" stroke="url(#wire-h-front)" strokeWidth="3.5" />
              <path d={`M ${cx - ringRx},${holeY} A ${ringRx},${ringRy} 0 0,1 ${cx + ringRx},${holeY}`} fill="none" stroke={wireHi} strokeWidth="0.8" opacity="0.35" />
            </g>
          )
        })}
      </svg>
    </div>
  )
})

const ScrollModePage = memo(function ScrollModePage({
  pageIdx, html, boxes, isActive, onClick, paperBg, paperImg, paperSize, theme, editorFont, baseFontSize, paperStyle, inkColor
}: {
  pageIdx: number; html: string; boxes: TextBoxType[]; isActive: boolean;
  onClick: () => void; paperBg: string; paperImg?: string; paperSize?: string;
  theme: "light" | "dark"; editorFont: string; baseFontSize: string; paperStyle: string; inkColor: string
}) {
  return (
    <div
      data-page-idx={pageIdx}
      onClick={isActive ? undefined : onClick}
      style={{
        position: "relative",
        minHeight: 1100,
        backgroundColor: paperBg,
        backgroundImage: paperImg,
        backgroundSize: paperSize,
        cursor: isActive ? undefined : "pointer",
        outline: isActive ? `2px solid #d97706` : "2px solid transparent",
        outlineOffset: 2,
        transition: "outline-color 0.15s",
      }}
    >
      <div
        style={{
          position: "absolute", left: "7rem", top: 0, bottom: 0, width: 1,
          backgroundColor: theme === "dark" ? "rgba(248,113,113,0.3)" : "rgba(252,165,165,0.6)",
          zIndex: 20, pointerEvents: "none"
        }}
      />
      <div
        style={{
          fontFamily: `"${editorFont}", Crimson Pro, serif`,
          fontSize: baseFontSize === "small" ? 14 : baseFontSize === "large" ? 22 : 18,
          fontWeight: 400, letterSpacing: "0.1px", lineHeight: 1.8,
          color: inkColor, minHeight: 1000, pointerEvents: "none", userSelect: "none",
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {boxes.map(box => (
        <div
          key={box.id}
          style={{
            position: "absolute", left: box.x, top: box.y, width: box.w,
            minHeight: box.h, pointerEvents: "none", userSelect: "none",
            fontFamily: box.boxFontFamily || `"${editorFont}", Crimson Pro, serif`,
            fontSize: box.boxFontSize || (baseFontSize === "small" ? 14 : baseFontSize === "large" ? 22 : 18),
            color: box.boxTextColor || inkColor,
            backgroundColor: box.boxHighlightColor || undefined,
            transform: box.boxRotation ? `rotate(${box.boxRotation}deg)` : undefined,
          }}
          dangerouslySetInnerHTML={{ __html: box.content }}
        />
      ))}
      {!isActive && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 30,
          background: theme === "dark" ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0.01)",
          transition: "background 0.15s",
        }} />
      )}
    </div>
  )
})

const BoxItem = memo(function BoxItem({
  box, isSelected, selectedCount, loadingBoxId, accentSolid, theme, paperStyle, handwrittenEffect,
  startDrag, startResize, deleteBox, updateBox, updateBoxContent, setSelectedBoxIds,
  onKeyDown, onInput, onRewrite, onImageGen,
  formattingOpen, setFormattingOpen, aiOpen, setAiOpen,
  onDragStart, onDragEnd, spellCheck: spellCheckProp
}: {
  box: TextBoxType; isSelected: boolean; selectedCount: number; loadingBoxId: string | null; accentSolid: string; theme: "light" | "dark"
  paperStyle: PaperStyle; spellCheck?: boolean
  startDrag: (e: React.MouseEvent, box: TextBoxType) => void
  startResize: (e: React.MouseEvent, box: TextBoxType, handle: string) => void
  deleteBox: (id: string) => void
  updateBox: (id: string, updates: Partial<TextBoxType>) => void
  updateBoxContent: (id: string, v: string) => void
  setSelectedBoxIds: (v: Set<string> | ((p: Set<string>) => Set<string>)) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void
  onInput: (e: React.FormEvent<HTMLElement>) => void
  onRewrite: (text: string, id: string) => void
  onImageGen: (text: string, id: string) => void
  formattingOpen: boolean; setFormattingOpen: (v: boolean) => void
  aiOpen: boolean; setAiOpen: (v: boolean) => void
  onDragStart: () => void; onDragEnd: () => void; handwrittenEffect: boolean
}) {
  const [localDragging, setLocalDragging] = useState(false)
  const [pristine, setPristine] = useState(box.content.trim() === '')
  const [mediaEditing, setMediaEditing] = useState(false)
  const isDark = isDarkPaper(paperStyle)
  const resizeHandles = useMemo<[string, React.CSSProperties][]>(() => [
    ["e", { top: 4, bottom: 4, right: -4, width: 12, cursor: "e-resize", background: "transparent" }],
  ], [])
  useEffect(() => {
    if (pristine && !isSelected) setPristine(false)
    if (!isSelected && mediaEditing) setMediaEditing(false)
  }, [isSelected, pristine, mediaEditing])
  const rawImage = !box.content.startsWith("<") && (box.content.startsWith("http") || box.content.startsWith("data:image"))
  const htmlImgMatch = !rawImage ? /^<img\s[^>]*src="([^"]+)"/.exec(box.content.trim()) : null
  const isImage = rawImage || !!htmlImgMatch
  const imageSrc = rawImage ? box.content : htmlImgMatch?.[1] || ''
  const isSticky = !!box.boxHighlightColor
  const isTitle = !!box.isTitle
  const isEmpty = !isSticky && !isImage && !isTitle && box.content.trim() === ''
  const hideChrome = pristine && !isEmpty
  return (
    <div
      id={`box-${box.id}`}
      onMouseDown={e => {
        if (isImage && !mediaEditing) {
          e.preventDefault()
          const el = e.currentTarget as HTMLElement
          el.style.transition = 'none'
          el.style.willChange = 'left, top'
          setLocalDragging(true); onDragStart(); startDrag(e, box)
          const up = () => {
            el.style.transition = ''
            el.style.willChange = ''
            setLocalDragging(false); onDragEnd(); window.removeEventListener('mouseup', up)
          }
          window.addEventListener('mouseup', up)
          return
        }
        if (isSticky) {
          const target = e.target as HTMLElement
          const isEditing = target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
          if (isEditing && isSelected) return
          e.preventDefault()
          const el = e.currentTarget as HTMLElement
          el.style.transition = 'none'
          el.style.willChange = 'left, top'
          setLocalDragging(true); onDragStart(); startDrag(e, box)
          const up = () => {
            el.style.transition = ''
            el.style.willChange = ''
            setLocalDragging(false); onDragEnd(); window.removeEventListener('mouseup', up)
          }
          window.addEventListener('mouseup', up)
          return
        }
        // Text boxes: no drag from body, only from bottom handle
        if (!isSelected) {
          setSelectedBoxIds(new Set([box.id]))
          const ce = (e.currentTarget as HTMLElement).querySelector<HTMLElement>('[contenteditable]')
          if (ce) ce.focus()
        }
      }}
      onClick={e => {
        if (isSticky) {
          const ta = (e.currentTarget as HTMLElement).querySelector<HTMLElement>('[contenteditable]')
          ta?.focus()
        }
      }}
      onDoubleClick={e => {
        if (isImage && !mediaEditing) {
          e.preventDefault()
          e.stopPropagation()
          setMediaEditing(true)
        }
      }}
      style={{
        position: "absolute", left: box.x, top: box.y, width: box.w,
        height: isSticky || box.sizeLocked ? box.h : "auto", minHeight: isSticky || box.sizeLocked ? undefined : 36,
        transform: `rotate(${box.boxRotation || 0}deg)`,
        border: isEmpty || hideChrome ? "1px solid transparent" : isSelected ? ((box.boxOutlineWidth || 0) > 0 ? `${box.boxOutlineWidth}px solid currentColor` : `1px solid ${isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.10)"}`) : "1px solid transparent",
        color: (box.boxHeadingStyle as string) === "margin" ? (isDarkPaper(paperStyle) ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.32)") : getInkColor(paperStyle, theme === "dark"),
        borderRadius: 4, backgroundColor: isSticky ? (box.boxHighlightColor || "transparent") : "transparent",
        zIndex: isSelected ? 100 : 50, overflow: isSticky || box.sizeLocked ? "hidden" : "visible", cursor: isImage || isSticky ? "grab" : "text",
        boxShadow: isSticky
          ? "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
          : "none",
        transition: localDragging ? "none" : "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
        willChange: localDragging ? "left, top" : "auto",
      }}
    >
      {isSelected && !isEmpty && !hideChrome && (
        <div style={{ position: "absolute", inset: -1, border: `1.5px solid ${isDark ? "rgba(113,113,122,0.5)" : "rgba(0,0,0,0.18)"}`, borderRadius: 5, pointerEvents: "none", zIndex: 55 }} />
      )}
      {isSelected && !isSticky && !isEmpty && !hideChrome && resizeHandles.map(([h, pos]) => (
        <div key={h} onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onDragStart(); startResize(e, box, h) }}
          style={{ position: "absolute", zIndex: 20, ...pos }} />
      ))}
      {isSelected && !isSticky && !isEmpty && !hideChrome && (
        <div style={{ position: "absolute", top: 0, right: -34, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, zIndex: 120 }}>
          {/* Rotate button */}
          <div
            title="Rotate"
            className="hover:scale-110 active:scale-95 transition-transform"
            onMouseDown={e => {
              e.preventDefault(); e.stopPropagation()
              const el = document.getElementById(`box-${box.id}`)
              if (!el) return
              const rect = el.getBoundingClientRect()
              const cx = rect.left + rect.width / 2
              const cy = rect.top + rect.height / 2
              const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI
              const startRotation = box.boxRotation || 0
              const onMove = (me: MouseEvent) => {
                const a = Math.atan2(me.clientY - cy, me.clientX - cx) * 180 / Math.PI
                updateBox(box.id, { boxRotation: startRotation + (a - startAngle) })
              }
              const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
              window.addEventListener('mousemove', onMove)
              window.addEventListener('mouseup', onUp)
            }}
            style={{
              width: 17, height: 17, borderRadius: "50%",
              background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)", cursor: "grab",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)", flexShrink: 0,
              filter: "url(#handwritten-jitter-subtle)"
            }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v5h-5" />
              <path d="M2.5 12a10 10 0 0 1 17-7" />
            </svg>
          </div>
          <button
            onMouseDown={e => { e.stopPropagation(); deleteBox(box.id) }}
            className="hover:scale-110 active:scale-95 transition-transform"
            style={{
              width: 17, height: 17, borderRadius: "50%",
              background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)", border: "none",
              cursor: "pointer", fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center",
              lineHeight: 1, color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)", flexShrink: 0,
              fontFamily: 'cursive', fontWeight: 400,
              filter: "url(#handwritten-jitter-subtle)"
            }}>×</button>
          <button
            title={box.sizeLocked ? "Unlock size" : "Lock size"}
            onMouseDown={e => { e.stopPropagation(); updateBox(box.id, { sizeLocked: !box.sizeLocked }) }}
            className="hover:scale-110 active:scale-95 transition-transform"
            style={{
              width: 17, height: 17, borderRadius: "50%",
              background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)", border: "none",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: box.sizeLocked ? "#d97706" : (isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)"), flexShrink: 0,
              filter: "url(#handwritten-jitter-subtle)"
            }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {box.sizeLocked ? (
                <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>
              ) : (
                <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></>
              )}
            </svg>
          </button>
        </div>
      )}
      {isSelected && isSticky && (
        <button
          onMouseDown={e => { e.stopPropagation(); deleteBox(box.id) }}
          className="hover:scale-110 active:scale-95 transition-transform"
          style={{
            position: "absolute", top: 10, right: 8,
            background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)", border: "none",
            cursor: "pointer", fontSize: 13, width: 17, height: 17,
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "50%", lineHeight: 1, color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
            zIndex: 120, fontFamily: 'cursive', fontWeight: 400,
            filter: "url(#handwritten-jitter-subtle)"
          }}>×</button>
      )}
      {isSelected && selectedCount === 1 && !isImage && !isSticky && !isEmpty && !hideChrome && (
        <BoxToolbar box={box} accentSolid={accentSolid} theme={theme} paperStyle={paperStyle} onUpdateBox={updateBox} onRewrite={onRewrite} onImageGen={onImageGen}
          formattingOpen={formattingOpen} setFormattingOpen={setFormattingOpen} aiOpen={aiOpen} setAiOpen={setAiOpen} />
      )}

      {isSelected && !isSticky && !isEmpty && !hideChrome && (
        <div
          onMouseDown={e => {
            e.preventDefault(); e.stopPropagation()
            const ce = (e.currentTarget.parentElement as HTMLElement)?.querySelector<HTMLElement>('[contenteditable]')
            if (ce) { ce.blur() }
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
            const el = e.currentTarget.parentElement as HTMLElement
            el.style.transition = 'none'
            el.style.willChange = 'left, top'
            setLocalDragging(true); onDragStart(); startDrag(e, box)
            const up = () => {
              el.style.transition = ''
              el.style.willChange = ''
              setLocalDragging(false); onDragEnd(); window.removeEventListener('mouseup', up)
            }
            window.addEventListener('mouseup', up)
          }}
          style={{ position: "absolute", bottom: -10, left: 0, width: "100%", height: 10, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", borderRadius: "0 0 4px 4px", cursor: "grab", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center" }}
        >
          <div style={{ width: 28, height: 1.5, background: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)", borderRadius: 1 }} />
        </div>
      )}

      {/* Sticky note top strip */}
      {isSticky && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 32,
          background: "rgba(255,255,255,0.18)",
          borderRadius: "2px 2px 0 0",
          zIndex: 10, pointerEvents: "none",
        }} />
      )}

      <div
        onMouseDown={e => {
          if (isImage || isSticky) return
          const target = e.target as HTMLElement
          if (target.isContentEditable || target.closest('[contenteditable]')) return
          e.stopPropagation()
          const ce = (e.currentTarget as HTMLElement).querySelector<HTMLElement>('[contenteditable]')
          if (ce) {
            ce.focus()
            const sel = window.getSelection()
            if (sel) {
              const range = document.createRange()
              range.selectNodeContents(ce)
              range.collapse(false)
              sel.removeAllRanges()
              sel.addRange(range)
            }
            setSelectedBoxIds(new Set([box.id]))
          }
        }}
        style={{ padding: isSticky ? "40px 10px 10px" : box.sizeLocked ? "0" : "8px 12px", height: isSticky || box.sizeLocked ? "100%" : undefined, boxSizing: isSticky || box.sizeLocked ? "border-box" : undefined, overflowY: isSticky ? "auto" : undefined, cursor: "text" }}
      >
        {loadingBoxId === box.id ? (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#a1a1aa", fontSize: 10, fontFamily: "monospace" }}>generating…</div>
        ) : isImage && !mediaEditing ? (
          <img src={imageSrc} style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none", userSelect: "none" }} alt="media" draggable={false} />
        ) : (
          <BoxTextarea
            id={box.id}
            content={box.content}
            textAlign={box.textAlign}
            boxFontFamily={box.boxFontFamily}
            boxFontSize={box.boxFontSize}
            boxHeadingStyle={box.boxHeadingStyle}
            boxHighlightColor={box.boxHighlightColor}
            boxTextColor={box.boxTextColor}
            isSticky={isSticky}
            sizeLocked={box.sizeLocked}
            onUpdate={(id, updates) => updateBox(id, updates)}
            onFocus={() => setSelectedBoxIds(new Set([box.id]))}
            onKeyDown={onKeyDown}
            onInput={onInput}
            theme={theme}
            paperStyle={paperStyle}
            handwrittenEffect={handwrittenEffect}
            spellCheck={spellCheckProp}
          />
        )}
      </div>
    </div>
  )
})

const BOX_HEADING_SIZES: Record<string, number> = { h1: 42, h2: 28, h3: 22, default: 20, margin: 26 }
const BOX_HEADING_WEIGHTS: Record<string, number> = { h1: 800, h2: 700, h3: 700, default: 400, margin: 400 }
const BOX_FONTS = [
  { value: "cursive", label: "Handwritten" },
  { value: "'Brush Script MT', cursive", label: "Script" },
  { value: "", label: "Georgia" },
  { value: "'Palatino Linotype', Palatino, serif", label: "Palatino" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: '"Courier New", monospace', label: "Mono" },
]
const BOX_SIZES = [8, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72]
const BOX_STYLES = [
  { value: "default", label: "NA" },
  { value: "h1", label: "H1" },
  { value: "h2", label: "H2" },
  { value: "h3", label: "H3" },
  { value: "margin", label: "Mg" },
]

const BoxToolbar = memo(function BoxToolbar({ box, accentSolid, theme, paperStyle, onUpdateBox, onRewrite, onImageGen, formattingOpen, setFormattingOpen, aiOpen, setAiOpen }: {
  box: TextBoxType; accentSolid: string; theme: "light" | "dark"; paperStyle: PaperStyle
  onUpdateBox: (id: string, updates: Partial<TextBoxType>) => void
  onRewrite: (text: string, id: string) => void
  onImageGen: (text: string, id: string) => void
  formattingOpen: boolean; setFormattingOpen: (v: boolean) => void
  aiOpen: boolean; setAiOpen: (v: boolean) => void
}) {
  const [open, setOpen] = useState<"style" | "font" | "size" | "color" | "textColor" | null>(null)
  const [anchorLeft, setAnchorLeft] = useState(0)
  const [customSize, setCustomSize] = useState("")
  const ref = useRef<HTMLDivElement>(null)
  const styleBtnRef = useRef<HTMLButtonElement>(null)
  const fontBtnRef = useRef<HTMLButtonElement>(null)
  const sizeBtnRef = useRef<HTMLButtonElement>(null)
  const colorBtnRef = useRef<HTMLButtonElement>(null)
  const textColorBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(null) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const openDropdown = (type: any) => {
    const btnRef = type === "style" ? styleBtnRef : type === "font" ? fontBtnRef : type === "size" ? sizeBtnRef : type === "textColor" ? textColorBtnRef : colorBtnRef
    if (btnRef.current && ref.current) {
      const b = btnRef.current.getBoundingClientRect()
      const t = ref.current.getBoundingClientRect()
      setAnchorLeft(b.left - t.left)
    }
    setOpen(o => o === type ? null : type)
  }

  const styleKey = box.boxHeadingStyle || "default"
  const currentFont = BOX_FONTS.find(f => f.value === (box.boxFontFamily ?? "")) ?? BOX_FONTS[0]
  const currentSize = box.boxFontSize ?? BOX_HEADING_SIZES[styleKey]

  const dk = isDarkPaper(paperStyle)
  const dropdownBase: React.CSSProperties = {
    position: "absolute", top: "calc(100% + 4px)", left: anchorLeft,
    background: dk ? "rgba(31,31,35,0.82)" : "rgba(255,255,255,0.82)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${dk ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`,
    borderRadius: 6, padding: 3,
    boxShadow: dk ? "0 4px 12px rgba(0,0,0,0.4)" : "0 4px 12px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)",
    zIndex: 400, minWidth: 90,
  }
  const optionBtn = (active: boolean): React.CSSProperties => ({
    display: "block", width: "100%", textAlign: "left", paddingTop: 5, paddingBottom: 5, paddingLeft: 9, paddingRight: 9,
    fontSize: 10, fontWeight: active ? 600 : 400, border: "none",
    background: active ? (dk ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)") : "transparent",
    cursor: "pointer", color: dk ? "#e4e4e7" : "#18181b", borderRadius: 4,
    fontFamily: "'Inter', sans-serif",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  })
  const triggerStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 400, fontStyle: "italic", color: "#71717a", background: "none", border: "none",
    cursor: "pointer", paddingTop: 2, paddingBottom: 2, paddingLeft: 6, paddingRight: 6, borderRadius: 4,
    display: "flex", alignItems: "center", gap: 3, letterSpacing: "0.01em",
    fontFamily: 'Crimson Pro, serif',
  }
  const chevron = <svg width="7" height="5" viewBox="0 0 10 6" fill="currentColor" style={{ opacity: 0.45, flexShrink: 0 }}><path d="M0 0l5 6 5-6z" /></svg>
  // Handlers
  const highlightColors = ["transparent", "rgba(239,68,68,0.15)", "rgba(249,115,22,0.15)", "rgba(234,179,8,0.15)", "rgba(34,197,94,0.15)", "rgba(14,165,233,0.15)", "rgba(59,130,246,0.15)", "rgba(168,85,247,0.15)", "rgba(236,72,153,0.15)", "rgba(156,163,175,0.15)"]
  const darkPaper = isDarkPaper(paperStyle)
  const textColors = (dk || darkPaper)
    ? ["#fca5a5", "#fdba74", "#fde047", "#6ee7b7", "#93c5fd", "#a5b4fc", "#c4b5fd", "#f9a8d4", "#d4d4d8", "#fafafa"]
    : ["#ef4444", "#f97316", "#f59e0b", "#10b981", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#52525b", "#d4d4d8"]
  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => { e.stopPropagation() }, [])

  const applyInlineCSS = useCallback((css: string): boolean => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return false
    const range = sel.getRangeAt(0)
    const span = document.createElement('span')
    span.setAttribute('style', css)
    try {
      range.surroundContents(span)
    } catch {
      const frag = range.extractContents()
      span.appendChild(frag)
      range.insertNode(span)
    }
    const ce = span.closest('[contenteditable]')
    if (ce) ce.dispatchEvent(new InputEvent('input', { bubbles: true }))
    return true
  }, [])

  return (
    <div ref={ref} onMouseDown={e => e.stopPropagation()} style={{
      position: "absolute", top: -22, left: -24,
      display: "flex", alignItems: "center", gap: 6,
      background: "transparent",
      zIndex: 9999, whiteSpace: "nowrap",
      pointerEvents: "auto",
    }}>
      <button onClick={() => { setFormattingOpen(!formattingOpen); setAiOpen(false); setOpen(null) }}
        style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center", justifyContent: "center", color: formattingOpen ? accentSolid : "#a1a1aa", opacity: formattingOpen ? 1 : 0.6, borderRadius: 4, transition: "all 0.2s" }}
        onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = formattingOpen ? "1" : "0.6"}>
        {!formattingOpen ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
        )}
      </button>


      <div style={{
        overflow: "hidden",
        maxWidth: !formattingOpen ? 0 : 400,
        opacity: !formattingOpen ? 0 : 1,
        transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        background: formattingOpen ? (dk ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)") : "transparent",
        borderRadius: 6,
        padding: formattingOpen ? "0 2px" : 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 1, whiteSpace: "nowrap" }}>
          <button ref={styleBtnRef} style={triggerStyle} onMouseDown={e => { e.preventDefault(); openDropdown("style") }}>
            {BOX_STYLES.find(s => s.value === styleKey)?.label} {chevron}
          </button>
          <button ref={fontBtnRef} style={{ ...triggerStyle, fontFamily: currentFont.value || 'Crimson Pro, serif' }} onMouseDown={e => { e.preventDefault(); openDropdown("font") }}>
            {currentFont.label.toLowerCase()} {chevron}
          </button>
          <button ref={sizeBtnRef} style={triggerStyle} onMouseDown={e => { e.preventDefault(); openDropdown("size") }}>
            {currentSize}px {chevron}
          </button>

          <button ref={textColorBtnRef} style={{ ...triggerStyle, color: "#a1a1aa", marginLeft: 4 }} onMouseDown={e => { e.preventDefault(); openDropdown("textColor") }} title="Text color">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20h16"></path>
              <path d="m6 16 6-12 6 12"></path>
              <path d="M8 12h8"></path>
            </svg>
          </button>



          {open === "style" && (
            <div style={dropdownBase}>
              {BOX_STYLES.map(s => (
                <button key={s.value} style={optionBtn(styleKey === s.value)} onMouseDown={e => {
                  e.preventDefault()
                  onUpdateBox(box.id, { boxHeadingStyle: s.value as any, boxFontSize: undefined })
                  setOpen(null)
                }}>{s.label}</button>
              )
              )}
            </div>
          )}
          {open === "font" && (
            <div style={dropdownBase}>
              {BOX_FONTS.map(f => (
                <button key={f.value} style={{ ...optionBtn(currentFont.value === f.value), fontFamily: f.value || 'Crimson Pro, serif' }} onMouseDown={e => {
                  e.preventDefault()
                  if (!applyInlineCSS(`font-family: ${f.value || 'Crimson Pro, serif'}`)) onUpdateBox(box.id, { boxFontFamily: f.value })
                  setOpen(null)
                }}>{f.label.toLowerCase()}</button>
              ))}
            </div>
          )}
          {open === "size" && (
            <div style={{ ...dropdownBase, display: "flex", flexDirection: "column", maxHeight: 220 }}>
              <div style={{ padding: "4px 6px 6px", borderBottom: "1px solid rgba(0,0,0,0.06)", marginBottom: 3, flexShrink: 0 }}>
                <input type="number" min={1} max={400} placeholder="Custom…" value={customSize} onChange={e => setCustomSize(e.target.value)} onKeyDown={e => { e.stopPropagation(); if (e.key === "Enter" && customSize) { const n = parseInt(customSize); if (n > 0) { if (!applyInlineCSS(`font-size: ${n}px`)) onUpdateBox(box.id, { boxFontSize: n }); setOpen(null); setCustomSize("") } } }} style={{ width: "100%", border: `1px solid ${dk ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.10)"}`, borderRadius: 4, padding: "3px 7px", fontSize: 11, outline: "none", color: dk ? "#e4e4e7" : "#18181b", background: dk ? "#2a2a2e" : "#fafafa" }} />
              </div>
              <div style={{ overflowY: "auto" }}>
                {BOX_SIZES.map(sz => <button key={sz} style={optionBtn(currentSize === sz)} onMouseDown={e => { e.preventDefault(); if (!applyInlineCSS(`font-size: ${sz}px`)) onUpdateBox(box.id, { boxFontSize: sz }); setOpen(null) }}>{sz}px</button>)}
              </div>
            </div>
          )}
          {open === "color" && (
            <div style={{ ...dropdownBase, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, padding: 6 }}>
              {highlightColors.map(c => <button key={c} onClick={() => { onUpdateBox(box.id, { boxHighlightColor: c }); setOpen(null) }} style={{ width: 18, height: 18, borderRadius: 3, background: c, border: c === "transparent" ? "1px solid rgba(150,150,150,0.4)" : `1px solid ${c.replace("0.15)", "0.45)")}`, cursor: "pointer" }} />)}
            </div>
          )}
          {open === "textColor" && (
            <div style={{ ...dropdownBase, minWidth: 140, padding: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5, marginBottom: 8 }}>
                <button
                  key="default"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onUpdateBox(box.id, { boxTextColor: undefined })
                    setOpen(null)
                  }}
                  style={{ width: 22, height: 22, borderRadius: 4, background: "transparent", border: `1px solid ${dk ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}`, cursor: "pointer", position: "relative", overflow: "hidden" }}
                  title="Default"
                >
                  <div style={{ position: "absolute", top: "50%", left: -2, width: 28, height: 1, background: dk ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)", transform: "rotate(45deg)" }} />
                </button>
                {textColors.map(c => (
                  <button
                    key={c}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      const sel = window.getSelection()
                      if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
                        document.execCommand('foreColor', false, c)
                      } else {
                        onUpdateBox(box.id, { boxTextColor: c })
                      }
                      setOpen(null)
                    }}
                    style={{ width: 22, height: 22, borderRadius: 4, background: c, border: `1px solid ${dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, cursor: "pointer" }}
                  />
                ))}
              </div>
              <div style={{ borderTop: `1px solid ${dk ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, paddingTop: 6 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", paddingLeft: 2 }}>
                  <input
                    type="color"
                    onMouseDown={(e) => e.preventDefault()}
                    onInput={e => {
                      const c = (e.target as HTMLInputElement).value
                      const sel = window.getSelection()
                      if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
                        document.execCommand('foreColor', false, c)
                      } else {
                        onUpdateBox(box.id, { boxTextColor: c })
                      }
                    }}
                    style={{ width: 16, height: 16, padding: 0, border: "none", borderRadius: 3, cursor: "pointer", background: "transparent" }}
                  />
                  <span style={{ fontSize: 10, color: dk ? "#a1a1aa" : "#71717a", fontWeight: 400 }}>Custom color</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Menu */}
      <div style={{
        overflow: "hidden",
        maxWidth: aiOpen ? 400 : 0,
        opacity: aiOpen ? 1 : 0,
        transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        background: aiOpen ? (dk ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)") : "transparent",
        borderRadius: 6,
        padding: aiOpen ? "0 2px" : 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
          <button style={triggerStyle} onClick={() => { onRewrite(box.content, box.id); setAiOpen(false) }}>Rewrite</button>
          <button style={triggerStyle} onClick={() => { onImageGen(box.content, box.id); setAiOpen(false) }}>Img Gen</button>
          <div style={{ width: 1, height: 12, background: dk ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)", margin: "0 6px", transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)" }} />
          {(["left", "center", "right"] as const).map(align => (
            <button key={align} style={{ ...triggerStyle, padding: "2px 4px", color: box.textAlign === align ? accentSolid : triggerStyle.color }}
              onClick={() => onUpdateBox(box.id, { textAlign: align })}>
              {align === "left" && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" /></svg>}
              {align === "center" && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="10" x2="6" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="18" y1="18" x2="6" y2="18" /></svg>}
              {align === "right" && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="7" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="21" y1="18" x2="7" y2="18" /></svg>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})

interface BoxTextareaProps {
  id: string; content: string; textAlign?: "left" | "center" | "right" | "justify"
  boxFontFamily?: string; boxFontSize?: number; boxHeadingStyle?: string; boxHighlightColor?: string; boxTextColor?: string
  isSticky?: boolean; sizeLocked?: boolean; theme: "light" | "dark"; paperStyle: PaperStyle; handwrittenEffect: boolean
  onUpdate: (id: string, updates: Partial<TextBoxType>) => void
  onFocus: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void
  onInput: (e: React.FormEvent<HTMLElement>) => void
  spellCheck?: boolean
}

const BoxTextarea = memo(function BoxTextarea({
  id, content, textAlign, boxFontFamily, boxFontSize, boxHeadingStyle, boxTextColor, isSticky, sizeLocked, theme, paperStyle, handwrittenEffect, onUpdate, onFocus, onKeyDown, onInput, spellCheck: spellCheckProp
}: BoxTextareaProps) {
  const ref = useRef<HTMLDivElement>(null)
  const timerRef = useRef<any>(null)
  const prevContentRef = useRef<string>('')

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== content) {
      if (ref.current.contains(document.activeElement) || ref.current === document.activeElement) return
      ref.current.innerHTML = sanitizeHTML(content)
      prevContentRef.current = content
    }
  }, [content])

  const syncState = useCallback(() => {
    if (!ref.current) return
    const v = ref.current.innerHTML
    if (isSticky || sizeLocked) {
      onUpdate(id, { content: v })
    } else {
      const h = Math.max(ref.current.scrollHeight, 32)
      onUpdate(id, { content: v, h })
    }
  }, [id, isSticky, sizeLocked, onUpdate])

  const styleKey = boxHeadingStyle || "default"
  const isMarginStyle = styleKey === "margin"
  const resolvedSize = boxFontSize ?? BOX_HEADING_SIZES[styleKey]
  const resolvedFont = isMarginStyle ? "cursive" : (boxFontFamily || 'Crimson Pro, serif')
  const inkColor = boxTextColor
    ? boxTextColor
    : isMarginStyle
      ? (isDarkPaper(paperStyle) ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.32)")
      : getInkColor(paperStyle, theme === "dark")

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      spellCheck={spellCheckProp}
      data-box-style={styleKey}
      onKeyDown={e => {
        // Erase animation — applies to both selection and single-char backspace.
        // Ghosts live in #editor-paper as absolutely-positioned overlays so the
        // actual text is deleted immediately (no cursor traps, safe under rapid deletion).
        if ((e.key === 'Backspace' || e.key === 'Delete') && ref.current && !e.defaultPrevented) {
          const sel = window.getSelection()
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0)

            let ghostRect: DOMRect | null = null
            let ghostText = ''
            let didDelete = false

            if (!range.collapsed) {
              if (range.toString().length > 0) {
                e.preventDefault()
                range.deleteContents()
                sel.collapseToStart()
                didDelete = true
              }
            } else if (
              e.key === 'Backspace' &&
              range.startContainer.nodeType === Node.TEXT_NODE &&
              range.startOffset > 0
            ) {
              const textNode = range.startContainer as Text
              const charRange = document.createRange()
              charRange.setStart(textNode, range.startOffset - 1)
              charRange.setEnd(textNode, range.startOffset)
              ghostRect = charRange.getBoundingClientRect()
              ghostText = textNode.data.charAt(range.startOffset - 1)
              if (ghostRect.width > 0 && ghostText) {
                e.preventDefault()
                const newOffset = range.startOffset - 1
                textNode.deleteData(newOffset, 1)
                const r = document.createRange()
                r.setStart(textNode, newOffset)
                r.collapse(true)
                sel.removeAllRanges()
                sel.addRange(r)
                didDelete = true
              }
            } else if (
              e.key === 'Delete' &&
              range.startContainer.nodeType === Node.TEXT_NODE &&
              range.startOffset < (range.startContainer as Text).data.length
            ) {
              const textNode = range.startContainer as Text
              const charRange = document.createRange()
              charRange.setStart(textNode, range.startOffset)
              charRange.setEnd(textNode, range.startOffset + 1)
              ghostRect = charRange.getBoundingClientRect()
              ghostText = textNode.data.charAt(range.startOffset)
              if (ghostRect.width > 0 && ghostText) {
                e.preventDefault()
                const pos = range.startOffset
                textNode.deleteData(pos, 1)
                const r = document.createRange()
                r.setStart(textNode, pos)
                r.collapse(true)
                sel.removeAllRanges()
                sel.addRange(r)
                didDelete = true
              }
            }

            if (didDelete && ghostRect && !document.documentElement.hasAttribute('data-reduce-motion')) {
              const paper = document.getElementById('editor-paper')
              if (paper) {
                let zoom = 1
                const zoomWrapper = document.querySelector('.shrink-0[style*="maxWidth"]') as HTMLElement | null
                if (zoomWrapper && zoomWrapper.style.zoom) zoom = parseFloat(zoomWrapper.style.zoom) || 1

                let layer = document.getElementById('ghost-layer')
                if (!layer) {
                  layer = document.createElement('div')
                  layer.id = 'ghost-layer'
                  layer.style.position = 'absolute'
                  layer.style.inset = '0'
                  layer.style.pointerEvents = 'none'
                  layer.style.zIndex = '40'
                  paper.appendChild(layer)
                }

                const paperRect = paper.getBoundingClientRect()
                const ghost = document.createElement('span')
                ghost.className = 'erased'
                ghost.textContent = ghostText
                ghost.style.position = 'absolute'
                ghost.style.left = ((ghostRect.left - paperRect.left) / zoom) + 'px'
                ghost.style.top = ((ghostRect.top - paperRect.top) / zoom) + 'px'
                ghost.style.width = (ghostRect.width / zoom) + 'px'
                ghost.style.height = (ghostRect.height / zoom) + 'px'
                ghost.style.overflow = 'hidden'

                const comp = window.getComputedStyle(ref.current)
                ghost.style.fontFamily = comp.fontFamily
                ghost.style.fontSize = comp.fontSize
                ghost.style.fontWeight = comp.fontWeight
                ghost.style.lineHeight = comp.lineHeight
                ghost.style.color = comp.color
                ghost.style.letterSpacing = comp.letterSpacing

                const cleanup = () => ghost.remove()
                ghost.addEventListener('animationend', cleanup)
                setTimeout(cleanup, 500)
                layer.appendChild(ghost)
              }
              clearTimeout(timerRef.current)
              timerRef.current = setTimeout(syncState, 60)
            }
          }
        }
        // Call parent handler
        if (!e.defaultPrevented) {
          onKeyDown(e)
        }
        if (!e.defaultPrevented) e.stopPropagation()
      }}
      onInput={e => {
        onInput(e)
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(syncState, 150)
      }}
      onPaste={e => {
        const clip = e.clipboardData
        if (!clip) return
        const el = ref.current

        const imageFile = Array.from(clip.files).find(f => f.type.startsWith("image/"))
        if (imageFile) {
          e.preventDefault()
          const reader = new FileReader()
          reader.onload = () => {
            if (el) el.focus()
            const img = `<img src="${reader.result}" style="max-width:100%;border-radius:4px;margin:6px 0;display:block;" />`
            document.execCommand("insertHTML", false, img)
            syncState()
          }
          reader.readAsDataURL(imageFile)
          return
        }

        const text = clip.getData("text/plain")
        if (!text) return

        const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

        const urlPattern = /^https?:\/\/\S+$/
        if (urlPattern.test(text.trim())) {
          e.preventDefault()
          const url = text.trim()
          let hostname = ""
          try { hostname = new URL(url).hostname.replace(/^www\./, "") } catch { hostname = url.slice(0, 40) }
          const path = esc(url.replace(/^https?:\/\/(www\.)?[^/]+/, "").slice(0, 80) || "/")
          const favicon = `https://www.google.com/s2/favicons?domain=${esc(hostname)}&sz=32`
          const card = `<a href="${esc(url)}" target="_blank" rel="noopener" contenteditable="false" style="display:flex;align-items:center;gap:10px;padding:10px 14px;margin:8px 0;border:1px solid rgba(0,0,0,0.12);border-radius:8px;text-decoration:none;cursor:pointer;background:rgba(0,0,0,0.02);max-width:100%;overflow:hidden;"><img src="${favicon}" width="20" height="20" style="border-radius:4px;flex-shrink:0;" /><span style="display:flex;flex-direction:column;gap:1px;min-width:0;"><span style="font-size:13px;font-weight:600;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:system-ui,sans-serif;">${esc(hostname)}</span><span style="font-size:11px;color:#71717a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:system-ui,sans-serif;">${path}</span></span></a>`
          document.execCommand("insertHTML", false, card)
          syncState()
          return
        }

        const lines = text.split("\n")
        const codeScore = lines.length >= 3 && lines.filter(l =>
          /^\s{2,}\S/.test(l) || /[{};]$/.test(l.trim()) || /^(import|export|const|let|var|function|class|def|if|for|while|return)\b/.test(l.trim())
        ).length > lines.length * 0.4
        if (codeScore) {
          e.preventDefault()
          const code = `<pre style="background:rgba(0,0,0,0.05);border-radius:6px;padding:12px 16px;font-family:'SF Mono',Monaco,Consolas,monospace;font-size:13px;line-height:1.5;overflow-x:auto;margin:8px 0;white-space:pre-wrap;tab-size:2;color:#1a1a1a;"><code>${esc(text)}</code></pre>`
          document.execCommand("insertHTML", false, code)
          syncState()
          return
        }

        e.preventDefault()
        const plain = `<span style="color:${inkColor};">${esc(text).replace(/\n/g, "<br>")}</span>`
        document.execCommand("insertHTML", false, plain)
        syncState()
      }}
      onMouseDown={e => e.stopPropagation()}
      onFocus={() => { onFocus() }}
      onBlur={() => {
        clearTimeout(timerRef.current)
        syncState()
      }}
      style={{
        width: "100%", outline: "none",
        height: isSticky || sizeLocked ? "100%" : undefined,
        minHeight: isSticky || sizeLocked ? undefined : 32,
        fontFamily: resolvedFont, fontSize: resolvedSize, fontWeight: 400,
        lineHeight: 1.45, color: inkColor, cursor: "text", caretColor: isDarkPaper(paperStyle) ? "#e4e4e7" : "#18181b",
        letterSpacing: "0.1px",
        fontStyle: isMarginStyle ? "italic" : "normal",
        transform: isMarginStyle ? "rotate(-0.5deg) skewX(-0.8deg)" : undefined,
        transformOrigin: "top left",
        WebkitFontSmoothing: isMarginStyle ? ("antialiased" as any) : undefined,
        textAlign: (textAlign || "left") as any, wordWrap: "break-word",
        overflow: isSticky ? "hidden" : "visible",
        backgroundColor: "transparent",
        filter: handwrittenEffect ? "url(#handwritten-jitter)" : "none",
      }}
    />
  )
})

export default function NoteApp() {
  const notes = useNotesStore(s => s.notes)
  const setNotes = useNotesStore(s => s.setNotes)
  const folders = useNotesStore(s => s.folders)
  const setFolders = useNotesStore(s => s.setFolders)
  const activeTabId = useNotesStore(s => s.activeTabId)
  const setActiveTabId = useNotesStore(s => s.setActiveTabId)
  const currentPageIdx = useNotesStore(s => s.currentPageIdx)
  const setCurrentPageIdx = useNotesStore(s => s.setCurrentPageIdx)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [dialog, setDialog] = useState<DialogConfig | null>(null)

  const notesRef = useRef(notes)
  const initialNotesRef = useRef(notes)
  const activeTabIdRef = useRef(activeTabId)
  useEffect(() => { notesRef.current = notes }, [notes])
  useEffect(() => { activeTabIdRef.current = activeTabId }, [activeTabId])

  // UI state
  const [zoom, setZoom] = useState("0.85")
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === "undefined") return 0
    const saved = localStorage.getItem("pulp-sidebar-width")
    if (saved === null) return 0
    const val = Number(saved)
    return val > 0 && val < 240 ? 240 : val
  })
  const [isSidebarDragging, setIsSidebarDragging] = useState(false)
  const sidebarDragRef = useRef<{ startX: number; startWidth: number } | null>(null)

  const fullscreenOpenRef = useRef(false)
  const startSidebarDrag = useCallback((startX: number) => {
    const startWidth = sidebarWidth
    const fs = fullscreenOpenRef.current
    sidebarDragRef.current = { startX, startWidth }
    setIsSidebarDragging(true)
    const onMove = (ev: MouseEvent) => {
      if (!sidebarDragRef.current) return
      const dx = ev.clientX - sidebarDragRef.current.startX
      const raw = sidebarDragRef.current.startWidth + dx
      const min = fs ? 240 : 0
      setSidebarWidth(raw < 200 ? min : Math.min(400, Math.max(240, raw)))
    }
    const onUp = (ev: MouseEvent) => {
      sidebarDragRef.current = null
      setIsSidebarDragging(false)
      const dx = Math.abs(ev.clientX - startX)
      if (dx < 5) {
        setSidebarWidth(prev => prev > 0 && !fs ? 0 : 240)
      } else {
        setSidebarWidth(w => w < 200 ? (fs ? 240 : 0) : Math.max(240, w))
      }
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }, [sidebarWidth])
  const [gridView, setGridView] = useState(false)
  const [carouselIdx, setCarouselIdx] = useState(0)
  const [bindingCompact, setBindingCompact] = useState(false)
  const [renamingFolder, setRenamingFolder] = useState<number | null>(null)
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null)
  const [sketchMode, setSketchMode] = useState(false)
  const [sketchPrompt, setSketchPrompt] = useState("")
  const [drawLineMode, setDrawLineMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showDrawToolbar, setShowDrawToolbar] = useState(false)
  const [showCoverModal, setShowCoverModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const sap = useGroveStore(s => s.sap)
  const setSap = useGroveStore(s => s.setSap)
  const essence = useGroveStore(s => s.essence)
  const setEssence = useGroveStore(s => s.setEssence)
  const xp = 0
  const goalStreak = useGroveStore(s => s.goalStreak)
  const setGoalStreak = useGroveStore(s => s.setGoalStreak)
  const goalStreakLastDate = useGroveStore(s => s.goalStreakLastDate)
  const setGoalStreakLastDate = useGroveStore(s => s.setGoalStreakLastDate)
  const dailyGoalMinutes = useGroveStore(s => s.dailyGoalMinutes)
  const setDailyGoalMinutes = useGroveStore(s => s.setDailyGoalMinutes)
  const quotaTier = useGroveStore(s => s.quotaTier)
  const setQuotaTier = useGroveStore(s => s.setQuotaTier)
  const quotaLockedUntil = useGroveStore(s => s.quotaLockedUntil)
  const setQuotaLockedUntil = useGroveStore(s => s.setQuotaLockedUntil)
  const streakNudgeDismissed = useGroveStore(s => s.streakNudgeDismissed)
  const setStreakNudgeDismissed = useGroveStore(s => s.setStreakNudgeDismissed)
  const hibernation = useGroveStore(s => s.hibernation)
  const setHibernation = useGroveStore(s => s.setHibernation)
  const hibernationScheduled = useGroveStore(s => s.hibernationScheduled)
  const setHibernationScheduled = useGroveStore(s => s.setHibernationScheduled)
  const unlockedCosmetics = useGroveStore(s => s.unlockedCosmetics)
  const setUnlockedCosmetics = useGroveStore(s => s.setUnlockedCosmetics)
  const [timerOpen, setTimerOpen] = useState(false)
  const [allCompacted, setAllCompacted] = useState(false)
  const [toolbarFormattingOpen, setToolbarFormattingOpen] = useState(false)
  const [toolbarAiOpen, setToolbarAiOpen] = useState(false)
  const [aiResult, setAiResult] = useState<{ title: string; result: string; loading: boolean; prompt?: string } | null>(null)
  const [quizState, setQuizState] = useState<{ questions: { q: string; a: string }[]; current: number; revealed: boolean; loading: boolean } | null>(null)
  const [currentView, setCurrentView] = useState<"editor" | "shelf">("editor")
  const unlockedVaults = useRef<Set<string>>(new Set())
  const grove = useGroveStore(s => s.grove)
  const setGrove = useGroveStore(s => s.setGrove)
  const inventory = useGroveStore(s => s.inventory)
  const setInventory = useGroveStore(s => s.setInventory)
  const [orchardOpen, setOrchardOpen] = useState(false)
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const [shopInitialTab, setShopInitialTab] = useState<'shop' | 'satchel' | 'catalog'>('shop')
  const [shopScrollTo, setShopScrollTo] = useState<string | undefined>(undefined)
  const [statsOpen, setStatsOpen] = useState(false)
  fullscreenOpenRef.current = orchardOpen || shopOpen || statsOpen || leaderboardOpen
  const closeAllPanels = useCallback(() => { setOrchardOpen(false); setLeaderboardOpen(false); setShopOpen(false); setStatsOpen(false); setShowSettings(false) }, [])

  useEffect(() => {
    _preloadDashboard(); _preloadStats()
    const id = requestIdleCallback(() => {
      _preloadOrchard(); _preloadBoutique(); _preloadLeaderboard()
      _preloadSettings()
      _preloadGrid()
      _preloadShelf(); _preloadImageUpload(); _preloadCover()
    }, { timeout: 3000 })
    return () => cancelIdleCallback(id)
  }, [])

  useEffect(() => {
    if (!orchardOpen) return
    const vp = document.querySelector('meta[name="viewport"]')
    if (!vp) return
    const orig = vp.getAttribute('content') || 'width=device-width, initial-scale=1'
    vp.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    return () => { vp.setAttribute('content', orig) }
  }, [orchardOpen])
  const achievements = useGroveStore(s => s.achievements)
  const setAchievements = useGroveStore(s => s.setAchievements)
  const lastCharCount = useGroveStore(s => s.lastCharCount)
  const setLastCharCount = useGroveStore(s => s.setLastCharCount)

  // Refs to allow Page to communicate achievement events to VitalitySystem
  const checkAchievementRef = useRef<((id: string, update?: (a: Achievement) => Partial<Achievement>) => void) | null>(null)
  const claimAchievementRef = useRef<((id: string) => void) | null>(null)

  const checkAchievement = useCallback((id: string, update?: (a: Achievement) => Partial<Achievement>) => {
    checkAchievementRef.current?.(id, update)
  }, [])
  const claimAchievement = useCallback((id: string) => {
    claimAchievementRef.current?.(id)
  }, [])

  // Earn Gems via writing
  const totalChars = useMemo(() => {
    const activeNote = notes.find(n => n.id === activeTabId)
    if (!activeNote) return 0
    return Object.values(activeNote.boxes).flat().reduce((acc, b) => acc + (b.content ? b.content.length : 0), 0)
  }, [notes, activeTabId])


  // Restore Grove from localStorage (immediate) — Supabase load happens in user effect below
  useEffect(() => {
    const hour = new Date().getHours()
    const isNightOwl = hour === 3

    const applyTimeChecks = (list: Achievement[]) =>
      list.map((a: Achievement) => {
        if (a.completed) return a
        if (a.id === 'night_owl' && isNightOwl) return { ...a, completed: true }
        return a
      })

    const saved = localStorage.getItem('pulp-grove')
    if (saved) {
      let data: any; try { data = JSON.parse(saved) } catch { return }
      setSap(data.juice ?? data.sunshine ?? 0)
      if (data.essence != null) setEssence(data.essence)
      if (data.goalStreak != null) setGoalStreak(data.goalStreak)
      if (data.goalStreakLastDate) setGoalStreakLastDate(data.goalStreakLastDate)
      if (data.dailyGoalMinutes) setDailyGoalMinutes(data.dailyGoalMinutes)
      if (data.quotaTier) setQuotaTier(data.quotaTier)
      if (data.quotaLockedUntil) setQuotaLockedUntil(data.quotaLockedUntil)
      if (data.inventory) setInventory([...data.inventory])
      if (data.grove) {
        setGrove([...data.grove])
      }
      if (data.hibernation) setHibernation(data.hibernation)
      if (data.hibernationScheduled) setHibernationScheduled(data.hibernationScheduled)
      if (data.unlockedCosmetics) setUnlockedCosmetics(data.unlockedCosmetics)
      if (data.lastCharCount) setLastCharCount(data.lastCharCount)
      if (data.achievements) {
        setAchievements(applyTimeChecks(data.achievements))
      } else {
        setAchievements(prev => applyTimeChecks(prev))
      }
    } else {
      setAchievements(prev => applyTimeChecks(prev))
    }
  }, [])

  // Hibernation: activate scheduled hibernation, expire active hibernation
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    if (hibernationScheduled && today >= hibernationScheduled.startDate && !hibernation) {
      setHibernation({ startDate: hibernationScheduled.startDate, endDate: hibernationScheduled.endDate, streakFrozen: goalStreak })
      setHibernationScheduled(null)
    }
    if (hibernation && today > hibernation.endDate) {
      setGoalStreak(hibernation.streakFrozen)
      setGoalStreakLastDate(hibernation.endDate)
      const saved = localStorage.getItem('pulp-grove')
      if (saved) {
        try {
          const data = JSON.parse(saved)
          data.lastHibernationEnd = hibernation.endDate
          localStorage.setItem('pulp-grove', JSON.stringify(data))
        } catch {}
      }
      setHibernation(null)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isHibernating = !!hibernation
  const hibernationCooldownEnd = (() => {
    if (typeof window === 'undefined') return null
    if (!hibernation) {
      const saved = localStorage.getItem('pulp-grove')
      if (saved) {
        try {
          const data = JSON.parse(saved)
          if (data.lastHibernationEnd) {
            const end = new Date(data.lastHibernationEnd)
            end.setDate(end.getDate() + 14)
            return end.toISOString().split('T')[0]
          }
        } catch {}
      }
    }
    return null
  })()

  const scheduleHibernation = useCallback((startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.round((end.getTime() - start.getTime()) / 86400000)
    if (days < 4 || days > 90) return
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (start < new Date(tomorrow.toISOString().split('T')[0])) return
    if (hibernationCooldownEnd && startDate < hibernationCooldownEnd) return
    setHibernationScheduled({ startDate, endDate })
  }, [hibernationCooldownEnd])

  // DEV: inject flag — actual injection happens after Supabase load
  const devTreesInjectedRef = useRef(false)

  // Load player data from Supabase when user is available
  useEffect(() => {
    if (!user) return
    const loadPlayerData = async () => {
      const [profile, achievementRows] = await Promise.all([
        db.getPlayerProfile(user.id),
        db.getAchievements(user.id),
      ])

      if (profile) {
        setSap(profile.juice)
        setLastCharCount(profile.last_char_count)
        if (profile.grove?.length) {
          setGrove([...profile.grove])
        }
        if (profile.inventory) {
          const items: string[] = []
          for (const [k, qty] of Object.entries(profile.inventory)) for (let i = 0; i < qty; i++) items.push(k)
          if (items.length) setInventory(items)
        }
        if (profile.unlocked_cosmetics?.length) setUnlockedCosmetics(profile.unlocked_cosmetics)
      } else {
        // First time — create profile from localStorage state, then migrate legacy
        const saved = localStorage.getItem('pulp-grove')
        const groveLocal = saved ? JSON.parse(saved) : null

        await db.upsertPlayerProfile(user.id, {
          gems: 0,
          juice: groveLocal?.juice ?? groveLocal?.sunshine ?? 0,
          last_char_count: groveLocal?.lastCharCount ?? 0,
        })
        // Migrate legacy user_settings blob
        await db.migrateFromLegacy(user.id)
      }

      if (achievementRows.length) {
        setAchievements(prev => prev.map(a => {
          const row = achievementRows.find(r => r.achievement_id === a.id)
          if (!row) return a
          return { ...a, progress: row.progress, completed: row.completed, claimed: row.completed }
        }))
      }

    }
    loadPlayerData()
  }, [user])

  // Settings
  const SETTINGS_DEFAULTS = {
    accent: "#d97706",
    theme: "dark",
    autoSave: true,
    spellCheck: true,
    autoCorrect: true,
    autoCapitalize: true,
    editorFont: "Georgia",
    headingFont: "Georgia",
    lineSpacing: "normal",
    paperStyle: "steno",
    showBinding: false,
    reduceMotion: false,
    reduceVisuals: false,
    sidebarOnStart: false,
    bgEffect: true,
    smearEffect: true,
    handwrittenEffect: true,
    language: "english",
    defaultSort: "modified",
    wordCountVisible: true,
    focusMode: false,
    baseFontSize: "medium",
    shortcuts: { ai: "ctrl+j", slash: "/", newNote: "ctrl+n", search: "ctrl+k", toggleSidebar: "ctrl+\\", aiCommand: "\\", timer: "ctrl+alt+t", prevPage: "alt+arrowleft", nextPage: "alt+arrowright", drawMode: "ctrl+d", cycleHeader: "alt+1" },
    blockedSites: [],
    blockedApps: [],
    orchardTimeMode: "theme",
    devMode: false,
    isDevUnlocked: false,
    scrollMode: true
  }
  const _savedSettingsRef = useRef<any>(undefined)
  if (_savedSettingsRef.current === undefined) {
    _savedSettingsRef.current = typeof window !== "undefined" ? (() => { try { const s = localStorage.getItem("pulp-settings"); return s ? JSON.parse(s) : null } catch { return null } })() : null
  }
  const [settings, setSettings] = useState<any>(() => _savedSettingsRef.current ? { ...SETTINGS_DEFAULTS, ..._savedSettingsRef.current } : SETTINGS_DEFAULTS)

  const updateSettings = useCallback((updates: any) => setSettings((prev: any) => {
    const merged = { ...prev }
    for (const key in updates) {
      if (updates[key] !== undefined) merged[key] = updates[key]
    }
    return merged
  }), [])

  const {
    accent, theme, autoSave, spellCheck, autoCorrect, autoCapitalize, editorFont, headingFont,
    lineSpacing, paperStyle, showBinding, reduceMotion, reduceVisuals, sidebarOnStart, bgEffect,
    smearEffect, handwrittenEffect, language, defaultSort, wordCountVisible, focusMode, baseFontSize,
    shortcuts, blockedSites, blockedApps, orchardTimeMode, devMode, isDevUnlocked, scrollMode
  } = settings

  const accentSolid = useMemo(() => accent.length > 7 ? accent.slice(0, 7) : accent, [accent])
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => Array.isArray(_savedSettingsRef.current?.bookmarks) ? _savedSettingsRef.current.bookmarks : [])
  const [trashNotes, setTrashNotes] = useState<NoteData[]>(() => Array.isArray(_savedSettingsRef.current?.trashNotes) ? _savedSettingsRef.current.trashNotes : [])
  const [skipDeleteConfirmation, setSkipDeleteConfirmation] = useState(() => typeof _savedSettingsRef.current?.skipDeleteConfirmation === "boolean" ? _savedSettingsRef.current.skipDeleteConfirmation : false)

  const [activeTool, setActiveTool] = useState('select')
  const [stickyColor, setStickyColor] = useState('#fef08a')
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [fillColor, setFillColor] = useState('transparent')
  const [lineWidth, setLineWidth] = useState(1)
  const [drawOpacity, setDrawOpacity] = useState(1)
  const [drawDash, setDrawDash] = useState(false)

  const setCover = useCallback((dataUrl: string) => {
    setNotes(ns => ns.map(n => n.id === activeTabId ? { ...n, cover: dataUrl } : n))
    setShowCoverModal(false)
  }, [activeTabId])

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const editorRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollPageRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const pendingImageBoxId = useRef<string | null>(null)
  const pendingTableBoxId = useRef<string | null>(null)

  const placeHorizontalLine = useCallback((e: React.MouseEvent) => {
    if (!paperRef.current || !activeTabId) return
    e.preventDefault()
    const r = paperRef.current.getBoundingClientRect()
    const scale = Number(zoom) || 1
    const y = (e.clientY - r.top) / scale
    const id = uid()
    const hrBox: TextBoxType = { id, x: 40, y, w: paperRef.current.clientWidth / scale - 80, h: 8, content: '<hr style="border:none;border-top:2px solid rgba(0,0,0,0.15);margin:0">' }
    setNotes(prev => prev.map(n => n.id !== activeTabId ? n : {
      ...n, boxes: { ...n.boxes, [currentPageIdx]: [...(n.boxes[currentPageIdx] || []), hrBox] }
    }))
    setActiveTool('select')
  }, [activeTabId, currentPageIdx, setNotes, zoom])

  const placeVerticalLine = useCallback((e: React.MouseEvent) => {
    if (!paperRef.current || !activeTabId) return
    e.preventDefault()
    const r = paperRef.current.getBoundingClientRect()
    const scale = Number(zoom) || 1
    const x = (e.clientX - r.left) / scale
    const y = (e.clientY - r.top) / scale
    const id = uid()
    const vrBox: TextBoxType = { id, x, y, w: 8, h: 300, sizeLocked: true, content: '<div style="width:2px;height:100%;background:rgba(0,0,0,0.15);margin:0 auto"></div>' }
    setNotes(prev => prev.map(n => n.id !== activeTabId ? n : {
      ...n, boxes: { ...n.boxes, [currentPageIdx]: [...(n.boxes[currentPageIdx] || []), vrBox] }
    }))
    setActiveTool('select')
  }, [activeTabId, currentPageIdx, setNotes, zoom])

  const placeImageBox = useCallback((e: React.MouseEvent) => {
    if (!paperRef.current || !activeTabId) return
    e.preventDefault()
    const r = paperRef.current.getBoundingClientRect()
    const scale = Number(zoom) || 1
    const x = (e.clientX - r.left) / scale
    const y = (e.clientY - r.top) / scale
    const id = uid()
    const imgBox: TextBoxType = { id, x: x - 150, y, w: 300, h: 200, content: '' }
    pendingImageBoxId.current = id
    setNotes(prev => prev.map(n => n.id !== activeTabId ? n : {
      ...n, boxes: { ...n.boxes, [currentPageIdx]: [...(n.boxes[currentPageIdx] || []), imgBox] }
    }))
    setActiveTool('select')
    setShowImageModal(true)
  }, [activeTabId, currentPageIdx, setNotes, zoom])

  const insertTableBox = useCallback((rows = 3, cols = 3) => {
    if (!paperRef.current || !activeTabId) return
    const scale = Number(zoom) || 1
    const paperW = paperRef.current.clientWidth / scale
    const scrollTop = paperRef.current.closest('.overflow-y-scroll')?.scrollTop ?? 0
    const w = Math.min(cols * 130, paperW - 80)
    const x = (paperW - w) / 2
    const y = scrollTop / scale + 100
    const id = uid()
    const mkRow = (cells: number, tag: string) => `<tr>${Array.from({ length: cells }, () => `<${tag} style="border:1.5px solid rgba(0,0,0,0.25);padding:6px 10px;font-size:13px;min-width:80px;outline:none;${tag === 'th' ? 'font-weight:600;' : ''}"><br></${tag}>`).join('')}</tr>`
    const tableHtml = `<table style="border-collapse:collapse;width:100%">${mkRow(cols, 'th')}${Array.from({ length: rows - 1 }, () => mkRow(cols, 'td')).join('')}</table>`
    const tableBox: TextBoxType = { id, x, y, w, h: rows * 40 + 20, content: tableHtml }
    setNotes(prev => prev.map(n => n.id !== activeTabId ? n : {
      ...n, boxes: { ...n.boxes, [currentPageIdx]: [...(n.boxes[currentPageIdx] || []), tableBox] }
    }))
  }, [activeTabId, currentPageIdx, setNotes, zoom])

  // ─── Sticky note placement — handled directly in page to avoid stale hook state ─
  const placeStickyNote = useCallback((e: React.MouseEvent) => {
    if (!paperRef.current || !activeTabId) return
    e.preventDefault()
    const r = paperRef.current.getBoundingClientRect()
    const scale = Number(zoom) || 1
    const x = (e.clientX - r.left) / scale
    const y = (e.clientY - r.top) / scale
    const id = uid()
    const rotation = parseFloat((Math.random() * 1.6 - 0.8).toFixed(1))
    const newBox: TextBoxType = {
      id,
      x: x - 100, y: y - 100, w: 200, h: 200,
      content: '',
      boxHighlightColor: stickyColor,
      boxFontFamily: 'cursive',
      boxFontSize: 16,
      boxOutlineWidth: 0,
      boxRotation: rotation,
    }
    setNotes(prev => prev.map(n => n.id !== activeTabId ? n : {
      ...n,
      boxes: { ...n.boxes, [currentPageIdx]: [...(n.boxes[currentPageIdx] || []), newBox] }
    }))
    setActiveTool('select')
    setTimeout(() => {
      const node = document.getElementById(`box-${id}`)
      if (node) {
        node.animate([
          { transform: `scale(0.6) rotate(${newBox.boxRotation}deg)`, opacity: 0 },
          { transform: `scale(1.08) rotate(${newBox.boxRotation}deg)`, opacity: 1, offset: 0.7 },
          { transform: `scale(1) rotate(${newBox.boxRotation}deg)`, opacity: 1 },
        ], { duration: 350, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' })
      }
    }, 0)
  }, [activeTabId, currentPageIdx, stickyColor, zoom, setNotes])

  const activeNote = useMemo(
    () => (notes.find(n => n.id === activeTabId) ?? notes.filter(n => !n.archived)[0]) as NoteData,
    [notes, activeTabId]
  )

  const wordCount = useMemo(() => {
    if (!activeNote) return 0
    let text = activeNote.pages[currentPageIdx] || ""
    const boxText = (activeNote.boxes[currentPageIdx] || []).map(b => htmlToPlain(b.content)).join(" ")
    text = htmlToPlain(text) + " " + boxText
    return text.split(/\s+/).filter(Boolean).length
  }, [activeNote, currentPageIdx])

  // Dialog helpers
  const openPrompt = useCallback((title: string, defaultValue: string, placeholder: string, confirmLabel: string, onConfirm: (v: string) => void, icon?: string) => setDialog({ type: "prompt", title, defaultValue, placeholder, confirmLabel, onConfirm, icon }), [])
  const openConfirm = useCallback((title: string, message: string, onConfirm: (checked?: boolean) => void, confirmLabel?: string, danger?: boolean, showCheckbox?: boolean, checkboxLabel?: string) => setDialog({ type: "confirm", title, message, onConfirm, confirmLabel, danger, showCheckbox, checkboxLabel }), [])
  const openAlert = useCallback((title: string, message?: string) => setDialog({ type: "alert", title, message }), [])

  // Hooks
  const editor = useEditor({ editorRef, activeTabId, currentPageIdx, setNotes, accent })
  const drawingRef = useRef<{ undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean }>({ undo: () => { }, redo: () => { }, canUndo: false, canRedo: false })
  const boxes = useBoxDrawing({
    activeTabId, currentPageIdx, zoom, accent, notes, setNotes, paperRef,
    sketchMode, sketchPrompt, setSketchMode, setSketchPrompt,
    drawLineMode, setDrawLineMode, activeTool, setActiveTool, stickyColor,
    onError: openAlert,
    drawingUndo: () => drawingRef.current.undo(), drawingRedo: () => drawingRef.current.redo(),
    drawingCanUndo: drawingRef.current.canUndo, drawingCanRedo: drawingRef.current.canRedo
  })
  const drawing = useDrawing({ canvasRef, activeTool, accent, zoom, currentPageIdx, setNotes, activeTabId, notes, strokeColor, fillColor, lineWidth, opacity: drawOpacity, dash: drawDash })
  drawingRef.current = drawing
  const versionHistory = useVersionHistory(notes, activeTabId)

  // Slash (@ and /) menu
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [aiMenu, setAiMenu] = useState<{ x: number; y: number; selectedText?: string; initialPrompt?: string } | null>(null)
  const [showAiCommandBar, setShowAiCommandBar] = useState(false)
  const [showNotebookChat, setShowNotebookChat] = useState(false)
  const [aiHubOpen, setAiHubOpen] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [aiExpression, setAiExpression] = useState<"normal" | "wink" | "sleepy" | "heart" | "surprised">("normal")
  const [isTextActive, setIsTextActive] = useState(false)
  const slashMenuRef = useRef<{ x: number; y: number; filter: string; type: "editor" | "textarea"; mode: "@" | "/"; target?: HTMLElement; isSelectionMode?: boolean } | null>(null)
  const slashAnchorRef = useRef<{ node: Node; offset: number } | null>(null)
  const slashFilterSpanRef = useRef<HTMLSpanElement | null>(null)

  const dismissSlashMenu = useCallback((deleteAtSign: boolean) => {
    const m = slashMenuRef.current
    const anchor = slashAnchorRef.current
    if (slashFilterSpanRef.current) {
      slashFilterSpanRef.current.remove()
      slashFilterSpanRef.current = null
    }
    if (deleteAtSign && m?.mode === "@" && anchor && !m?.isSelectionMode) {
      try {
        const textNode = anchor.node as Text
        if (textNode.nodeType === Node.TEXT_NODE && textNode.isConnected) {
          const filter = m.filter ?? ""
          const end = m.type === "editor"
            ? Math.min(anchor.offset + 1 + filter.length, textNode.length)
            : Math.min(anchor.offset + 1, textNode.length)
          const r = document.createRange()
          r.setStart(textNode, anchor.offset)
          r.setEnd(textNode, end)
          const sel = window.getSelection()
          sel?.removeAllRanges()
          sel?.addRange(r)
          document.execCommand("delete")
        }
      } catch { /* node may have been detached */ }
    }
    slashMenuRef.current = null
    slashAnchorRef.current = null
    setSlashMenu(null)
  }, [])
  const closeSlashMenu = useCallback(() => dismissSlashMenu(false), [dismissSlashMenu])

  useEffect(() => {
    const handleBlur = () => {
      if (slashMenuRef.current) dismissSlashMenu(true)
    }
    window.addEventListener("blur", handleBlur)
    return () => {
      window.removeEventListener("blur", handleBlur)
      if (slashFilterSpanRef.current) {
        slashFilterSpanRef.current.remove()
        slashFilterSpanRef.current = null
      }
    }
  }, [dismissSlashMenu])

  useEffect(() => {
    const update = () => {
      const el = document.activeElement as HTMLElement | null
      const inEditor = el === editorRef.current
      const inBox = !!el?.closest?.('[id^="box-"]')?.querySelector('[contenteditable="true"]')
      const hasSelectedBoxes = boxes.selectedBoxIdsRef.current.size > 0
      setIsTextActive(inEditor || inBox || hasSelectedBoxes)
    }
    update()
    document.addEventListener("focusin", update)
    document.addEventListener("focusout", update)
    document.addEventListener("mouseup", update)
    return () => {
      document.removeEventListener("focusin", update)
      document.removeEventListener("focusout", update)
      document.removeEventListener("mouseup", update)
    }
  }, [boxes.selectedBoxIdsRef, boxes.selectionVersion])

  const handleQuickPrompt = useCallback(async (prompt: string, buttonRect: DOMRect) => {
    const selectedIds = Array.from(boxes.selectedBoxIdsRef.current)
    const sel = window.getSelection()
    const highlightedText = sel && !sel.isCollapsed ? sel.toString().trim() : ""

    const getBoxContent = (id: string): string => {
      const el = document.getElementById(`box-${id}`)
      const contentEl = el?.querySelector('[contenteditable="true"]') as HTMLElement | null
      return contentEl?.innerText?.trim() || ""
    }

    const isInEditor = document.activeElement === editorRef.current
    let targetBoxIds: string[] = []
    let contextText = ""
    let targetText = ""

    if (isInEditor) {
      const fullText = editorRef.current?.innerText?.trim() || ""
      if (highlightedText) {
        targetText = highlightedText
        contextText = fullText
      } else {
        targetText = fullText
      }
    } else if (selectedIds.length > 0) {
      const boxTexts = selectedIds.map(id => ({ id, text: getBoxContent(id) })).filter(b => b.text)
      targetBoxIds = boxTexts.map(b => b.id)
      const allText = boxTexts.map(b => b.text).join("\n\n")
      if (highlightedText) {
        targetText = highlightedText
        contextText = allText
      } else {
        targetText = allText
      }
    } else {
      return
    }

    if (!targetText) {
      openAlert("Nothing to work with", "Write or select some text first.")
      return
    }

    try {
      const apiText = contextText
        ? `[HIGHLIGHTED TEXT TO MODIFY]:\n${targetText}\n\n[SURROUNDING CONTEXT - do not modify, use for understanding only]:\n${contextText}`
        : targetText

      const response = await apiFetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, text: apiText })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || `Request failed with status ${response.status}`)
      const result = data.result || ""
      if (!result) throw new Error("No response from AI")

      if (isInEditor) {
        if (highlightedText) {
          editor.restoreSelection()
          editor.execCmd("insertText", result)
        } else {
          editorRef.current!.innerText = ""
          editor.insertHTML(result)
        }
        editor.syncContent()
      } else if (targetBoxIds.length === 1 && highlightedText) {
        editor.restoreSelection()
        editor.execCmd("insertText", result)
        const boxEl = document.getElementById(`box-${targetBoxIds[0]}`)
        const contentEl = boxEl?.querySelector('[contenteditable="true"]') as HTMLElement | null
        if (contentEl) {
          boxes.updateBoxContent(targetBoxIds[0], contentEl.innerHTML)
          requestAnimationFrame(() => {
            const fitH = contentEl.scrollHeight + 32
            boxes.updateBox(targetBoxIds[0], { h: fitH })
          })
        }
      } else if (targetBoxIds.length > 0) {
        const lines = result.split(/\n{2,}/)
        targetBoxIds.forEach((id, i) => {
          const boxEl = document.getElementById(`box-${id}`)
          const contentEl = boxEl?.querySelector('[contenteditable="true"]') as HTMLElement | null
          if (contentEl) {
            const newContent = lines[i] !== undefined ? lines[i] : (lines.length === 1 ? result : "")
            contentEl.innerText = newContent
            boxes.updateBoxContent(id, contentEl.innerHTML)
            requestAnimationFrame(() => {
              const fitH = contentEl.scrollHeight + 32
              boxes.updateBox(id, { h: fitH })
            })
          }
        })
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error"
      console.error("AI error:", errorMsg)
      openAlert("AI Error", errorMsg)
    }
  }, [boxes, editor, openAlert])

  const handleCompactAll = useCallback(() => {
    const allDetails = Array.from(
      document.querySelectorAll('details.toggle-block')
    ) as HTMLDetailsElement[]
    if (allDetails.length === 0) {
      openAlert("No toggles", "There are no toggle blocks on this page.")
      return
    }
    const anyOpen = allDetails.some(d => d.open)
    allDetails.forEach(d => { d.open = !anyOpen })
    setAllCompacted(anyOpen)
    editor.syncContent()
  }, [editor, openAlert])


  const executeSlashItem = useCallback((action: () => void) => {
    const m = slashMenuRef.current
    const anchor = slashAnchorRef.current
    const filter = m?.filter ?? ""

    if (!m?.isSelectionMode && m?.mode === "@") {
      if (m?.type === "textarea" && anchor) {
        try {
          const textNode = anchor.node as Text
          if (textNode.nodeType === Node.TEXT_NODE) {
            const r = document.createRange()
            r.setStart(textNode, anchor.offset)
            if (slashFilterSpanRef.current?.isConnected) {
              r.setEndAfter(slashFilterSpanRef.current)
            } else {
              r.setEnd(textNode, Math.min(anchor.offset + 1, textNode.length))
            }
            const sel = window.getSelection()
            sel?.removeAllRanges()
            sel?.addRange(r)
            document.execCommand("delete")
            slashFilterSpanRef.current = null
          }
        } catch { }
      } else if (m?.type === "editor" && anchor) {
        try {
          const textNode = anchor.node as Text
          const endOffset = Math.min(anchor.offset + 1 + filter.length, textNode.length)
          const r = document.createRange()
          r.setStart(textNode, anchor.offset)
          r.setEnd(textNode, endOffset)
          const sel = window.getSelection()
          sel?.removeAllRanges()
          sel?.addRange(r)
          document.execCommand("delete")
        } catch { }
      }
    }

    closeSlashMenu()
    if (m?.type === "editor") editorRef.current?.focus()
    else if (m?.target) m.target.focus()

    editor.saveSelection()
    action()
  }, [closeSlashMenu, editorRef, editor])

  const handleEditorKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    // "/" mode: no anchor character in DOM, filter fully managed here (both editor and box)
    if (slashMenuRef.current?.mode === "/" && !slashMenuRef.current?.isSelectionMode) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End") {
        closeSlashMenu()
      } else if (e.key === "Backspace") {
        e.preventDefault()
        const f = slashMenuRef.current.filter ?? ""
        if (f.length > 0) {
          const newFilter = f.slice(0, -1)
          const updated = { ...slashMenuRef.current, filter: newFilter }
          slashMenuRef.current = updated
          setSlashMenu(updated)
        } else {
          closeSlashMenu()
        }
        return
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        const newFilter = (slashMenuRef.current.filter ?? "") + e.key
        const updated = { ...slashMenuRef.current, filter: newFilter }
        slashMenuRef.current = updated
        setSlashMenu(updated)
        return
      }
    }
    if (slashMenuRef.current?.mode === "@" && !slashMenuRef.current?.isSelectionMode) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End") {
        closeSlashMenu()
      } else if (e.key === "Backspace") {
        e.preventDefault()
        const f = slashMenuRef.current.filter ?? ""
        if (f.length > 0) {
          const newFilter = f.slice(0, -1)
          if (slashMenuRef.current.type === "textarea" && slashFilterSpanRef.current) {
            if (newFilter === "") {
              slashFilterSpanRef.current.remove()
              slashFilterSpanRef.current = null
            } else {
              slashFilterSpanRef.current.textContent = newFilter
            }
          } else if (slashMenuRef.current.type === "editor") {
            const anchor = slashAnchorRef.current
            if (anchor && anchor.node.nodeType === Node.TEXT_NODE) {
              const textNode = anchor.node as Text
              const delPos = anchor.offset + 1 + f.length - 1
              if (delPos < textNode.length) {
                const r = document.createRange()
                r.setStart(textNode, delPos)
                r.setEnd(textNode, delPos + 1)
                const sel = window.getSelection()
                sel?.removeAllRanges()
                sel?.addRange(r)
                document.execCommand("delete")
              }
            }
          }
          const updated = { ...slashMenuRef.current, filter: newFilter }
          slashMenuRef.current = updated
          setSlashMenu(updated)
        } else {
          const anchor = slashAnchorRef.current
          if (anchor && anchor.node.nodeType === Node.TEXT_NODE) {
            const textNode = anchor.node as Text
            if (anchor.offset <= textNode.length) {
              const r = document.createRange()
              r.setStart(textNode, anchor.offset)
              r.setEnd(textNode, Math.min(anchor.offset + 1, textNode.length))
              const sel = window.getSelection()
              sel?.removeAllRanges()
              sel?.addRange(r)
              document.execCommand("delete")
            }
          }
          dismissSlashMenu(false)
        }
        return
      } else if (e.key === " ") {
        dismissSlashMenu(false)
        return
      } else if (e.key === "Enter") {
        dismissSlashMenu(false)
        return
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        const newFilter = (slashMenuRef.current.filter ?? "") + e.key
        if (slashMenuRef.current.type === "textarea") {
          if (!slashFilterSpanRef.current) {
            const anchor = slashAnchorRef.current
            if (anchor && anchor.node.nodeType === Node.TEXT_NODE) {
              const textNode = anchor.node as Text
              const span = document.createElement("span")
              span.setAttribute("contenteditable", "false")
              span.setAttribute("data-slash-ghost", "1")
              span.style.cssText = "color:rgba(0,0,0,0.32);pointer-events:none;"
              slashFilterSpanRef.current = span
              const r = document.createRange()
              r.setStart(textNode, Math.min(anchor.offset + 1, textNode.length))
              r.collapse(true)
              r.insertNode(span)
              const s = window.getSelection()
              const after = document.createRange()
              after.setStartAfter(span)
              after.collapse(true)
              s?.removeAllRanges()
              s?.addRange(after)
            }
          }
          if (slashFilterSpanRef.current) slashFilterSpanRef.current.textContent = newFilter
        } else {
          const anchor = slashAnchorRef.current
          if (anchor && anchor.node.nodeType === Node.TEXT_NODE) {
            const textNode = anchor.node as Text
            const insertPos = anchor.offset + 1 + (slashMenuRef.current.filter ?? "").length
            textNode.insertData(Math.min(insertPos, textNode.length), e.key)
            const r = document.createRange()
            r.setStart(textNode, Math.min(insertPos + 1, textNode.length))
            r.collapse(true)
            const sel = window.getSelection()
            sel?.removeAllRanges()
            sel?.addRange(r)
          }
        }
        const updated = { ...slashMenuRef.current, filter: newFilter }
        slashMenuRef.current = updated
        setSlashMenu(updated)
        return
      }
    }

    editor.handleEditorKeyDown(e)

    if (e.key === "Escape") {
      if (slashMenuRef.current) {
        dismissSlashMenu(true)
        e.preventDefault()
        return
      }
      const ce = e.currentTarget as HTMLElement
      const isBox = ce !== editorRef.current
      if (isBox) {
        e.preventDefault()
        const isFocused = document.activeElement === ce || ce.contains(document.activeElement)
        if (isFocused) {
          ce.blur()
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
          const boxId = ce.closest('[id^="box-"]')?.id?.replace('box-', '')
          if (boxId) boxes.setSelectedBoxIds(new Set([boxId]))
        } else {
          boxes.setSelectedBoxIds(new Set())
        }
      } else if (boxes.selectedBoxIdsRef.current.size > 0) {
        e.preventDefault()
        boxes.setSelectedBoxIds(new Set())
      }
      return
    }

    if (e.key === "Enter" && e.shiftKey) {
      const ce = e.currentTarget as HTMLElement
      const boxEl = ce.closest('[id^="box-"]') as HTMLElement | null
      if (boxEl && activeNote) {
        const boxId = boxEl.id.replace('box-', '')
        const currentBox = activeNote.boxes[currentPageIdx]?.find((b: any) => b.id === boxId)
        if (currentBox) {
          e.preventDefault()
          ce.blur()
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
          const el = document.getElementById(`box-${boxId}`)
          const actualH = el ? el.getBoundingClientRect().height / (Number(zoom) || 1) : currentBox.h
          const newId = uid()
          const newBox = { id: newId, x: currentBox.x, y: currentBox.y + actualH + 8, w: currentBox.w, h: 32, content: '' }
          flushSync(() => {
            setNotes(prev => prev.map(n => n.id !== activeTabId ? n : {
              ...n,
              boxes: { ...n.boxes, [currentPageIdx]: [...(n.boxes[currentPageIdx] || []), newBox] }
            }))
            boxes.setSelectedBoxIds(new Set([newId]))
          })
          const newEl = document.getElementById(`box-${newId}`)
          const editable = newEl?.querySelector('[contenteditable]') as HTMLElement | null
          if (editable) editable.focus()
          return
        }
      }
    }

    const isMeta = e.metaKey || e.ctrlKey
    const isAlt = e.altKey
    const isShift = e.shiftKey
    const modParts: string[] = []
    if (isMeta) modParts.push("ctrl")
    if (isAlt) modParts.push("alt")
    if (isShift) modParts.push("shift")
    if (e.key && !["Meta", "Control", "Alt", "Shift", "Escape"].includes(e.key)) {
      modParts.push(e.key.toLowerCase())
    }
    const eventKeyStr = modParts.join("+")
    const isCycleHeader = eventKeyStr === shortcuts.cycleHeader || (e.altKey && e.code === "Digit1")

    if (isCycleHeader) {
      e.preventDefault()
      const selectedIds = Array.from(boxes.selectedBoxIdsRef.current)
      if (selectedIds.length > 0) {
        const styles = ["default", "h1", "h2", "h3", "margin"]
        selectedIds.forEach(id => {
          const box = activeNote.boxes[currentPageIdx].find(b => b.id === id)
          if (box) {
            const currentStyle = box.boxHeadingStyle || "default"
            const currentIndex = styles.indexOf(currentStyle)
            const nextStyle = styles[(currentIndex + 1) % styles.length]
            boxes.updateBox(id, { boxHeadingStyle: nextStyle as any, boxFontSize: undefined })
          }
        })
      }
      return
    }

    if (eventKeyStr === shortcuts.ai && (isMeta || isAlt)) {
      e.preventDefault()
      const sel = window.getSelection()
      const selectedText = sel && !sel.isCollapsed ? sel.toString().trim() : undefined
      let x = 200, y = 200
      if (sel && sel.rangeCount > 0) {
        let rect = sel.getRangeAt(0).getBoundingClientRect()
        // If it's a collapsed selection, getBoundingClientRect might have 0 width/height giving wrong pos
        if (rect.x === 0 && rect.y === 0) {
          const span = document.createElement("span")
          span.textContent = "\u200b"
          sel.getRangeAt(0).insertNode(span)
          rect = span.getBoundingClientRect()
          span.parentNode?.removeChild(span)
        }
        x = rect.left
        y = rect.top - 12 // open a bit higher so it's clearly above the line
      }
      setAiMenu({ x, y, selectedText })
      return
    }

    if (e.key === shortcuts.slash || e.key === "@") {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) return
      const isBox = (e.currentTarget as HTMLElement) !== editorRef.current
      const isSelectionMode = !sel.isCollapsed
      const menuMode = e.key === "@" ? ("@" as const) : ("/" as const)

      // Only trigger if at start of line or after space (for non-selection mode)
      if (!isSelectionMode) {
        const range = sel.getRangeAt(0)
        const startContainer = range.startContainer
        const startOffset = range.startOffset
        let textBefore = ""
        if (startContainer.nodeType === Node.TEXT_NODE) {
          textBefore = startContainer.textContent?.substring(0, startOffset) || ""
        }
        const isStartOfWord = textBefore === "" || /\s$/.test(textBefore)

        // If not start of word, just let it type the character
        if (!isStartOfWord) return
      }

      // For boxes: store cursor position before any DOM changes
      if (isBox) {
        const r = sel.getRangeAt(0)
        slashAnchorRef.current = {
          node: r.startContainer,
          offset: r.startContainer.nodeType === Node.TEXT_NODE ? r.startOffset : -1,
        }
      }

      if (isSelectionMode) {
        e.preventDefault()
        const r = sel.getRangeAt(0)
        const rect = r.getBoundingClientRect()
        const m = {
          x: rect.right - 20,
          y: rect.bottom + 14,
          filter: "",
          type: isBox ? ("textarea" as const) : ("editor" as const),
          mode: menuMode,
          target: e.currentTarget as HTMLElement,
          isSelectionMode: true
        }
        slashMenuRef.current = m
        setSlashMenu(m)
        return
      }

      e.preventDefault()

      if (menuMode === "@") {
        // Insert @ character at cursor position for reference mode
        const range = sel.getRangeAt(0)
        const textNode = range.startContainer.nodeType === Node.TEXT_NODE
          ? (range.startContainer as Text)
          : null

        if (textNode) {
          textNode.insertData(range.startOffset, "@")
          range.setStart(textNode, range.startOffset + 1)
          range.collapse(true)
          sel.removeAllRanges()
          sel.addRange(range)
          slashAnchorRef.current = { node: textNode, offset: range.startOffset - 1 }
        } else {
          const newText = document.createTextNode("@")
          range.insertNode(newText)
          range.setStart(newText, 1)
          range.collapse(true)
          sel.removeAllRanges()
          sel.addRange(range)
          slashAnchorRef.current = { node: newText, offset: 0 }
        }

        if ((e.currentTarget as HTMLElement) === editorRef.current) {
          editor.syncContent()
        }
      }

      // Measure menu position
      const clonedRange = sel.getRangeAt(0).cloneRange()
      clonedRange.collapse(true)
      const span = document.createElement("span")
      span.textContent = "\u200b"
      clonedRange.insertNode(span)
      const rect = span.getBoundingClientRect()
      span.parentNode?.removeChild(span)

      const m = {
        x: rect.left,
        y: rect.bottom + 14,
        filter: "",
        type: isBox ? ("textarea" as const) : ("editor" as const),
        mode: menuMode,
        target: e.currentTarget as HTMLElement
      }
      slashMenuRef.current = m
      setSlashMenu(m)
    }
  }, [editor.handleEditorKeyDown, closeSlashMenu, shortcuts, boxes, activeNote, currentPageIdx])

  const handleEditorInput = useCallback((e: React.FormEvent<HTMLElement>) => {
    if ((e.currentTarget as HTMLElement) === editorRef.current) {
      editor.syncContent()
    }

    if (!slashMenuRef.current) return

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) { closeSlashMenu(); return }
    const range = sel.getRangeAt(0)
    const node = range.startContainer

    // Box menu: filter chars are intercepted in keydown (not typed)
    if (slashMenuRef.current.type === "textarea") {
      // "/" mode: filter is fully managed by keydown intercept; ignore input events
      if (slashMenuRef.current.mode === "/") return
      // Ghost span exists: filter is managed via keydown intercept; ignore input events
      if (slashFilterSpanRef.current) return
      const anchor = slashAnchorRef.current
      if (!anchor) { closeSlashMenu(); return }
      if (node.nodeType === Node.TEXT_NODE) {
        const textNode = node as Text
        let anchorOffset: number
        if (anchor.node === node) {
          anchorOffset = anchor.offset
        } else if (anchor.offset === -1) {
          // Box was empty when @ was pressed; first text node just created
          anchorOffset = 0
          slashAnchorRef.current = { node: textNode, offset: 0 }
        } else {
          closeSlashMenu(); return
        }
        // +1 to skip the "@" character itself
        if (range.startOffset <= anchorOffset) { closeSlashMenu(); return }
        const filter = textNode.textContent?.slice(anchorOffset + 1, range.startOffset) ?? ""
        if (filter.includes(" ")) { closeSlashMenu(); return }
        const updated = { ...slashMenuRef.current, filter }
        slashMenuRef.current = updated
        setSlashMenu(updated)
      } else {
        closeSlashMenu()
      }
      return
    }

    // "/" mode in editor: no anchor character, filter managed by keydown
    if (slashMenuRef.current.mode === "/") return

    // Main editor: search for @ before cursor
    if (node.nodeType !== Node.TEXT_NODE) { closeSlashMenu(); return }
    const textNode = node as Text
    const textBefore = (textNode.textContent ?? "").slice(0, range.startOffset)
    const atIdx = textBefore.lastIndexOf("@")
    const lastIdx = atIdx
    if (lastIdx === -1) { closeSlashMenu(); return }
    const filter = textBefore.slice(lastIdx + 1)
    if (filter.includes(" ")) { closeSlashMenu(); return }
    if (!slashMenuRef.current) { closeSlashMenu(); return }
    slashAnchorRef.current = { node: textNode, offset: lastIdx }
    const updated: SlashMenuState = { ...slashMenuRef.current, filter }
    slashMenuRef.current = updated
    setSlashMenu(updated)
  }, [editor.syncContent, closeSlashMenu])

  // Auto-capitalize: on input, if space was just typed, capitalize first letter of previous word if it starts a sentence
  useEffect(() => {
    if (!autoCapitalize) return
    let capitalizing = false
    const handler = () => {
      if (capitalizing) return
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return
      const anchor = sel.anchorNode
      if (!anchor) return
      const ce = (anchor.nodeType === Node.TEXT_NODE
        ? anchor.parentElement?.closest('[contenteditable]')
        : (anchor as HTMLElement).closest('[contenteditable]')) as HTMLElement | null
      if (!ce) return
      if (slashMenuRef.current) return
      // Use Range to get ALL text before cursor, across any HTML elements/text nodes
      const preRange = document.createRange()
      preRange.setStart(ce, 0)
      preRange.setEnd(anchor, sel.anchorOffset)
      const fullBefore = preRange.toString()
      if (fullBefore.length < 2) return
      const lastCode = fullBefore.charCodeAt(fullBefore.length - 1)
      if (lastCode !== 32 && lastCode !== 160) return
      // Replace nbsp with regular space for pattern matching
      const beforeSpace = fullBefore.slice(0, -1).replace(/ /g, ' ')
      const wordMatch = beforeSpace.match(/(\S+)$/)
      if (!wordMatch) return
      const word = wordMatch[1]
      const firstChar = word[0]
      if (!firstChar || firstChar !== firstChar.toLowerCase() || firstChar === firstChar.toUpperCase()) return
      const beforeWord = beforeSpace.slice(0, beforeSpace.length - word.length)
      const trimmed = beforeWord.trimEnd()
      if (trimmed.length !== 0 && !/[.!?]\s*$/.test(beforeWord) && !/\n\s*$/.test(beforeWord)) return
      // Find the text node and offset that contains the first char of the word
      // Walk text nodes in the contenteditable to find it
      const walker = document.createTreeWalker(ce, NodeFilter.SHOW_TEXT)
      let charCount = 0
      const targetOffset = beforeSpace.length - word.length
      let targetNode: Text | null = null
      let targetNodeOffset = 0
      while (walker.nextNode()) {
        const tn = walker.currentNode as Text
        const len = tn.textContent?.length ?? 0
        if (charCount + len > targetOffset) {
          targetNode = tn
          targetNodeOffset = targetOffset - charCount
          break
        }
        charCount += len
      }
      if (!targetNode) return
      capitalizing = true
      const savedAnchor = sel.anchorNode
      const savedOffset = sel.anchorOffset
      const r = document.createRange()
      r.setStart(targetNode, targetNodeOffset)
      r.setEnd(targetNode, targetNodeOffset + 1)
      sel.removeAllRanges()
      sel.addRange(r)
      document.execCommand('insertText', false, firstChar.toUpperCase())
      // Restore cursor
      if (savedAnchor) {
        try {
          const restore = document.createRange()
          restore.setStart(savedAnchor, savedOffset)
          restore.collapse(true)
          sel.removeAllRanges()
          sel.addRange(restore)
        } catch { /* node may have shifted */ }
      }
      capitalizing = false
    }
    document.addEventListener('input', handler)
    return () => document.removeEventListener('input', handler)
  }, [autoCapitalize])

  // Keyboard shortcuts for tools
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable) return
      const map: Record<string, string> = { '1': 'select', '2': 'rect', '3': 'diamond', '4': 'circle', '5': 'arrow', '6': 'line', '7': 'pen', '8': 'text', '9': 'image', '0': 'eraser' }
      if (map[e.key]) setActiveTool(map[e.key])
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const checkViewport = () => {
      const w = window.innerWidth
      const isNarrow = w < 1000
      updateSettings({ wordCountVisible: !isNarrow })
    }
    checkViewport()
    window.addEventListener('resize', checkViewport)
    return () => window.removeEventListener('resize', checkViewport)
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    const buildKeyStr = (e: KeyboardEvent) => {
      const parts: string[] = []
      if (e.ctrlKey || e.metaKey) parts.push("ctrl")
      if (e.altKey) parts.push("alt")
      if (e.shiftKey) parts.push("shift")
      if (e.key && !["Control", "Meta", "Alt", "Shift"].includes(e.key)) parts.push(e.key.toLowerCase())
      return parts.join("+")
    }
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.altKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault()
      }
      const keyStr = buildKeyStr(e)

      if (keyStr === shortcuts.newNote) {
        e.preventDefault()
        addNote(null)
        return
      }

      if (keyStr === shortcuts.search) {
        e.preventDefault()
        setSlashMenu(null)
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement
        if (searchInput) searchInput.focus()
        return
      }

      if (e.key === 'Escape') {
        if (aiHubOpen) {
          setAiHubOpen(false)
        } else if (showDrawToolbar) {
          setShowDrawToolbar(false)
          setActiveTool('select')
        } else if (boxes.selectedBoxIdsRef.current.size > 0) {
          boxes.setSelectedBoxIds(new Set())
        }
      }

      if (keyStr === shortcuts.aiCommand) {
        e.preventDefault()
        setAiHubOpen(v => !v)
      }

      if (keyStr === shortcuts.timer) {
        e.preventDefault()
        setTimerOpen(!timerOpen)
      }

      if (keyStr === shortcuts.toggleSidebar) {
        e.preventDefault()
        setSidebarWidth((w: number) => w > 40 ? 0 : 240)
      }

      if (keyStr === shortcuts.drawMode) {
        const active = document.activeElement as HTMLElement | null
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) return
        e.preventDefault()
        setShowDrawToolbar((v: boolean) => !v)
      }

      const isAltLeft = e.altKey && e.code === 'ArrowLeft'
      const isAltRight = e.altKey && e.code === 'ArrowRight'
      if (isAltLeft || isAltRight) {
        e.preventDefault()
        editor.flushSync()
        if (isAltLeft) {
          setCurrentPageIdx((p: number) => Math.max(0, p - 1))
        } else {
          const note = notesRef.current.find(n => n.id === activeTabIdRef.current)
          if (note) {
            setCurrentPageIdx((p: number) => {
              if (p >= note.pages.length - 1) {
                const np = [...note.pages, ""]
                const pageIdx = note.pages.length
                setNotes((prev: any[]) => prev.map(n => n.id !== note.id ? n : { ...n, pages: np, boxes: { ...n.boxes, [pageIdx]: [{ id: uid(), x: 40, y: 40, w: 900, h: 32, content: '' }] } }))
                return pageIdx
              }
              return p + 1
            })
          }
        }
      }
    }
    window.addEventListener("keydown", handleGlobalKey, true)
    return () => window.removeEventListener("keydown", handleGlobalKey, true)
  }, [])

  // Auth
  useEffect(() => {
    const flushPendingDeletes = async (uid: string) => {
      const pending: string[] = JSON.parse(localStorage.getItem("pulp-pending-deletes") || "[]")
      if (!pending.length) return
      await Promise.all(pending.map(id => supabase.from("notes").delete().eq("id", id).eq("user_id", uid)))
      localStorage.removeItem("pulp-pending-deletes")
    }
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error?.message?.includes('Refresh Token') || error?.message?.includes('refresh_token')) {
        supabase.auth.signOut()
        setUser(null)
        return
      }
      setUser(user); if (user) flushPendingDeletes(user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session: any) => {
      if (event === 'TOKEN_REFRESHED' && !session) {
        supabase.auth.signOut()
        setUser(null)
        return
      }
      const u = session?.user ?? null
      setUser(u)
      if (u) flushPendingDeletes(u.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  const isAdmin = user?.email === 'pvt.trisn@gmail.com'
  const ALL_COSMETICS = [
    "accent_#d97706", "accent_#ef4444", "accent_#ec4899", "accent_#a855f7", "accent_#3b82f6", "accent_#06b6d4", "accent_#22c55e", "accent_#64748b",
    "bfont_Palatino", "bfont_Arial", "bfont_Courier New",
    "hfont_Didot", "hfont_Palatino", "hfont_Bodoni",
    "paper_dotgrid", "paper_plain", "paper_steno", "paper_dark-lined", "paper_dark-grid", "paper_dark-plain", "paper_dark-steno",
  ]
  useEffect(() => {
    if (isAdmin) {
      setUnlockedCosmetics(ALL_COSMETICS)
      const allSeeds = Object.keys(TREE_TYPES).filter(k => k !== 'spoiled' && k !== 'tangerine')
      setInventory(allSeeds)
    }
  }, [user])

  // Resize observer for binding layout
  useEffect(() => {
    const check = () => { if (paperRef.current) setBindingCompact(paperRef.current.offsetWidth < 680) }
    check()
    const ro = new ResizeObserver(check)
    if (paperRef.current) ro.observe(paperRef.current)
    return () => ro.disconnect()
  }, [])

  // Backlink click handler
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest("[data-backlink-id]")
      if (link) {
        const id = link.getAttribute("data-backlink-id")
        if (id) {
          editor.flushSync()
          setActiveTabId(id)
          setCurrentPageIdx(0)
        }
      }
    }
    window.addEventListener("click", handler)
    return () => window.removeEventListener("click", handler)
  }, [editor])

  // Load settings + folders from Supabase
  useEffect(() => {
    if (!user) return
    const loadSettings = async () => {
      const [settingsRow, foldersData, bookmarkIds, trashIds] = await Promise.all([
        db.getSettings(user.id),
        db.getFolders(user.id),
        db.getBookmarks(user.id),
        db.getTrash(user.id)
      ])
      if (settingsRow) {
        updateSettings({
          accent: settingsRow.accent, theme: settingsRow.theme, autoSave: settingsRow.auto_save,
          spellCheck: settingsRow.spell_check, autoCorrect: settingsRow.auto_correct, autoCapitalize: settingsRow.auto_capitalize,
          editorFont: settingsRow.editor_font, headingFont: settingsRow.heading_font, lineSpacing: settingsRow.line_spacing,
          paperStyle: settingsRow.paper_style, showBinding: settingsRow.show_binding, reduceMotion: settingsRow.reduce_motion,
          reduceVisuals: settingsRow.reduce_visuals, sidebarOnStart: settingsRow.sidebar_on_start, bgEffect: settingsRow.bg_effect,
          smearEffect: settingsRow.smear_effect, handwrittenEffect: settingsRow.handwritten_effect, language: settingsRow.language,
          defaultSort: settingsRow.default_sort, wordCountVisible: settingsRow.word_count_visible, focusMode: settingsRow.focus_mode,
          baseFontSize: settingsRow.base_font_size, shortcuts: settingsRow.shortcuts, blockedSites: settingsRow.blocked_sites,
          blockedApps: settingsRow.blocked_apps, skipDeleteConfirmation: settingsRow.skip_delete_confirmation
        })
        if (settingsRow.sidebar_width) setSidebarWidth(settingsRow.sidebar_width)
      }
      if (foldersData.length) setFolders(foldersData)
      // trashIds are tracked in Supabase for cross-device sync but trashNotes state holds full NoteData objects (loaded from localStorage)
    }
    loadSettings()
  }, [user])

  // ─── Flush-on-unload refs (mirror latest state for beforeunload) ───
  const flushRefs = useRef({
    settings: null as any,
    grove: null as any,
    note: null as any,
    folders: null as unknown as FolderData[],
    bookmarks: null as unknown as Bookmark[],
    user: null as User | null,
    dirty: { settings: false, grove: false, note: false, folders: false, bookmarks: false }
  })
  useEffect(() => { flushRefs.current.user = user }, [user])
  useEffect(() => { flushRefs.current.folders = folders }, [folders])
  useEffect(() => { flushRefs.current.bookmarks = bookmarks }, [bookmarks])
  useEffect(() => {
    flushRefs.current.settings = { accent, theme, autoSave, spellCheck, autoCorrect, autoCapitalize, editorFont, headingFont, lineSpacing, paperStyle, showBinding, reduceMotion, reduceVisuals, sidebarOnStart, bgEffect, smearEffect, handwrittenEffect, bookmarks, language, defaultSort, wordCountVisible, focusMode, baseFontSize, shortcuts, blockedSites, blockedApps, trashNotes, skipDeleteConfirmation, orchardTimeMode, scrollMode }
  }, [accent, theme, autoSave, spellCheck, autoCorrect, autoCapitalize, editorFont, headingFont, lineSpacing, paperStyle, showBinding, reduceMotion, reduceVisuals, sidebarOnStart, bgEffect, smearEffect, handwrittenEffect, bookmarks, language, defaultSort, wordCountVisible, focusMode, baseFontSize, shortcuts, blockedSites, blockedApps, trashNotes, skipDeleteConfirmation, scrollMode])
  useEffect(() => {
    flushRefs.current.grove = { juice: sap, essence, grove, inventory, achievements, lastCharCount, unlockedCosmetics, goalStreak, goalStreakLastDate, dailyGoalMinutes, quotaTier, quotaLockedUntil, hibernation, hibernationScheduled }
  }, [sap, essence, grove, inventory, achievements, lastCharCount, unlockedCosmetics, goalStreak, goalStreakLastDate, dailyGoalMinutes, quotaTier, quotaLockedUntil, hibernation, hibernationScheduled])

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const flushAll = () => {
      const { settings: s, grove: g, user: u, dirty, folders: f } = flushRefs.current
      const dSettings = dirty.settings
      const dGrove = dirty.grove
      const dNote = dirty.note
      const dFolders = dirty.folders

      if (dSettings && s) localStorage.setItem("pulp-settings", JSON.stringify(s))
      if (dGrove && g) localStorage.setItem("pulp-grove", JSON.stringify(g))
      if (dNote) {
        localStorage.setItem("pulp-notes", JSON.stringify(notesRef.current))
        localStorage.setItem("pulp-folders", JSON.stringify(f))
      }

      dirty.settings = false; dirty.grove = false; dirty.note = false; dirty.folders = false; dirty.bookmarks = false

      if (!u) return
      const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' }

      if (dGrove && g) {
        const invMap: Record<string, number> = {}
        for (const item of g.inventory) invMap[item] = (invMap[item] || 0) + 1
        fetch(`${supabaseUrl}/rest/v1/player_profiles?on_conflict=user_id`, {
          method: 'POST', headers, keepalive: true,
          body: JSON.stringify({ user_id: u.id, gems: 0, juice: g.juice, last_char_count: g.lastCharCount, grove: g.grove, inventory: invMap, unlocked_cosmetics: g.unlockedCosmetics })
        }).catch(() => {})
      }
      if (dNote) {
        const note = notesRef.current.find(n => n.id === activeTabIdRef.current)
        if (note) {
          fetch(`${supabaseUrl}/rest/v1/notes?on_conflict=id`, {
            method: 'POST', headers, keepalive: true,
            body: JSON.stringify({ id: note.id, subject: note.subject, pages: note.pages, boxes: note.boxes, folder_id: note.folderId, parent_id: note.parentId ?? null, icon: note.icon ?? null, note_type: note.noteType ?? null, cover: note.cover ?? null, lines: note.lines ?? null, drawings: note.drawings ?? null, user_id: u.id })
          }).catch(() => {})
        }
      }
      if (dSettings && s) {
        fetch(`${supabaseUrl}/rest/v1/settings?on_conflict=user_id`, {
          method: 'POST', headers, keepalive: true,
          body: JSON.stringify({ user_id: u.id, accent: s.accent, theme: s.theme, auto_save: s.autoSave, spell_check: s.spellCheck, auto_correct: s.autoCorrect, auto_capitalize: s.autoCapitalize, editor_font: s.editorFont, heading_font: s.headingFont, line_spacing: s.lineSpacing, paper_style: s.paperStyle, show_binding: s.showBinding, reduce_motion: s.reduceMotion, reduce_visuals: s.reduceVisuals, sidebar_on_start: s.sidebarOnStart, bg_effect: s.bgEffect, smear_effect: s.smearEffect, handwritten_effect: s.handwrittenEffect, language: s.language, default_sort: s.defaultSort, word_count_visible: s.wordCountVisible, focus_mode: s.focusMode, base_font_size: s.baseFontSize, shortcuts: s.shortcuts, blocked_sites: s.blockedSites, blocked_apps: s.blockedApps, skip_delete_confirmation: s.skipDeleteConfirmation })
        }).catch(() => {})
      }
      if (dFolders && f?.length) {
        const rows = f.map((fo, i) => ({ id: fo.id, user_id: u.id, name: fo.name, sort_order: i }))
        fetch(`${supabaseUrl}/rest/v1/folders?on_conflict=id`, {
          method: 'POST', headers, keepalive: true,
          body: JSON.stringify(rows)
        }).catch(() => {})
      }
    }

    const onBeforeUnload = () => flushAll()
    const onVisibilityChange = () => { if (document.visibilityState === 'hidden') flushAll() }

    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  // Save settings to localStorage + Supabase (debounced, split by concern)
  const settingsSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    flushRefs.current.dirty.settings = true
    clearTimeout(settingsSaveTimer.current)
    settingsSaveTimer.current = setTimeout(() => {
      flushRefs.current.dirty.settings = false
      const settings = { accent, theme, autoSave, spellCheck, autoCorrect, autoCapitalize, editorFont, headingFont, lineSpacing, paperStyle, showBinding, reduceMotion, reduceVisuals, sidebarOnStart, bgEffect, smearEffect, handwrittenEffect, bookmarks, language, defaultSort, wordCountVisible, focusMode, baseFontSize, shortcuts, blockedSites, blockedApps, trashNotes, skipDeleteConfirmation, orchardTimeMode, scrollMode }
      localStorage.setItem("pulp-settings", JSON.stringify(settings))
      if (user) {
        db.upsertSettings(user.id, {
          accent, theme, auto_save: autoSave, spell_check: spellCheck, auto_correct: autoCorrect,
          auto_capitalize: autoCapitalize, editor_font: editorFont, heading_font: headingFont, line_spacing: lineSpacing,
          paper_style: paperStyle, show_binding: showBinding, reduce_motion: reduceMotion, reduce_visuals: reduceVisuals,
          sidebar_on_start: sidebarOnStart, bg_effect: bgEffect, smear_effect: smearEffect, handwritten_effect: handwrittenEffect,
          language, default_sort: defaultSort, word_count_visible: wordCountVisible, focus_mode: focusMode,
          base_font_size: baseFontSize, shortcuts, blocked_sites: blockedSites, blocked_apps: blockedApps,
          sidebar_width: sidebarWidth, skip_delete_confirmation: skipDeleteConfirmation, dev_mode: false
        })
      }
    }, 500)
    return () => clearTimeout(settingsSaveTimer.current)
  }, [accent, theme, autoSave, spellCheck, autoCorrect, autoCapitalize, editorFont, headingFont, lineSpacing, paperStyle, showBinding, reduceMotion, reduceVisuals, sidebarOnStart, bgEffect, smearEffect, handwrittenEffect, language, defaultSort, wordCountVisible, focusMode, baseFontSize, shortcuts, blockedSites, blockedApps, trashNotes, skipDeleteConfirmation, scrollMode, user])

  const folderSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    flushRefs.current.dirty.folders = true
    clearTimeout(folderSaveTimer.current)
    folderSaveTimer.current = setTimeout(() => { flushRefs.current.dirty.folders = false; if (user) db.upsertFolders(user.id, folders) }, 500)
    return () => clearTimeout(folderSaveTimer.current)
  }, [folders, user])

  const bookmarkSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    flushRefs.current.dirty.bookmarks = true
    clearTimeout(bookmarkSaveTimer.current)
    bookmarkSaveTimer.current = setTimeout(() => { flushRefs.current.dirty.bookmarks = false; if (user) db.setBookmarks(user.id, bookmarks.map((b: any) => typeof b === 'string' ? b : b.noteId)) }, 500)
    return () => clearTimeout(bookmarkSaveTimer.current)
  }, [bookmarks, user])

  const sidebarWidthTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    clearTimeout(sidebarWidthTimer.current)
    sidebarWidthTimer.current = setTimeout(() => localStorage.setItem("pulp-sidebar-width", String(sidebarWidth)), 300)
    return () => clearTimeout(sidebarWidthTimer.current)
  }, [sidebarWidth])

  useEffect(() => {
    window.postMessage({ type: "pulp-focus-config", blockedSites, focusMode }, "*")
  }, [blockedSites, focusMode])

  // Save Grove & Inventory to localStorage + Supabase (debounced)
  const groveSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    flushRefs.current.dirty.grove = true
    clearTimeout(groveSaveTimer.current)
    groveSaveTimer.current = setTimeout(() => {
      flushRefs.current.dirty.grove = false
      const groveData = { juice: sap, essence, grove, inventory, achievements, lastCharCount, unlockedCosmetics, goalStreak, goalStreakLastDate, dailyGoalMinutes, quotaTier, quotaLockedUntil, hibernation, hibernationScheduled }
      localStorage.setItem("pulp-grove", JSON.stringify(groveData))
      if (user) {
        const invMap: Record<string, number> = {}
        for (const item of inventory) invMap[item] = (invMap[item] || 0) + 1
        db.upsertPlayerProfile(user.id, { gems: 0, juice: sap, last_char_count: lastCharCount, grove, inventory: invMap, unlocked_cosmetics: unlockedCosmetics })
        db.upsertAchievements(user.id, achievements)
      }
    }, 500)
    return () => clearTimeout(groveSaveTimer.current)
  }, [sap, essence, grove, inventory, achievements, lastCharCount, unlockedCosmetics, goalStreak, goalStreakLastDate, dailyGoalMinutes, hibernation, hibernationScheduled, user])

  // Cloud autosave (debounced off notes array, not activeNote object ref)
  const cloudSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const cloudAbort = useRef<AbortController | undefined>(undefined)
  useEffect(() => {
    if (!autoSave || isLoading || !user || !activeTabId) return
    flushRefs.current.dirty.note = true
    clearTimeout(cloudSaveTimer.current)
    cloudAbort.current?.abort()
    cloudSaveTimer.current = setTimeout(async () => {
      flushRefs.current.dirty.note = false
      const note = notesRef.current.find(n => n.id === activeTabIdRef.current)
      if (!note) return
      const ac = new AbortController()
      cloudAbort.current = ac
      const { error } = await supabase.from("notes").upsert({ id: note.id, subject: note.subject, pages: note.pages, boxes: note.boxes, folder_id: note.folderId, parent_id: note.parentId ?? null, icon: note.icon ?? null, note_type: note.noteType ?? null, cover: note.cover ?? null, lines: note.lines ?? null, drawings: note.drawings ?? null, user_id: user.id }, { signal: ac.signal } as any)
      if (ac.signal.aborted) return
      if (error) console.error("Save failed:", error.message)
      else apiFetch("/api/embed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ noteId: note.id, pages: note.pages.map((p: string, pi: number) => ({ boxes: [{ content: p }, ...(note.boxes[pi] || []).map((b: { content: string }) => ({ content: b.content }))] })), noteName: note.subject }), signal: ac.signal }).catch(() => { })
    }, 800)
    return () => { clearTimeout(cloudSaveTimer.current); cloudAbort.current?.abort() }
  }, [notes, user, autoSave, isLoading, activeTabId])

  // Sync editor DOM with active note/page
  const lastSyncKey = useRef<string>("")
  useEffect(() => {
    if (!activeTabId || gridView) return
    const key = `${activeTabId}:${currentPageIdx}:${gridView}:${scrollMode}`
    if (!gridView && editorRef.current && lastSyncKey.current !== key) {
      editorRef.current.innerHTML = sanitizeHTML(activeNote?.pages[currentPageIdx] || "")
      lastSyncKey.current = key
    }
  }, [activeTabId, currentPageIdx, gridView, scrollMode, activeNote?.pages])

  // Scroll mode: IntersectionObserver to track visible page
  const scrollObserverSkip = useRef(false)
  useEffect(() => {
    if (!scrollMode || !scrollContainerRef.current || !activeNote) return
    const container = scrollContainerRef.current
    const observer = new IntersectionObserver(
      entries => {
        if (scrollObserverSkip.current) return
        let maxRatio = 0
        let maxIdx = currentPageIdx
        entries.forEach(entry => {
          const idx = Number(entry.target.getAttribute("data-page-idx"))
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio
            maxIdx = idx
          }
        })
        if (maxRatio > 0.3 && maxIdx !== currentPageIdx) {
          editor.flushSync()
          setCurrentPageIdx(maxIdx)
        }
      },
      { root: container, threshold: [0.1, 0.3, 0.5, 0.7] }
    )
    scrollPageRefs.current.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [scrollMode, activeNote?.pages?.length, activeTabId])

  const handleScrollPageClick = useCallback((pageIdx: number) => {
    if (pageIdx === currentPageIdx) return
    editor.flushSync()
    scrollObserverSkip.current = true
    setCurrentPageIdx(pageIdx)
    requestAnimationFrame(() => {
      const el = scrollPageRefs.current.get(pageIdx)
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
      setTimeout(() => { scrollObserverSkip.current = false }, 500)
    })
  }, [currentPageIdx, editor, setCurrentPageIdx])

  // AI Easter Egg Expression Loop
  useEffect(() => {
    const expressions: Array<typeof aiExpression> = ["wink", "sleepy", "heart", "surprised"]
    const scheduleNext = () => {
      // Random delay: 1–3 hours (3,600,000 – 10,800,000 ms)
      const delay = 3600000 + Math.random() * 7200000
      return setTimeout(() => {
        const next = expressions[Math.floor(Math.random() * expressions.length)]
        setAiExpression(next)

        // Reset to normal after 5-8 seconds
        setTimeout(() => setAiExpression("normal"), 5000 + Math.random() * 3000)

        scheduleNext() // Loop
      }, delay)
    }
    const timer = scheduleNext()
    return () => clearTimeout(timer)
  }, [])

  // LocalStorage Persistence — load once on mount
  useEffect(() => {
    const saved = localStorage.getItem("pulp-notes")
    const savedFolders = localStorage.getItem("pulp-folders")
    const savedActiveTab = localStorage.getItem("pulp-active-tab")
    try {
      if (saved) {
        const parsed: NoteData[] = JSON.parse(saved)
        setNotes(parsed)
        if (parsed.length > 0) {
          const lastId = savedActiveTab && parsed.find(n => n.id === savedActiveTab) ? savedActiveTab : parsed[0].id
          setActiveTabId(lastId)
          const savedSidebarWidth = localStorage.getItem("pulp-sidebar-width")
          if (savedSidebarWidth !== null) {
            setSidebarWidth(Number(savedSidebarWidth))
          } else {
            const savedSettings = localStorage.getItem("pulp-settings")
            const sidebarPref = savedSettings ? JSON.parse(savedSettings).sidebarOnStart : true
            if (sidebarPref !== false) setSidebarWidth(240)
          }
        }
      }
      if (savedFolders) setFolders(JSON.parse(savedFolders))
    } catch { }
  }, [])

  // Save to localStorage whenever notes, folders, or active tab changes (debounced)
  const hasMounted = useRef(false)
  const notesSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return }
    flushRefs.current.dirty.note = true
    clearTimeout(notesSaveTimer.current)
    notesSaveTimer.current = setTimeout(() => {
      flushRefs.current.dirty.note = false
      localStorage.setItem("pulp-notes", JSON.stringify(notes))
      localStorage.setItem("pulp-folders", JSON.stringify(folders))
    }, 500)
    return () => clearTimeout(notesSaveTimer.current)
  }, [notes, folders])

  useEffect(() => {
    if (activeTabId) localStorage.setItem("pulp-active-tab", activeTabId)
  }, [activeTabId])

  // Show local content immediately, merge cloud notes in background
  useEffect(() => {
    setIsLoading(false)
    const fetchNotes = async () => {
      try {
        const { data: { user: u } } = await supabase.auth.getUser()
        if (!u) { setUser(null); return }
        setUser(u)
        const { data, error } = await supabase.from("notes").select("*").eq("user_id", u.id)
        if (!error && data?.length) {
          const cloudNotes = data.map(n => ({ id: n.id, subject: n.subject, pages: n.pages ?? [""], boxes: n.boxes ?? {}, folderId: n.folder_id ?? null, parentId: n.parent_id ?? undefined, icon: n.icon ?? undefined, noteType: n.note_type ?? undefined, cover: n.cover ?? undefined, lines: n.lines ?? undefined, drawings: n.drawings ?? undefined }))
          setNotes(prev => {
            const localIds = new Set(prev.map(n => n.id))
            const missing = cloudNotes.filter(n => !localIds.has(n.id))
            if (missing.length === 0) return prev
            return [...prev, ...missing]
          })
          if (!activeTabId && !localStorage.getItem("pulp-active-tab")) setActiveTabId(data[0].id)
        }
      } catch (err) {
        console.error("[Pulp] Failed to fetch notes from Supabase, falling back to local:", err)
        setUser(null)
      }
    }
    fetchNotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const defaultBoxes = () => ({ 0: [{ id: uid(), x: 40, y: 40, w: 900, h: 32, content: '' }] })

  // Note/folder actions
  const addNote = (folderId: number | null = null) =>
    openPrompt("New Notebook", "", "Name your notebook", "Create", name => {
      const finalName = name.trim() || "New Notebook"
      const id = uid()
      const boxes = defaultBoxes()
      const newNote = { id, subject: finalName, pages: [""], folderId, boxes }
      setNotes(prev => [...prev, newNote])
      setActiveTabId(id); setCurrentPageIdx(0)
      checkAchievement('first_note')
      if (user) supabase.from("notes").insert({ id, subject: finalName, pages: [""], boxes, folder_id: folderId, user_id: user.id })
    }, "📓")

  const addFirstNotebook = () => {
    const id = uid()
    const boxes = defaultBoxes()
    const newNote = { id, subject: "My First Notebook", pages: [""], folderId: null, boxes }
    setNotes(prev => [...prev, newNote])
    setActiveTabId(id); setCurrentPageIdx(0)
    setSidebarOpen(true)
    setSidebarWidth(240)
    checkAchievement('first_note')
    if (user) supabase.from("notes").insert({ id, subject: "My First Notebook", pages: [""], boxes, folder_id: null, user_id: user.id })
  }

  const addTypedNote = (folderId: number | null = null, noteType?: NoteData["noteType"]) => {
    let title = "New Notebook"
    let placeholder = "Notebook name…"
    let promptTitle = "Name your notebook"
    let icon = "📓"

    if (noteType === "singlepage") {
      title = "New Page"; placeholder = "Page name…"; promptTitle = "Name your page"; icon = "📄"
    } else if (noteType === "vault") {
      title = "New Vault"; placeholder = "Vault name…"; promptTitle = "Name your vault"; icon = "🔐"
    }

    const finishCreate = (name: string, pwd?: string) => {
      const id = uid()
      const baseNote = { id, subject: name.trim(), folderId, boxes: defaultBoxes(), noteType, password: pwd }
      const newNote: NoteData = noteType === "singlepage"
        ? { ...baseNote, pages: [""], icon: "📄" }
        : noteType === "vault"
          ? { ...baseNote, pages: [""], icon: "🔐" }
          : { ...baseNote, pages: [""] }

      if (noteType === "vault") unlockedVaults.current.add(id)
      setNotes(prev => [...prev, newNote])
      setActiveTabId(id); setCurrentPageIdx(0)
      checkAchievement('first_note')
      if (user) supabase.from("notes").insert({ id, subject: name.trim(), pages: [""], boxes: defaultBoxes(), folder_id: folderId, note_type: noteType ?? null, user_id: user.id })
    }

    openPrompt(title, "", promptTitle, "Create", name => {
      if (!name.trim() && !title) return
      const finalName = name.trim() || title
      if (noteType === "vault") {
        setTimeout(() => {
          openPrompt("Set Password", "", "Enter a password", "Create", pwd => {
            if (!pwd) { openAlert("Error", "Password is required for a vault."); return }
            finishCreate(finalName, pwd)
          }, "🔑")
        }, 150)
      } else {
        finishCreate(finalName)
      }
    }, icon)
  }

  const AI_ACTIONS: { id: string; label: string; prompt: string }[] = [
    { id: "quiz", label: "Quiz me", prompt: "Generate exactly 5 quiz questions with answers based on this text. Format each as:\nQ: [question]\nA: [short answer]\n\nOutput only the Q/A pairs, nothing else." },
    { id: "summarize", label: "Summarize", prompt: "Summarize this text in 2-3 concise sentences." },
    { id: "explain", label: "Explain", prompt: "Explain the key concepts in this text in simple terms." },
    { id: "outline", label: "Outline", prompt: "Create a brief bullet-point outline of this text." },
    { id: "improve", label: "Improve writing", prompt: "Improve the clarity and flow of this text. Return only the improved version." },
  ]

  const handleAiAction = useCallback(async (action: string) => {
    const pageText = editorRef.current?.innerText?.trim() || ""
    if (!pageText) { openAlert("Nothing to process", "Add some text to your note first."); return }
    const actionDef = AI_ACTIONS.find(a => a.id === action)
    const actionLabel = actionDef?.label || action
    const prompt = actionDef?.prompt || action

    if (action === "quiz") {
      setQuizState({ questions: [], current: 0, revealed: false, loading: true })
      try {
        const res = await apiFetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, text: pageText }) })
        if (!res.ok) throw new Error("API error")
        const data = await res.json()
        const raw = data.result || ""
        const pairs: { q: string; a: string }[] = []
        const qBlocks = raw.split(/\n?Q:\s*/i).filter((s: string) => s.trim())
        for (const block of qBlocks) {
          const parts = block.split(/\n?A:\s*/i)
          if (parts.length >= 2) {
            pairs.push({ q: parts[0].trim(), a: parts.slice(1).join("A: ").trim() })
          }
        }
        if (pairs.length === 0) {
          setQuizState(null)
          openAlert("Quiz Error", "Could not generate quiz questions from this text.")
          return
        }
        setQuizState({ questions: pairs, current: 0, revealed: false, loading: false })
      } catch {
        setQuizState(null); openAlert("AI Error", "Could not process your request.")
      }
      return
    }

    setAiResult({ title: actionLabel, result: "", loading: true, prompt })
    try {
      const res = await apiFetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, text: pageText }) })
      if (!res.ok) throw new Error("API error")
      const data = await res.json()
      setAiResult(prev => prev ? { ...prev, result: data.result || "", loading: false } : null)
    } catch {
      setAiResult(null); openAlert("AI Error", "Could not process your request.")
    }
  }, [AI_ACTIONS, notes, activeTabId, setNotes])

  const insertBacklink = useCallback(() => {
    editor.saveSelection()
    openPrompt("New Subpage", "", "Name your subpage", "Create", async name => {
      if (!name.trim()) return
      const newId = uid()
      const parentId = activeTabId ?? undefined
      const newNote: NoteData = { id: newId, subject: name.trim(), pages: [""], folderId: null, parentId, boxes: defaultBoxes() }

      const color = accent.length > 7 ? accent.slice(0, 7) : accent
      const linkHtml = `<span data-backlink-id="${newId}" contenteditable="false" style="display:inline-flex;align-items:center;gap:4px;background:${color}18;color:${color};border:1px solid ${color}44;padding:1px 8px;border-radius:4px;font-size:13px;font-weight:600;cursor:pointer;margin:0 2px;user-select:none;-webkit-user-modify:read-only;text-decoration:none;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>${name.trim()}</span>&nbsp;`

      // Insert into DOM first, then capture the updated innerHTML before any React re-render
      editor.insertHTML(linkHtml)

      const focused = document.activeElement as HTMLElement | null
      const isBox = focused?.isContentEditable === true && focused !== editorRef.current
      if (isBox && focused) {
        const boxWrapper = focused.closest('[id^="box-"]')
        const boxId = boxWrapper?.id.replace('box-', '')
        const updatedContent = focused.innerHTML
        setNotes(prev => {
          const updated = prev.map(n => {
            if (n.id !== activeTabId || !boxId) return n
            return { ...n, boxes: { ...n.boxes, [currentPageIdx]: (n.boxes[currentPageIdx] || []).map(b => b.id === boxId ? { ...b, content: updatedContent } : b) } }
          })
          return [...updated, newNote]
        })
      } else {
        editor.flushSync()
        setNotes(prev => [...prev, newNote])
      }

      if (user) {
        await supabase.from("notes").insert({
          id: newId, subject: name.trim(), pages: [""], boxes: defaultBoxes(), folder_id: null, parent_id: parentId ?? null, user_id: user.id
        })
      }
    })
  }, [accent, activeTabId, currentPageIdx, editor, editorRef, openPrompt, user])

  const setNoteParent = useCallback((id: string, parentId: string | undefined) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, parentId } : n))
    if (user) supabase.from("notes").update({ parent_id: parentId ?? null }).eq("id", id)
  }, [user])

  const changeNoteIcon = useCallback((id: string, icon: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, icon } : n))
    if (user) supabase.from("notes").update({ icon }).eq("id", id).then(({ error }) => { if (error) console.error("Icon save failed:", error.message) })
  }, [user])

  const renameNote = useCallback((id: string, newName: string) => {
    if (newName.trim()) {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, subject: newName.trim() } : n))
      if (user) supabase.from("notes").update({ subject: newName.trim() }).eq("id", id).then(({ error }) => { if (error) console.error("Rename save failed:", error.message) })
    }
  }, [user])

  const deleteNote = (id: string) => {
    const note = notes.find(n => n.id === id)
    if (!note) return
    setNotes(ns => ns.filter(n => n.id !== id))
    setTrashNotes(ts => [...ts, { ...note, deletedAt: new Date().toISOString() }])
    if (activeTabId === id) setActiveTabId(null)
    if (user) {
      supabase.from("notes").delete().eq("id", id)
      db.addToTrash(user.id, id)
    } else {
      const pending = JSON.parse(localStorage.getItem("pulp-pending-deletes") || "[]")
      pending.push(id)
      localStorage.setItem("pulp-pending-deletes", JSON.stringify(pending))
    }
  }

  const restoreNote = useCallback((id: string) => {
    const note = trashNotes.find(n => n.id === id)
    if (!note) return
    setTrashNotes(ts => ts.filter(n => n.id !== id))
    setNotes(ns => ns.some(n => n.id === id) ? ns : [...ns, { ...note, deletedAt: undefined }])
    if (user) {
      db.removeFromTrash(user.id, id)
      supabase.from("notes").upsert({ id: note.id, subject: note.subject, pages: note.pages, boxes: note.boxes, folder_id: note.folderId, parent_id: note.parentId ?? null, icon: note.icon ?? null, note_type: note.noteType ?? null, cover: note.cover ?? null, lines: note.lines ?? null, drawings: note.drawings ?? null, user_id: user.id })
    }
    const pending: string[] = JSON.parse(localStorage.getItem("pulp-pending-deletes") || "[]")
    localStorage.setItem("pulp-pending-deletes", JSON.stringify(pending.filter(pid => pid !== id)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const permanentlyDeleteNote = useCallback((id: string) => {
    setTrashNotes(ts => ts.filter(n => n.id !== id))
    if (user) db.removeFromTrash(user.id, id)
  }, [user])

  const archiveNote = useCallback((id: string) => {
    if (activeTabId === id) setActiveTabId(null)
    setNotes(ns => ns.map(n => n.id === id ? { ...n, archived: true } : n))
  }, [activeTabId])

  const unarchiveNote = useCallback((id: string) => {
    setNotes(ns => ns.map(n => n.id === id ? { ...n, archived: false } : n))
  }, [])

  const archivedNotes = useMemo(() => notes.filter(n => n.archived), [notes])

  const sortedNotes = useMemo(() => {
    const active = notes.filter(n => !n.archived)
    const archived = notes.filter(n => n.archived)
    if (defaultSort === 'title') {
      const sorted = [...active].sort((a, b) => (a.subject || '').localeCompare(b.subject || ''))
      return [...sorted, ...archived]
    }
    if (defaultSort === 'created') return [...[...active].reverse(), ...archived]
    return [...active, ...archived]
  }, [notes, defaultSort])

  // Periodic cleanup of trash older than 30 days
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now()
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
      setTrashNotes(ts => ts.filter(tn => {
        if (!tn.deletedAt) return true
        return (now - new Date(tn.deletedAt).getTime()) < thirtyDaysMs
      }))
    }
    const timer = setInterval(cleanup, 1000 * 60 * 60) // Check every hour
    cleanup()
    return () => clearInterval(timer)
  }, [])

  const clearPage = () =>
    openConfirm("Clear this page?", "All content on this page will be deleted. This cannot be undone.", () => {
      if (editorRef.current) editorRef.current.innerHTML = ""
      setNotes(prev => prev.map(n => {
        if (n.id !== activeTabId) return n
        const newPages = [...n.pages]; newPages[currentPageIdx] = ""
        const newBoxes = { ...n.boxes }; newBoxes[currentPageIdx] = []
        return { ...n, pages: newPages, boxes: newBoxes }
      }))
    })

  const insertCornell = () =>
    openConfirm("Apply Cornell Layout?", "This will clear everything currently on this page.", () => {
      const topH = 150
      const botH = 800
      const leftW = 280
      const lblStyle = "font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(113, 113, 122, 0.7)"

      if (editorRef.current) {
        editorRef.current.innerHTML = `
          <div style="position: absolute; top: ${topH}px; left: 40px; right: 40px; height: 1.5px; background: rgba(0,0,0,0.5);"></div>
          <div style="position: absolute; top: ${topH}px; height: ${botH - topH}px; left: ${leftW}px; width: 1.5px; background: rgba(0,0,0,0.5);"></div>
          <div style="position: absolute; top: ${botH}px; left: 40px; right: 40px; height: 1.5px; background: rgba(0,0,0,0.5);"></div>

          <div style="position: absolute; left: 60px; top: 30px; ${lblStyle}">Title</div>
          <div style="position: absolute; right: 100px; top: 30px; ${lblStyle}">Date</div>
          <div style="position: absolute; left: 60px; top: ${topH + 30}px; ${lblStyle}">Keywords & Questions</div>
          <div style="position: absolute; left: ${leftW + 30}px; top: ${topH + 30}px; ${lblStyle}">Main Notes</div>
          <div style="position: absolute; left: 60px; top: ${botH + 30}px; ${lblStyle}">Summary</div>
        `
      }
      setNotes(prev => prev.map(n => {
        if (n.id !== activeTabId) return n
        const newPages = [...n.pages]; newPages[currentPageIdx] = editorRef.current?.innerHTML || ""
        const newBoxes = { ...n.boxes }

        newBoxes[currentPageIdx] = [
          { id: uid(), x: 50, y: 55, w: 400, h: 50, content: "" }, // Title
          { id: uid(), x: 600, y: 55, w: 150, h: 50, content: "" }, // Date
          { id: uid(), x: 50, y: topH + 55, w: 200, h: 550, content: "" }, // Keywords
          { id: uid(), x: leftW + 20, y: topH + 55, w: 460, h: 550, content: "" }, // Notes
          { id: uid(), x: 50, y: botH + 55, w: 700, h: 100, content: "" }, // Summary
        ]
        return { ...n, pages: newPages, boxes: newBoxes }
      }))
    })

  const addFolder = () => {
    const id = Date.now()
    setFolders(prev => [...prev, { id, name: "New Folder", open: true }])
    setRenamingFolder(id)
  }
  const toggleFolder = (id: number) => setFolders(prev => prev.map(f => f.id === id ? { ...f, open: !f.open } : f))
  const renameFolder = (id: number, name: string) => setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f))
  const deleteFolder = (id: number) =>
    openConfirm("Delete folder?", "Notes inside will be moved to root.", () => {
      setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderId: null } : n))
      setFolders(prev => prev.filter(f => f.id !== id))
    })

  const handleDropNote = (e: React.DragEvent, targetFolderId: number | null, targetNoteId?: string) => {
    e.preventDefault(); e.stopPropagation()
    if (!draggedNoteId || draggedNoteId === targetNoteId) return
    setNotes(prev => {
      const copy = [...prev]
      const draggedIdx = copy.findIndex(n => n.id === draggedNoteId)
      if (draggedIdx === -1) return prev
      const draggedNote = { ...copy[draggedIdx], folderId: targetFolderId }
      copy.splice(draggedIdx, 1)
      if (targetNoteId) copy.splice(copy.findIndex(n => n.id === targetNoteId), 0, draggedNote)
      else copy.push(draggedNote)
      return copy
    })
    setDraggedNoteId(null)
  }

  const handleImageUpload = useCallback((dataUrl: string) => {
    const paper = paperRef.current
    if (!paper || !activeTabId) return
    const rect = paper.getBoundingClientRect()
    const scale = parseFloat(zoom)
    const x = (window.innerWidth / 2 - rect.left) / scale - 150
    const y = (window.innerHeight / 2 - rect.top) / scale - 100
    const id = uid()
    setNotes(prev => prev.map(n => n.id !== activeTabId ? n : {
      ...n,
      boxes: {
        ...n.boxes,
        [currentPageIdx]: [...(n.boxes[currentPageIdx] || []), { id, x: Math.max(10, x), y: Math.max(10, y), w: 300, h: 200, content: dataUrl }]
      }
    }))
  }, [activeTabId, currentPageIdx, zoom])

  const downloadNote = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${activeNote.subject}</title>
    <style>body{font-family:Georgia,serif;max-width:720px;margin:0 auto;padding:48px;color:#1a1a1a}
    h1{color:${accent};margin-bottom:32px}hr{border:none;border-top:1px solid #ddd;margin:32px 0}
    h3{color:${accent}88;font-size:12px;text-transform:uppercase;letter-spacing:.1em}</style>
    </head><body><h1>${activeNote.subject}</h1>
    ${activeNote.pages.map((p, i) => `<section><h3>Page ${i + 1}</h3><div>${p || "<em style='color:#bbb'>Empty page</em>"}</div></section>`).join("<hr/>")}</body></html>`
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }))
    a.download = `${activeNote.subject.replace(/[^a-z0-9]/gi, "_")}.html`
    a.click()
  }


  const settingsConfig = useMemo(() => ({ ...settings, accentColor: accent }), [settings, accent])
  const handleSettingsUpdate = useCallback((updates: any) => updateSettings({ ...updates, accent: updates.accentColor || accent }), [updateSettings, accent])
  const handleCloseSettings = useCallback(() => setShowSettings(false), [])
  const handleOpenShopItem = useCallback((itemId: string) => {
    setShowSettings(false)
    setShopInitialTab('shop')
    setShopScrollTo(itemId)
    startTransition(() => { closeAllPanels(); setShopOpen(true) })
  }, [closeAllPanels])
  const handleSyncNow = useCallback(async () => {
    if (!user) return null
    try {
      const { data, error } = await supabase.from("notes").select("*").eq("user_id", user.id)
      if (error || !data) return null
      const cloudNotes = data.map(n => ({ id: n.id, subject: n.subject, pages: n.pages ?? [""], boxes: n.boxes ?? {}, folderId: n.folder_id ?? null, parentId: n.parent_id ?? undefined, icon: n.icon ?? undefined, noteType: n.note_type ?? undefined, cover: n.cover ?? undefined, lines: n.lines ?? undefined, drawings: n.drawings ?? undefined }))
      const localNotes = notesRef.current
      const cloudIds = new Set(cloudNotes.map(n => n.id))
      const localIds = new Set(localNotes.map(n => n.id))
      const pulled = cloudNotes.filter(n => !localIds.has(n.id))
      const toPush = localNotes.filter(n => !cloudIds.has(n.id))
      if (pulled.length > 0) setNotes(prev => [...prev, ...pulled])
      if (toPush.length > 0) await supabase.from("notes").upsert(toPush.map(note => ({ id: note.id, subject: note.subject, pages: note.pages, boxes: note.boxes, folder_id: note.folderId, parent_id: note.parentId ?? null, icon: note.icon ?? null, note_type: note.noteType ?? null, cover: note.cover ?? null, lines: note.lines ?? null, drawings: note.drawings ?? null, user_id: user.id })))
      return { pushed: toPush.length, pulled: pulled.length }
    } catch { return null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  if (isLoading) return <PulpLoadingScreen />

  const handleUnlockDev = () => {
    if (isAdmin) updateSettings({ isDevUnlocked: true })
  }

  const { backgroundColor: paperBg, backgroundImage: paperImg, backgroundSize: paperSize } = getPaperBg(lineSpacing, paperStyle, theme === "dark")

  return (
    <LazyMotion features={domAnimation}>
      <>

        <div className="flex h-screen overflow-x-auto overflow-y-hidden font-sans relative select-none" style={{ minWidth: 900, backgroundColor: theme === "dark" ? "#09090b" : "#F0ECEA", color: theme === "dark" ? "#FAFAFA" : "#1A1A1A", backgroundImage: bgEffect ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='${theme === "dark" ? "0.035" : "0.045"}'/%3E%3C/svg%3E")` : undefined, backgroundRepeat: "repeat" }}>
          <PlantImagePreloader />
          {goalStreak >= 3 && goalStreakLastDate !== new Date().toISOString().split('T')[0] && !streakNudgeDismissed && !timerOpen && (
            <div style={{
              position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 100,
              display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px',
              borderRadius: 6, fontSize: 11, fontFamily: 'Crimson Pro, serif',
              background: theme === 'dark' ? 'rgba(217,119,6,0.08)' : 'rgba(217,119,6,0.06)',
              border: `1px solid ${theme === 'dark' ? 'rgba(217,119,6,0.15)' : 'rgba(217,119,6,0.12)'}`,
              color: theme === 'dark' ? '#d4a054' : '#92650a',
            }}>
              <span>{goalStreak}-day streak at risk</span>
              <button onClick={() => setStreakNudgeDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.4, fontSize: 13, lineHeight: 1, padding: 0 }}>×</button>
            </div>
          )}
          {dialog && <AppDialog config={dialog} accent={accent} onClose={() => setDialog(null)} />}
          {showSettings && <Suspense fallback={null}>
            <div style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
              <SettingsView
                user={user}
                onClose={handleCloseSettings}
                config={settingsConfig}
                onUpdateConfig={handleSettingsUpdate}
                achievements={achievements}
                onClaimAchievement={claimAchievement}
                trashNotes={trashNotes}
                onRestoreNote={restoreNote}
                onPermanentlyDeleteNote={permanentlyDeleteNote}
                unlockedCosmetics={unlockedCosmetics}
                setUnlockedCosmetics={setUnlockedCosmetics}
                onOpenShopItem={handleOpenShopItem}
                archivedNotes={archivedNotes}
                onUnarchiveNote={unarchiveNote}
                onSyncNow={handleSyncNow}
                xp={xp}
                hibernation={hibernation}
                hibernationScheduled={hibernationScheduled}
                onScheduleHibernation={scheduleHibernation}
                hibernationCooldownEnd={hibernationCooldownEnd}
                quotaTier={quotaTier}
                quotaLockedUntil={quotaLockedUntil}
                dailyGoalMinutes={dailyGoalMinutes}
                onChangeDailyGoalMinutes={setDailyGoalMinutes}
                onChangeQuotaTier={(tier: 'monthly' | 'weekly' | 'daily') => {
                  const lockDays = tier === 'monthly' ? 30 : 7
                  const lockDate = new Date()
                  lockDate.setDate(lockDate.getDate() + lockDays)
                  setQuotaTier(tier)
                  setQuotaLockedUntil(lockDate.toISOString().split('T')[0])
                }}
              />
            </div>
          </Suspense>}
          <GlobalStyles reduceMotion={reduceMotion} reduceVisuals={reduceVisuals} theme={theme} handwrittenEffect={handwrittenEffect} />



          {!gridView && sidebarWidth > 40 && notes.filter(n => !n.archived).length > 0 && (
            <m.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              style={{ display: gridView ? 'none' : 'flex', position: 'relative', height: '100%', zIndex: 250 }}
            >
              <Sidebar
                notes={sortedNotes}
                folders={folders}
                activeTabId={activeTabId}
                accent={accent}
                draggedNoteId={draggedNoteId}
                renamingFolder={renamingFolder}
                mini={orchardOpen || statsOpen || shopOpen}
                onCloseAllPanels={closeAllPanels}
                user={user}
                sidebarWidth={sidebarWidth}
                isDragging={isSidebarDragging}
                onAddNote={addNote}
                onAddTypedNote={addTypedNote}
                onAddFolder={addFolder}
                onSelectNote={id => {
                  const n = notes.find(x => x.id === id)
                  if (n?.noteType === "vault" && !unlockedVaults.current.has(id)) {
                    openPrompt("Vault Locked", "", "Enter password", "Unlock", pwd => {
                      if (pwd === (n.password || "")) {
                        unlockedVaults.current.add(id)
                        editor.flushSync(); setActiveTabId(id); setCurrentPageIdx(0); setCurrentView("editor")
                      } else {
                        openAlert("Access Denied", "Incorrect password.")
                      }
                    })
                    return
                  }
                  editor.flushSync(); setActiveTabId(id); setCurrentPageIdx(0); setCurrentView("editor")
                }}
                onRenameNote={renameNote}
                onDeleteNote={deleteNote}
                archivedNotes={archivedNotes}
                onArchiveNote={archiveNote}
                onUnarchiveNote={unarchiveNote}
                unlockedIds={unlockedVaults.current}
                onToggleFolder={toggleFolder}
                onRenameFolder={renameFolder}
                onDeleteFolder={deleteFolder}
                onSetRenamingFolder={setRenamingFolder}
                onSetDraggedNoteId={setDraggedNoteId}
                onDropNote={handleDropNote}
                onOpenSettings={() => { if (showSettings) { setShowSettings(false) } else { startTransition(() => { closeAllPanels(); setShowSettings(true) }) } }}
                onOpenTimer={() => setTimerOpen(t => !t)}
                timerOpen={timerOpen}
                onSetNoteParent={setNoteParent}
                onChangeNoteIcon={changeNoteIcon}
                onGoToShelf={() => setCurrentView("shelf")}
                bookmarks={bookmarks}
                onJumpToBookmark={(b) => { editor.flushSync(); setActiveTabId(b.noteId); setCurrentPageIdx(b.pageIdx); setCurrentView("editor") }}
                onReorderBookmarks={(newB) => setBookmarks(newB)}
                onDeleteBookmark={(id) => setBookmarks(prev => prev.filter(b => b.id !== id))}
                onRenameBookmark={(id, newName) => {
                  setBookmarks(prev => prev.map(b => b.id === id ? { ...b, label: newName } : b))
                }}
                onUnlockDev={handleUnlockDev}
                onOpenShop={() => { if (shopOpen) { setShopOpen(false) } else { startTransition(() => { closeAllPanels(); setShopOpen(true) }) } }}
                onOpenLeaderboard={() => { if (leaderboardOpen) { setLeaderboardOpen(false) } else { startTransition(() => { closeAllPanels(); setLeaderboardOpen(true) }) } }}
                onOpenStats={() => { if (statsOpen) { setStatsOpen(false) } else { startTransition(() => { closeAllPanels(); setStatsOpen(true) }) } }}
                onGoHome={() => { closeAllPanels(); setCurrentView("editor") }}
                sap={sap}
                xp={xp}
                totalNotes={notes.filter(n => !n.archived).length}
                totalChars={totalChars}

                onSetCover={(noteId) => {
                  editor.flushSync(); setActiveTabId(noteId); setCurrentPageIdx(0); setCurrentView("editor")
                  setTimeout(() => setShowCoverModal(true), 100)
                }}
              />

              {/* Sidebar edge resize handle */}
              <div
                onMouseDown={(e) => startSidebarDrag(e.clientX)}
                style={{
                  width: 4,
                  height: '100%',
                  cursor: 'col-resize',
                  backgroundColor: 'transparent',
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  userSelect: 'none',
                  zIndex: 300,
                }}
                className="hover:bg-white/10 transition-colors"
              />
            </m.div>
          )}

          {/* Sidebar edge resize handle - disabled for compact collapsible sidebar */}

          {currentView === "shelf" && (<Suspense fallback={null}>
            <div className="absolute inset-0 z-50 anim-fade-in bg-white dark:bg-[#09090b]">
              <ShelfView
                notes={notes}
                onOpenNote={id => { editor.flushSync(); setActiveTabId(id); setCurrentPageIdx(0); setCurrentView("editor") }}
                onCreateNote={() => { addNote(null); setCurrentView("editor") }}
                theme={theme}
              />
            </div>
          </Suspense>)}

          <div className="flex-1 flex flex-col overflow-x-auto overflow-y-hidden relative anim-fade-in" style={{ display: currentView === "shelf" ? "none" : undefined }}>


            {/* ── Bookmark ribbon — placed next to the lightbulb ── */}
            {notes.filter(n => !n.archived).length > 0 && activeNote && (() => {
              const isBookmarked = (bookmarks || []).some(b => b.noteId === activeTabId && b.pageIdx === currentPageIdx)
              const ribbonColor = isBookmarked ? "#E11D48" : (theme === "dark" ? "#3f3f46" : "#c4c4c8")
              return (
                <m.div
                  onClick={() => {
                    const existing = (bookmarks || []).find(b => b.noteId === activeTabId && b.pageIdx === currentPageIdx)
                    if (existing) setBookmarks(prev => prev.filter(b => b.id !== existing.id))
                    else {
                      const titleBox = (activeNote.boxes[currentPageIdx] || []).find(b => b.isTitle)
                      const titleText = titleBox?.content?.replace(/<[^>]*>/g, '').trim()
                      setBookmarks(prev => [...prev, { id: uid(), noteId: activeTabId!, pageIdx: currentPageIdx, noteTitle: activeNote.subject, label: titleText || undefined, icon: activeNote.icon }])
                    }
                  }}
                  animate={{ scaleY: isBookmarked ? 1 : 0.6, opacity: isBookmarked ? 1 : 0.45 }}
                  whileHover={{ scaleY: 1, opacity: 1 }}
                  whileTap={{ scaleY: 0.9 }}
                  transition={{ type: "spring", stiffness: 420, damping: 30 }}
                  style={{
                    position: "absolute",
                    top: 48,
                    left: 104,
                    width: 14,
                    zIndex: 30,
                    cursor: "pointer",
                    transformOrigin: "top",
                    filter: isBookmarked ? "drop-shadow(0 4px 8px rgba(225,29,72,0.5))" : "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                  }}
                >
                  <div style={{
                    width: "100%",
                    height: 52,
                    backgroundColor: ribbonColor,
                    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 50% 88%, 0% 100%)",
                    position: "relative",
                  }}>
                    <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", gap: 5 }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: isBookmarked ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.18)" }} />
                      ))}
                    </div>
                  </div>
                </m.div>
              )
            })()}

            {!showSettings && notes.filter(n => !n.archived).length > 0 && (
              <div className="relative" style={{ pointerEvents: (orchardOpen || statsOpen || leaderboardOpen || shopOpen) ? 'none' : undefined, opacity: (orchardOpen || statsOpen || leaderboardOpen || shopOpen) ? 0 : undefined, height: (orchardOpen || statsOpen || leaderboardOpen || shopOpen) ? 0 : undefined, overflow: (orchardOpen || statsOpen || leaderboardOpen || shopOpen) ? 'hidden' : undefined }}>
                <DocumentToolbar
                  activeTool={activeTool}
                  setActiveTool={setActiveTool}
                  stickyColor={stickyColor}
                  setStickyColor={setStickyColor}
                  accent={accent}
                  theme={theme}
                  zoom={zoom}
                  setZoom={setZoom}
                  gridView={gridView}
                  setGridView={setGridView}
                  setCarouselIdx={setCarouselIdx}
                  sketchMode={sketchMode}
                  setSketchMode={setSketchMode}
                  setSketchPrompt={setSketchPrompt}
                  drawLineMode={drawLineMode}
                  setDrawLineMode={setDrawLineMode}

                  currentPageIdx={currentPageIdx}
                  saveSelection={editor.saveSelection}
                  insertTable={insertTableBox}
                  insertColumns={editor.insertColumns}
                  openAlert={openAlert}
                  clearPage={clearPage}
                  autoAlign={boxes.autoAlign}
                  verticalAlign={boxes.verticalAlign}
                  centerStack={boxes.centerStack}
                  twoColumnGrid={boxes.twoColumnGrid}
                  distributeEvenly={boxes.distributeEvenly}
                  insertCornell={insertCornell}
                  showDrawToolbar={showDrawToolbar}
                  onToggleDrawToolbar={() => {
                    const next = !showDrawToolbar
                    setShowDrawToolbar(next)
                    if (next) {
                      setActiveTool('pen')
                    } else {
                      setActiveTool('select')
                    }
                  }}
                  rightSidebarOpen={timerOpen}
                  setRightSidebarOpen={setTimerOpen}
                  allCompacted={allCompacted}
                  onCompactAll={handleCompactAll}
                  onInsertHR={() => {
                    if (!activeTabId || !paperRef.current) return
                    const hline = { id: uid(), x: 64, y: 200, width: paperRef.current.clientWidth - 128, direction: "horizontal" as const }
                    setNotes(prev => prev.map(n => n.id !== activeTabId ? n : {
                      ...n, hlines: { ...(n.hlines || {}), [currentPageIdx]: [...(n.hlines?.[currentPageIdx] || []), hline] }
                    }))
                  }}
                  onInsertVR={() => {
                    if (!activeTabId || !paperRef.current) return
                    const vline = { id: uid(), x: paperRef.current.clientWidth / 2, y: 64, width: 300, direction: "vertical" as const }
                    setNotes(prev => prev.map(n => n.id !== activeTabId ? n : {
                      ...n, hlines: { ...(n.hlines || {}), [currentPageIdx]: [...(n.hlines?.[currentPageIdx] || []), vline] }
                    }))
                  }}
                  isVault={activeNote?.noteType === "vault"}
                  isUnlocked={activeNote ? unlockedVaults.current.has(activeNote.id) : false}
                  onLock={() => {
                    if (activeNote) {
                      unlockedVaults.current.delete(activeNote.id)
                      setNotes(prev => [...prev])
                    }
                  }}
                  onDownload={() => {
                    if (!activeNote) return
                    const blob = new Blob([JSON.stringify(activeNote, null, 2)], { type: "application/json" })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `${activeNote.subject || "note"}.json`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  onStartSidebarDrag={startSidebarDrag}
                  sidebarWidth={sidebarWidth}
                  isSidebarDragging={isSidebarDragging}
                  sap={isAdmin ? 999999 : sap}
                  userAvatarUrl={user?.user_metadata?.avatar_url}
                  userEmail={user?.email}
                  onOpenLeaderboard={() => { if (leaderboardOpen) { setLeaderboardOpen(false) } else { startTransition(() => { closeAllPanels(); setLeaderboardOpen(true) }) } }}
                  onOpenSettings={() => { if (showSettings) { setShowSettings(false) } else { startTransition(() => { closeAllPanels(); setShowSettings(true) }) } }}
                  sidebarOpen={sidebarWidth > 40}
                  onSidebarToggle={() => setSidebarWidth(sidebarWidth > 40 ? 0 : 240)}
                  onTimerOpen={() => setTimerOpen(!timerOpen)}
                  onOpenShop={() => { if (shopOpen) { setShopOpen(false) } else { startTransition(() => { closeAllPanels(); setShopOpen(true) }) } }}
                  onOpenGrove={() => { startTransition(() => { closeAllPanels(); setOrchardOpen(true) }) }}
                  onInsertImage={() => {
                    if (paperRef.current && activeTabId) {
                      const scale = Number(zoom) || 1
                      const paperW = paperRef.current.clientWidth / scale
                      const scrollTop = paperRef.current.closest('.overflow-y-scroll')?.scrollTop ?? 0
                      const id = uid()
                      const imgBox: TextBoxType = { id, x: (paperW - 300) / 2, y: scrollTop / scale + 100, w: 300, h: 200, content: '' }
                      pendingImageBoxId.current = id
                      setNotes(prev => prev.map(n => n.id !== activeTabId ? n : {
                        ...n, boxes: { ...n.boxes, [currentPageIdx]: [...(n.boxes[currentPageIdx] || []), imgBox] }
                      }))
                    }
                    setShowImageModal(true)
                  }}
                  onOpenAiMenu={(x, y, selectedText, initialPrompt) => setAiMenu({ x, y, selectedText, initialPrompt })}
                  isTextActive={isTextActive}
                  onOpenChat={() => setAiHubOpen(v => !v)}
                  chatOpen={aiHubOpen}
                  strokeColor={strokeColor}
                  onStrokeColorChange={setStrokeColor}
                  lineWidth={lineWidth}
                  onLineWidthChange={setLineWidth}
                  onUndo={drawing.undo}
                  onRedo={drawing.redo}
                  canUndo={drawing.canUndo}
                  canRedo={drawing.canRedo}
                  onClearDrawing={drawing.clearCanvas}
                  onOpenVersionHistory={() => setShowVersionHistory(true)}
                  darkPaper={isDarkPaper(paperStyle)}
                  selectedBoxCount={boxes.selectedBoxIdsRef.current.size}
                  unlockedCosmetics={unlockedCosmetics}
                  goalStreak={goalStreak}
                  quotaTier={quotaTier}
                />
              </div>
            )}


            {/* Floating zoom + undo/redo bar — bottom right */}
            {user && notes.filter(n => !n.archived).length > 0 && !orchardOpen && !statsOpen && !leaderboardOpen && !shopOpen && !showSettings && (
              <div
                className="fixed z-[80] flex items-center gap-1 px-1.5 py-1 rounded-lg shadow-lg"
                style={{
                  bottom: 16, right: 16,
                  background: theme === 'dark' ? 'rgba(24,24,27,0.9)' : 'rgba(255,255,255,0.92)',
                  border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                <button
                  onMouseDown={e => { e.preventDefault(); drawing.undo() }}
                  className={`h-6 w-6 flex items-center justify-center rounded transition-colors ${theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-700' : 'text-zinc-500 hover:bg-zinc-100'}`}
                  style={{ opacity: drawing.canUndo ? 1 : 0.25, cursor: drawing.canUndo ? 'pointer' : 'default' }}
                  title="Undo"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                </button>
                <button
                  onMouseDown={e => { e.preventDefault(); drawing.redo() }}
                  className={`h-6 w-6 flex items-center justify-center rounded transition-colors ${theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-700' : 'text-zinc-500 hover:bg-zinc-100'}`}
                  style={{ opacity: drawing.canRedo ? 1 : 0.25, cursor: drawing.canRedo ? 'pointer' : 'default' }}
                  title="Redo"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                </button>
                <div style={{ width: 1, height: 16, background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', margin: '0 2px' }} />
                <select
                  value={zoom}
                  onChange={e => setZoom(e.target.value)}
                  className={`text-[11px] font-normal rounded px-1.5 py-0.5 outline-none cursor-pointer border-none ${theme === 'dark' ? 'bg-transparent text-zinc-400' : 'bg-transparent text-zinc-500'}`}
                >
                  {[["0.43", "50%"], ["0.64", "75%"], ["0.85", "100%"], ["1.06", "125%"], ["1.28", "150%"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            )}

            <div className="flex-1 flex overflow-x-auto overflow-y-hidden relative">
              {notes.filter(n => !n.archived).length === 0 ? (
                <main className="flex-1 flex items-center justify-center px-4 overflow-hidden">
                  <div className="text-center max-w-md overflow-hidden">
                    {/* Heading */}
                    <h1 className="text-3xl font-normal tracking-tight mb-5" style={{ fontFamily: 'Crimson Pro, serif', color: theme === "dark" ? "#fafafa" : "#1a1a1a" }}>Create your first notebook now.</h1>

                    {/* Primary Button */}
                    <AnimatedCreateButton onClick={addFirstNotebook} accent={accent} theme={theme} />

                    {/* Quick Tips */}
                    <div className="mt-5 pt-4" style={{ borderTop: theme === "dark" ? "1px solid #333" : "1px solid #ddd" }}>
                      <p className="text-xs font-normal mb-2" style={{ color: theme === "dark" ? "#888" : "#999" }}>Quick Tips</p>
                      <ul className="text-xs space-y-1.5 flex flex-col items-center" style={{ color: theme === "dark" ? "#999" : "#777" }}>
                        <li className="flex items-center gap-2">📝 <span style={{ opacity: 0.3 }}>|</span> Press <code style={{ background: theme === "dark" ? "#1a1a1a" : "#f0f0f0", padding: "2px 6px", borderRadius: "3px", fontFamily: "monospace", marginLeft: "4px" }}>Ctrl+N</code> to create notes</li>
                        <li className="flex items-center gap-2">🔍 <span style={{ opacity: 0.3 }}>|</span> Press <code style={{ background: theme === "dark" ? "#1a1a1a" : "#f0f0f0", padding: "2px 6px", borderRadius: "3px", fontFamily: "monospace", marginLeft: "4px" }}>Ctrl+K</code> to search</li>
                        <li className="flex items-center gap-2">🤖 <span style={{ opacity: 0.3 }}>|</span> Press <code style={{ background: theme === "dark" ? "#1a1a1a" : "#f0f0f0", padding: "2px 6px", borderRadius: "3px", fontFamily: "monospace", marginLeft: "4px" }}>\</code> for AI editing</li>
                      </ul>
                    </div>

                    {/* Theme Toggle */}
                    <div className="mt-4 flex items-center justify-center">
                      <div
                        onClick={() => updateSettings({ theme: theme === "light" ? "dark" : "light" })}
                        className="relative flex items-center rounded-full px-1 py-1 transition-all cursor-pointer group"
                        style={{
                          backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                          border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)"}`,
                          width: 72,
                          height: 32,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <div style={{ flex: 1, display: "flex", justifyContent: "center", color: theme === "light" ? "#fbbf24" : "#888", zIndex: 10, position: "relative" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <circle cx="12" cy="12" r="5" />
                            <line x1="12" y1="1" x2="12" y2="3" strokeWidth="2" stroke="currentColor" />
                            <line x1="12" y1="21" x2="12" y2="23" strokeWidth="2" stroke="currentColor" />
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeWidth="2" stroke="currentColor" />
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeWidth="2" stroke="currentColor" />
                            <line x1="1" y1="12" x2="3" y2="12" strokeWidth="2" stroke="currentColor" />
                            <line x1="21" y1="12" x2="23" y2="12" strokeWidth="2" stroke="currentColor" />
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" strokeWidth="2" stroke="currentColor" />
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" strokeWidth="2" stroke="currentColor" />
                          </svg>
                        </div>
                        <m.div
                          initial={false}
                          animate={{ x: theme === "dark" ? 36 : 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            backgroundColor: theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.9)",
                            position: "absolute",
                            left: 4,
                            zIndex: 0,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)"
                          }}
                        />
                        <div style={{ flex: 1, display: "flex", justifyContent: "center", color: theme === "dark" ? "#fbbf24" : "#888", zIndex: 10, position: "relative" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </main>
              ) : gridView ? (
                <GridView activeNote={activeNote} activeTabId={activeTabId} carouselIdx={carouselIdx} lineSpacing={lineSpacing} paperStyle={paperStyle} theme={theme} editorFont={editorFont} accent={accent} setCarouselIdx={setCarouselIdx} setGridView={setGridView} setCurrentPageIdx={setCurrentPageIdx} setNotes={setNotes} bookmarks={bookmarks} />
              ) : (
                <main ref={scrollContainerRef} className="flex-1 shrink-0 overflow-y-scroll px-8 pt-6 pb-8 flex justify-center items-start relative" style={{ backgroundColor: theme === "dark" ? "#09090b" : "#F5F5F5", scrollbarGutter: "stable", overflowX: "hidden", minWidth: 600 }}>
                  <div style={{ zoom: parseFloat(zoom), transformOrigin: "top center", margin: "0 auto", minWidth: 580, maxWidth: 960, paddingLeft: showBinding && !bindingCompact ? 16 : 0 }} className="w-full shrink-0">
                    {/* Scroll mode: preceding pages */}
                    {scrollMode && activeNote.pages.map((pageHtml, idx) => {
                      if (idx >= currentPageIdx) return null
                      const inkColor = getInkColor(paperStyle, theme === "dark")
                      return (
                        <div key={`scroll-page-${idx}`} ref={el => { if (el) scrollPageRefs.current.set(idx, el); else scrollPageRefs.current.delete(idx) }} style={{ marginBottom: 32 }}>
                          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 0", marginBottom: 8 }}>
                            <div style={{ flex: 1, height: 1, background: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
                            <span style={{ padding: "0 12px", fontFamily: "Crimson Pro, serif", fontSize: 12, color: theme === "dark" ? "#71717a" : "#a1a1aa", userSelect: "none" }}>Page {idx + 1}</span>
                            <div style={{ flex: 1, height: 1, background: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
                          </div>
                          <ScrollModePage
                            pageIdx={idx}
                            html={sanitizeHTML(pageHtml || "")}
                            boxes={activeNote.boxes[idx] || []}
                            isActive={false}
                            onClick={() => handleScrollPageClick(idx)}
                            paperBg={paperBg}
                            paperImg={paperImg}
                            paperSize={paperSize}
                            theme={theme}
                            editorFont={editorFont}
                            baseFontSize={baseFontSize}
                            paperStyle={paperStyle}
                            inkColor={inkColor}
                          />
                        </div>
                      )
                    })}
                    {/* Active page divider in scroll mode */}
                    {scrollMode && currentPageIdx > 0 && (
                      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 0", marginBottom: 8 }}>
                        <div style={{ flex: 1, height: 1, background: accent }} />
                        <span style={{ padding: "0 12px", fontFamily: "Crimson Pro, serif", fontSize: 12, color: accent, fontWeight: 600, userSelect: "none" }}>Page {currentPageIdx + 1}</span>
                        <div style={{ flex: 1, height: 1, background: accent }} />
                      </div>
                    )}
                    <div style={{ position: "relative", overflow: "visible" }} ref={el => { if (el && scrollMode) scrollPageRefs.current.set(currentPageIdx, el); }} data-page-idx={currentPageIdx}>
                      <div style={{ position: "relative", overflow: "visible" }}>
                        {!scrollMode && <div style={{ position: "absolute", top: 0, left: 4, right: -4, bottom: -2, backgroundColor: paperBg, borderRadius: 2, zIndex: 1, boxShadow: "2px 2px 10px rgba(0,0,0,0.08)", filter: "brightness(0.97)" }} />}
                        {!scrollMode && <div style={{ position: "absolute", top: 0, left: 8, right: -8, bottom: -4, backgroundColor: paperBg, borderRadius: 2, zIndex: 0, boxShadow: "2px 4px 12px rgba(0,0,0,0.06)", filter: "brightness(0.94)" }} />}
                        {!scrollMode && <div style={{ position: "absolute", top: 0, left: 12, right: -12, bottom: -6, backgroundColor: paperBg, borderRadius: 2, zIndex: -1, filter: "brightness(0.91)" }} />}

                        <SpiralBinding theme={theme} showBinding={showBinding} bindingCompact={bindingCompact} paperBg={paperBg} />


                        <div ref={paperRef} id="editor-paper" className="relative" style={{ minHeight: "1100px", overflow: "hidden", cursor: activeTool === 'pan' ? 'grab' : activeTool === 'sticky' || activeTool === 'hr' || activeTool === 'vr' || activeTool === 'textbox' || activeTool === 'image' ? 'crosshair' : activeTool === 'text' || activeTool === 'select' ? 'default' : 'crosshair', backgroundColor: paperBg, backgroundImage: paperImg, backgroundSize: paperSize, zIndex: 2, boxShadow: theme === "dark" ? "0 25px 50px -12px rgba(0,0,0,0.7), 0 8px 24px -8px rgba(0,0,0,0.6)" : "1px 1px 1px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.05), 0 8px 16px rgba(0,0,0,0.05), 0 16px 32px rgba(0,0,0,0.05), 0 32px 64px rgba(0,0,0,0.05)" }}
                          onMouseDown={e => {
                            if (activeTool === 'sticky' || activeTool === 'hr' || activeTool === 'vr' || activeTool === 'image') {
                              return
                            }
                            if (activeTool !== 'select' && activeTool !== 'text' && activeTool !== 'textbox') return
                            const target = e.target as HTMLElement
                            const boxEl = target.closest('[id^="box-"]') as HTMLElement | null
                            if (boxEl) {
                              const boxId = boxEl.id.replace('box-', '')
                              const box = (activeNote.boxes[currentPageIdx] || []).find(b => b.id === boxId)
                              if (!box || box.content.trim() !== '' || box.boxHighlightColor) return
                            }
                            // Remove empty non-sticky, non-title boxes before creating new ones
                            const emptyIds = (activeNote.boxes[currentPageIdx] || [])
                              .filter(b => b.content.trim() === '' && !b.boxHighlightColor && !b.isTitle)
                              .map(b => b.id)
                            if (emptyIds.length > 0) {
                              setNotes(prev => prev.map(n => n.id !== activeTabId ? n : {
                                ...n, boxes: { ...n.boxes, [currentPageIdx]: (n.boxes[currentPageIdx] || []).filter(b => !emptyIds.includes(b.id)) }
                              }))
                            }
                            boxes.onPaperMouseDown(e)
                          }}
                          onClick={e => {
                            const target = e.target as HTMLElement
                            if (target.closest('[id^="box-"]')) return
                            if (activeTool === 'sticky') {
                              placeStickyNote(e)
                            } else if (activeTool === 'hr') {
                              placeHorizontalLine(e)
                            } else if (activeTool === 'vr') {
                              placeVerticalLine(e)
                            } else if (activeTool === 'image') {
                              placeImageBox(e)
                            }
                          }}
                        >
                          {activeNote.noteType === "vault" && !unlockedVaults.current.has(activeNote.id) ? (
                            <div className="absolute inset-0 z-[60] bg-zinc-900/5 backdrop-blur-[1px] flex flex-col items-center justify-start pt-60 p-10 select-none pointer-events-none">
                              <div className="bg-white/90 dark:bg-zinc-900/90 p-10 rounded-3xl shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col items-center gap-5 text-center anim-fade-in pointer-events-auto" style={{ filter: 'url(#handwritten-jitter-subtle)' }}>
                                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 dark:text-zinc-300"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                </div>
                                <div>
                                  <h3 className="text-xl font-normal text-zinc-800 dark:text-zinc-100 tracking-widest" style={{ fontFamily: 'Crimson Pro, serif' }}>Vault Locked</h3>
                                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-[200px]">This notebook is securely encrypted.</p>
                                </div>
                                <button
                                  onClick={() => {
                                    const n = notes.find(x => x.id === activeNote.id)
                                    if (n) {
                                      openPrompt("Vault Locked", "", "Enter password", "Unlock", pwd => {
                                        if (pwd === (n.password || "")) {
                                          unlockedVaults.current.add(n.id)
                                          setNotes(prev => [...prev])
                                        } else {
                                          openAlert("Access Denied", "Incorrect password.")
                                        }
                                      })
                                    }
                                  }}
                                  className="mt-2 px-8 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-normal rounded-full shadow-lg transition-all active:scale-95 uppercase tracking-widest"
                                >
                                  Unlock Now
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="absolute left-28 top-0 bottom-0 w-[1px] z-20 pointer-events-none" style={{ backgroundColor: theme === "dark" ? "rgba(248,113,113,0.3)" : "rgba(252,165,165,0.6)" }} />
                              {smearEffect && <div className="absolute top-0 left-0 bottom-0 pointer-events-none" style={{ width: 220, background: "linear-gradient(to right, rgba(0,0,0,0.065) 0%, rgba(0,0,0,0.018) 50%, transparent 100%)", zIndex: 21 }} />}

                              {/* Render custom user-drawn lines */}
                              {(() => {
                                // Use lineSelectionVersion to force re-render on line selection change
                                boxes.lineSelectionVersion
                                return (activeNote.lines?.[currentPageIdx] || []).map((lx, idx) => {
                                  const isSelected = boxes.selectedLineRef.current === lx
                                  return (
                                    <div key={idx} className="absolute top-0 bottom-0 z-20 pointer-events-none transition-all" style={{
                                      left: lx,
                                      width: isSelected ? "3px" : "1.5px",
                                      backgroundColor: isSelected ? accent : (theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"),
                                      borderLeft: isSelected ? `2px solid ${accent}` : `1px dashed ${theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                                      opacity: isSelected ? 1 : 0.6,
                                      boxShadow: isSelected ? `0 0 12px ${accent}33` : undefined
                                    }} />
                                  )
                                })
                              })()}

                              {/* Render lines (horizontal and vertical) */}
                              {(() => {
                                boxes.hlineSelectionVersion
                                return (activeNote.hlines?.[currentPageIdx] || []).map(hl => {
                                  const isSelected = boxes.selectedHLineIdsRef.current.has(hl.id)
                                  const isVertical = hl.direction === "vertical"
                                  const lineColor = isSelected ? accent : getInkColor(paperStyle, theme === "dark")
                                  const lineW = isSelected ? 2.5 : 1.8

                                  if (isVertical) {
                                    return (
                                      <div key={hl.id} className="absolute z-20" style={{
                                        left: hl.x - 4, top: hl.y, width: 8, height: hl.width,
                                        cursor: isSelected ? 'grab' : 'pointer',
                                      }}>
                                        <svg width="8" height="100%" style={{ overflow: 'visible', filter: 'url(#hand-rule-v)' }}>
                                          <line x1="4" y1="0" x2="4" y2="100%"
                                            stroke={lineColor} strokeWidth={lineW} strokeLinecap="round"
                                          />
                                        </svg>
                                        {isSelected && <>
                                          <div className="absolute inset-0 rounded" style={{ boxShadow: `0 0 8px ${accent}44`, border: `1px solid ${accent}55` }} />
                                          <div className="absolute left-1/2 -translate-x-1/2" style={{ top: -5, width: 10, height: 10, borderRadius: '50%', background: accent, cursor: 'n-resize', border: '2px solid white' }}
                                            onMouseDown={e => {
                                              e.stopPropagation(); const startX = e.clientX; const startY = e.clientY; const origX = hl.x; const origY = hl.y; const origW = hl.width; const scale = Number(zoom) || 1
                                              const onMove = (ev: MouseEvent) => {
                                                let dy = (ev.clientY - startY) / scale; const dx = (ev.clientX - startX) / scale; const newY = origY + dy; const newW = origW - dy; if (newW < 20) return
                                                const newX = ev.shiftKey ? origX : origX + dx
                                                setNotes(prev => prev.map(n => n.id !== activeTabId ? n : { ...n, hlines: { ...(n.hlines || {}), [currentPageIdx]: (n.hlines?.[currentPageIdx] || []).map(h => h.id !== hl.id ? h : { ...h, x: newX, y: newY, width: newW }) } }))
                                              }
                                              const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
                                              window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
                                            }}
                                          />
                                          <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: -5, width: 10, height: 10, borderRadius: '50%', background: accent, cursor: 's-resize', border: '2px solid white' }}
                                            onMouseDown={e => {
                                              e.stopPropagation(); const startX = e.clientX; const startY = e.clientY; const origX = hl.x; const origW = hl.width; const scale = Number(zoom) || 1
                                              const onMove = (ev: MouseEvent) => {
                                                const dy = (ev.clientY - startY) / scale; const dx = (ev.clientX - startX) / scale; const newW = origW + dy; if (newW < 20) return
                                                const newX = ev.shiftKey ? origX : origX + dx
                                                setNotes(prev => prev.map(n => n.id !== activeTabId ? n : { ...n, hlines: { ...(n.hlines || {}), [currentPageIdx]: (n.hlines?.[currentPageIdx] || []).map(h => h.id !== hl.id ? h : { ...h, x: newX, width: newW }) } }))
                                              }
                                              const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
                                              window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
                                            }}
                                          />
                                        </>}
                                      </div>
                                    )
                                  }

                                  return (
                                    <div key={hl.id} className="absolute z-20" style={{
                                      left: hl.x, top: hl.y - 4, width: hl.width, height: 8,
                                      cursor: isSelected ? 'grab' : 'pointer',
                                    }}>
                                      <svg width="100%" height="8" style={{ overflow: 'visible', filter: 'url(#hand-rule)' }}>
                                        <line x1="0" y1="4" x2="100%" y2="4"
                                          stroke={lineColor} strokeWidth={lineW} strokeLinecap="round"
                                        />
                                      </svg>
                                      {isSelected && <>
                                        <div className="absolute inset-0 rounded" style={{ boxShadow: `0 0 8px ${accent}44`, border: `1px solid ${accent}55` }} />
                                        <div className="absolute top-1/2 -translate-y-1/2" style={{ left: -5, width: 10, height: 10, borderRadius: '50%', background: accent, cursor: 'w-resize', border: '2px solid white' }}
                                          onMouseDown={e => {
                                            e.stopPropagation(); const startX = e.clientX; const startY = e.clientY; const origX = hl.x; const origY = hl.y; const origW = hl.width; const scale = Number(zoom) || 1
                                            const onMove = (ev: MouseEvent) => {
                                              const dx = (ev.clientX - startX) / scale; const dy = (ev.clientY - startY) / scale; const newX = origX + dx; const newW = origW - dx; if (newW < 20) return
                                              const newY = ev.shiftKey ? origY : origY + dy
                                              setNotes(prev => prev.map(n => n.id !== activeTabId ? n : { ...n, hlines: { ...(n.hlines || {}), [currentPageIdx]: (n.hlines?.[currentPageIdx] || []).map(h => h.id !== hl.id ? h : { ...h, x: newX, y: newY, width: newW }) } }))
                                            }
                                            const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
                                            window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
                                          }}
                                        />
                                        <div className="absolute top-1/2 -translate-y-1/2" style={{ right: -5, width: 10, height: 10, borderRadius: '50%', background: accent, cursor: 'e-resize', border: '2px solid white' }}
                                          onMouseDown={e => {
                                            e.stopPropagation(); const startX = e.clientX; const startY = e.clientY; const origY = hl.y; const origW = hl.width; const scale = Number(zoom) || 1
                                            const onMove = (ev: MouseEvent) => {
                                              const dx = (ev.clientX - startX) / scale; const dy = (ev.clientY - startY) / scale; const newW = origW + dx; if (newW < 20) return
                                              const newY = ev.shiftKey ? origY : origY + dy
                                              setNotes(prev => prev.map(n => n.id !== activeTabId ? n : { ...n, hlines: { ...(n.hlines || {}), [currentPageIdx]: (n.hlines?.[currentPageIdx] || []).map(h => h.id !== hl.id ? h : { ...h, y: newY, width: newW }) } }))
                                            }
                                            const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
                                            window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
                                          }}
                                        />
                                      </>}
                                    </div>
                                  )
                                })
                              })()}

                              {/* Cover display on first page */}
                              {activeNote.cover && currentPageIdx === 0 && (
                                <div style={{ width: "100%", marginBottom: 16, borderRadius: 6, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}>
                                  <img src={activeNote.cover} style={{ width: "100%", display: "block" }} alt="Notebook Cover" />
                                </div>
                              )}

                              <div
                                ref={editorRef}
                                className={`w-full min-h-[1000px] outline-none pointer-events-none transition-opacity duration-300 ${focusMode ? "opacity-40 focus-within:opacity-100" : ""}`}
                                style={{
                                  fontFamily: `"${editorFont}", Crimson Pro, serif`,
                                  fontSize: baseFontSize === "small" ? 14 : baseFontSize === "large" ? 22 : 18,
                                  filter: "url(#handwritten-jitter-subtle)",
                                  fontWeight: 400,
                                  letterSpacing: "0.1px",
                                  lineHeight: 1.8,
                                }}
                                spellCheck={spellCheck}
                                autoCorrect={autoCorrect ? "on" : "off"}
                                autoCapitalize={autoCapitalize ? "on" : "off"}
                              />

                              <style>{`
                             #editor-paper [contenteditable] {
                               color: ${getInkColor(paperStyle, theme === "dark")} !important;
                               caret-color: ${accent.length > 7 ? accent.slice(0, 7) : accent} !important;
                               opacity: 1 !important;
                               font-family: "${editorFont}", Crimson Pro, serif !important;
                               font-weight: 500 !important;
                               letter-spacing: 0.1px !important;
                               line-height: 1.8 !important;
                               text-rendering: optimizeLegibility !important;
                             }
                             @keyframes box-ripple {
                               0%   { inset: 0px;   opacity: 0.6; }
                               100% { inset: -10px; opacity: 0; }
                             }
                             @keyframes box-ripple-2 {
                               0%   { inset: 0px;   opacity: 0.25; }
                               100% { inset: -18px; opacity: 0; }
                             }
                             #editor-paper [contenteditable]:empty:focus::after,
                             #editor-paper [contenteditable]:has(> br:only-child):focus::after {
                               content: "@ tools  ·  \\\\ AI";
                               color: ${theme === "dark" ? "rgba(161,161,170,0.6)" : "rgba(0,0,0,0.35)"};
                               font-style: italic;
                               font-size: 13px;
                               font-weight: 400;
                               pointer-events: none;
                               user-select: none;
                               font-family: "${editorFont}", Crimson Pro, serif;
                               line-height: inherit;
                               letter-spacing: inherit;
                               position: absolute;
                               top: 0.35em;
                             }
                             #editor-paper ul { list-style-type: disc !important; padding-left: 1.5em !important; margin: 0.25em 0 !important; }
                             #editor-paper ol { list-style-type: decimal !important; padding-left: 1.5em !important; margin: 0.25em 0 !important; }
                             #editor-paper li { margin-bottom: 0.15em !important; }
                             .pulp-table-wrap { position: relative; }
                             .pulp-table-wrap::before {
                               content: "⠿";
                               position: absolute;
                               top: -14px;
                               left: -2px;
                               font-size: 14px;
                               line-height: 1;
                               color: transparent;
                               cursor: grab;
                               z-index: 2;
                               user-select: none;
                               transition: color 0.15s;
                             }
                             .pulp-table-wrap:hover::before { color: ${accent}88; }
                             .pulp-table-wrap:hover { outline: 2px solid ${accent}33; outline-offset: 4px; border-radius: 4px; }
                             .pulp-table-wrap.pulp-table-selected { outline: 2px solid ${accent}; outline-offset: 4px; border-radius: 4px; }
                             .pulp-table-wrap.pulp-table-selected::before { color: ${accent}; }
                           `}</style>

                              {/* Selection rectangle — always in DOM, shown/hidden via direct DOM style */}
                              <div
                                ref={boxes.selectionRectRef}
                                style={{
                                  display: "none",
                                  position: "absolute",
                                  left: 0, top: 0, width: 0, height: 0,
                                  backgroundColor: "rgba(217, 119, 6, 0.12)",
                                  border: "1.5px solid rgba(217, 119, 6, 0.45)",
                                  boxShadow: "0 0 25px -5px rgba(217, 119, 6, 0.3)",
                                  borderRadius: 0,
                                  pointerEvents: "none",
                                  zIndex: 10000,
                                }}
                              />

                              {/* Drawing canvas overlay */}
                              <canvas
                                ref={canvasRef}
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  top: 0,
                                  pointerEvents: showDrawToolbar && !['select', 'pan', 'text', 'sticky', 'hline', 'vr'].includes(activeTool) ? 'all' : 'none',
                                  cursor: drawing.getCursor(),
                                  zIndex: showDrawToolbar ? 200 : 5,
                                  touchAction: "none",
                                }}
                                onPointerDown={drawing.onPointerDown}
                                onPointerMove={drawing.onPointerMove}
                                onPointerUp={drawing.onPointerUp}
                                onPointerCancel={drawing.onPointerUp}
                              />

                              {(activeNote.boxes[currentPageIdx] || []).map(box => (
                                <BoxItem
                                  key={box.id}
                                  box={box}
                                  isSelected={boxes.selectedBoxIdsRef.current.has(box.id)}
                                  selectedCount={boxes.selectedBoxIdsRef.current.size}
                                  loadingBoxId={boxes.loadingBoxId}
                                  accentSolid={accentSolid}
                                  theme={theme}
                                  paperStyle={paperStyle}
                                  startDrag={boxes.startDrag}
                                  startResize={boxes.startResize}
                                  deleteBox={boxes.deleteBox}
                                  updateBox={boxes.updateBox}
                                  updateBoxContent={boxes.updateBoxContent}
                                  setSelectedBoxIds={boxes.setSelectedBoxIds}
                                  onKeyDown={handleEditorKeyDown}
                                  onInput={handleEditorInput}
                                  onRewrite={boxes.rewriteBox}
                                  onImageGen={boxes.generateSketch}
                                  formattingOpen={boxes.selectedBoxIdsRef.current.has(box.id) && toolbarFormattingOpen}
                                  setFormattingOpen={setToolbarFormattingOpen}
                                  aiOpen={boxes.selectedBoxIdsRef.current.has(box.id) && toolbarAiOpen}
                                  setAiOpen={setToolbarAiOpen}
                                  onDragStart={noop}
                                  onDragEnd={noop}
                                  spellCheck={spellCheck}
                                  handwrittenEffect={handwrittenEffect}
                                />
                              ))}
                            </>
                          )}

                          {/* Page Navigation + Bookmark — generous deadzone prevents accidental textbox creation */}
                          <div
                            className="absolute top-0 right-0 z-50 no-print select-none"
                            style={{ padding: "12px 10px 16px 20px" }}
                            onMouseDown={e => e.stopPropagation()}
                            onPointerDown={e => e.stopPropagation()}
                            onClick={e => e.stopPropagation()}
                          >
                            <div
                              className="flex items-center gap-0.5"
                              onMouseDown={e => e.stopPropagation()}
                              onPointerDown={e => e.stopPropagation()}
                            >
                              {!scrollMode && <>
                              {/* Previous — hold 500ms to jump to first */}
                              <button
                                disabled={currentPageIdx === 0}
                                onMouseDown={() => {
                                  const timer = setTimeout(() => { editor.flushSync(); setCurrentPageIdx(0) }, 500);
                                  const up = () => { clearTimeout(timer); window.removeEventListener('mouseup', up) };
                                  window.addEventListener('mouseup', up)
                                }}
                                onClick={() => { editor.flushSync(); setCurrentPageIdx((p: number) => p - 1) }}
                                className={`p-1.5 rounded-md transition-all ${currentPageIdx === 0 ? "opacity-40" : "hover:bg-black/8 hover:scale-110 active:scale-95"}`}
                                style={{ color: "#3f3f46" }}
                                title="Previous Page (hold for first)"
                              >
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                              </button>
                              </>}
                              <PageNumberInput
                                currentPageIdx={currentPageIdx}
                                totalPages={activeNote.pages.length}
                                theme={theme}
                                onOpenGrid={() => { setCarouselIdx(currentPageIdx); setGridView(v => !v) }}
                              />
                              {!scrollMode && <>
                              {/* Next — hold 500ms to jump to last */}
                              <button
                                onMouseDown={() => {
                                  const timer = setTimeout(() => { editor.flushSync(); setCurrentPageIdx(activeNote.pages.length - 1) }, 500);
                                  const up = () => { clearTimeout(timer); window.removeEventListener('mouseup', up) };
                                  window.addEventListener('mouseup', up)
                                }}
                                onClick={() => {
                                  editor.flushSync();
                                  if (currentPageIdx < activeNote.pages.length - 1) setCurrentPageIdx((p: number) => p + 1);
                                  else {
                                    const np = [...activeNote.pages, ""];
                                    const pageIdx = activeNote.pages.length
                                    setNotes(prev => prev.map(n => n.id === activeTabId ? { ...n, pages: np, boxes: { ...n.boxes, [pageIdx]: [{ id: uid(), x: 40, y: 40, w: 900, h: 32, content: '' }] } } : n));
                                    setCurrentPageIdx(pageIdx)
                                  }
                                }}
                                className="p-1.5 hover:bg-black/8 hover:scale-110 active:scale-95 rounded-md transition-all"
                                style={{ color: "#3f3f46" }}
                                title="Next Page / Add Page (hold for last)"
                              >
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                              </button>
                              </>}
                            </div>{/* end inner flex */}

                          </div>{/* end deadzone */}

                        </div>
                      </div>
                      {!scrollMode && <div style={{ height: 60, marginTop: -8, background: "radial-gradient(ellipse 90% 55% at 46% 0%, rgba(0,0,0,0.22) 0%, transparent 70%)", pointerEvents: "none", position: "relative", zIndex: 0 }} />}
                    </div>
                    {/* Scroll mode: following pages */}
                    {scrollMode && activeNote.pages.map((pageHtml, idx) => {
                      if (idx <= currentPageIdx) return null
                      const inkColor = getInkColor(paperStyle, theme === "dark")
                      return (
                        <div key={`scroll-page-${idx}`} ref={el => { if (el) scrollPageRefs.current.set(idx, el); else scrollPageRefs.current.delete(idx) }} style={{ marginTop: 32 }}>
                          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 0", marginBottom: 8 }}>
                            <div style={{ flex: 1, height: 1, background: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
                            <span style={{ padding: "0 12px", fontFamily: "Crimson Pro, serif", fontSize: 12, color: theme === "dark" ? "#71717a" : "#a1a1aa", userSelect: "none" }}>Page {idx + 1}</span>
                            <div style={{ flex: 1, height: 1, background: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
                          </div>
                          <ScrollModePage
                            pageIdx={idx}
                            html={sanitizeHTML(pageHtml || "")}
                            boxes={activeNote.boxes[idx] || []}
                            isActive={false}
                            onClick={() => handleScrollPageClick(idx)}
                            paperBg={paperBg}
                            paperImg={paperImg}
                            paperSize={paperSize}
                            theme={theme}
                            editorFont={editorFont}
                            baseFontSize={baseFontSize}
                            paperStyle={paperStyle}
                            inkColor={inkColor}
                          />
                        </div>
                      )
                    })}
                  </div>
                  {/* Botanical margin engravings */}
                  <MarginEngravings theme={theme} />
                </main>
              )}

            </div>

          </div>

          {orchardOpen && <Suspense fallback={null}><div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: sidebarWidth > 40 ? 72 : 0, zIndex: 50 }}>
            <OrchardView
              isOpen={orchardOpen}
              onClose={() => setOrchardOpen(false)}
              theme={theme}
              accent={accent}
              sap={sap}
              xp={xp}
              grove={grove}
              inventory={inventory}
              setSap={setSap}
              setInventory={setInventory}
              setGrove={setGrove}
              notes={notes}
              userId={user?.id}
              activeTabId={activeTabId}
              orchardTimeMode={orchardTimeMode || "theme"}
              onOpenLeaderboard={() => { if (leaderboardOpen) { setLeaderboardOpen(false) } else { startTransition(() => { closeAllPanels(); setLeaderboardOpen(true) }) } }}
              onOpenShop={() => { startTransition(() => { closeAllPanels(); setShopOpen(true) }) }}
              onOpenSatchel={() => { startTransition(() => { closeAllPanels(); setShopOpen(true); setShopInitialTab('satchel') }) }}
              onOpenSettings={() => { startTransition(() => { closeAllPanels(); setShowSettings(true) }) }}
              goalStreak={goalStreak}
              quotaTier={quotaTier}
              reduceMotion={reduceMotion}
            />
          </div></Suspense>}

          {statsOpen && <Suspense fallback={null}>
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: sidebarWidth > 40 ? 72 : 0, zIndex: 50 }}>
              <DashboardView
                isOpen={statsOpen}
                onClose={() => setStatsOpen(false)}
                theme={theme}
                xp={xp}
                grove={grove}
                inventory={inventory}
                activeNotebookId={activeTabId ?? undefined}
                activeNotebookName={notes.find(n => n.id === activeTabId)?.subject}
                achievements={achievements}
                notes={notes}
                goalStreak={goalStreak}
                sap={sap}
                dailyGoalMinutes={dailyGoalMinutes}
                hibernation={hibernation}
                hibernationScheduled={hibernationScheduled}
                quotaTier={quotaTier}
              />
            </div>
          </Suspense>}

          {leaderboardOpen && (
            <motion.div key="leaderboard-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme === 'dark' ? '#18181b' : '#fafaf9' }}>
              <button onClick={() => setLeaderboardOpen(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 28 }}>&times;</button>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 32, color: '#d97706', marginBottom: 8 }}>Leaderboard</p>
                <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, color: theme === 'dark' ? '#a1a1aa' : '#71717a' }}>Coming soon</p>
              </div>
            </motion.div>
          )}

          {shopOpen && <Suspense fallback={null}>
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: sidebarWidth > 40 ? 72 : 0, zIndex: 50 }}><BoutiqueView
              isOpen={shopOpen}
              onClose={() => { setShopOpen(false); setShopInitialTab('shop'); setShopScrollTo(undefined) }}
              theme={theme}
              accent={accent}
              sap={isAdmin ? 999999 : sap}
              inventory={inventory}
              setSap={setSap}
              setInventory={setInventory}
              setGrove={setGrove}
              onUpdateConfig={updateSettings}
              initialTab={shopInitialTab}
              initialScrollTo={shopScrollTo}
              isAdmin={isAdmin}
            /></div>
          </Suspense>}

          {!showSettings && notes.filter(n => !n.archived).length > 0 && !gridView && (
            <HangingOrange retracted={!!quizState || showVersionHistory || showNotebookChat || statsOpen || shopOpen} aiMode={aiHubOpen} onClick={() => { if (orchardOpen) { setOrchardOpen(false) } else { startTransition(() => { closeAllPanels(); setOrchardOpen(true) }) } }} />
          )}

          <OrangeAIHub
            open={aiHubOpen}
            theme={theme}
            accent={accent}
            noteText={activeNote ? htmlToPlain(activeNote.pages.join("\n")) : undefined}
            noteName={activeNote?.subject}
            userId={user?.id}
            onClose={() => setAiHubOpen(false)}
            onInsertText={text => editor.insertHTML(text.replace(/\n/g, "<br>"))}
            onReplaceSelection={text => { document.execCommand("insertText", false, text) }}
          />

          {slashMenu && (
            <SlashMenu
              {...slashMenu}
              accent={accent}
              theme={theme}
              box={slashMenu.target?.closest('[id^="box-"]') ? activeNote.boxes[currentPageIdx]?.find(b => b.id === slashMenu.target?.closest('[id^="box-"]')?.id.replace("box-", "")) : undefined}
              onUpdateBox={boxes.updateBox}
              onSelect={executeSlashItem}
              onClose={() => dismissSlashMenu(true)}
              execCmd={editor.execCmd}
              insertHTML={editor.insertHTML}
              toggleScript={editor.toggleScript}
              insertBacklink={insertBacklink}
              onInsertImage={() => { dismissSlashMenu(true); setShowImageModal(true) }}
              onInsertHLine={() => {
                if (!activeTabId || !paperRef.current) return
                const cursorY = slashMenu ? slashMenu.y : 200
                const hrBox: TextBoxType = { id: uid(), x: 40, y: cursorY, w: paperRef.current.clientWidth - 80, h: 8, content: '<hr style="border:none;border-top:2px solid rgba(0,0,0,0.15);margin:0">' }
                setNotes(prev => prev.map(n => n.id !== activeTabId ? n : {
                  ...n, boxes: { ...n.boxes, [currentPageIdx]: [...(n.boxes[currentPageIdx] || []), hrBox] }
                }))
              }}
              onInsertVLine={() => {
                if (!activeTabId || !paperRef.current) return
                const r = paperRef.current.getBoundingClientRect()
                const scale = Number(zoom) || 1
                const x = slashMenu ? (slashMenu.x - r.left) / scale : paperRef.current.clientWidth / (2 * scale)
                const y = slashMenu ? (slashMenu.y - r.top) / scale : 200
                const vrBox: TextBoxType = { id: uid(), x, y, w: 8, h: 300, content: '<div style="width:2px;height:100%;background:rgba(0,0,0,0.15);margin:0 auto"></div>' }
                setNotes(prev => prev.map(n => n.id !== activeTabId ? n : {
                  ...n, boxes: { ...n.boxes, [currentPageIdx]: [...(n.boxes[currentPageIdx] || []), vrBox] }
                }))
              }}
              onInsertTitle={() => {
                if (!activeTabId) return
                const titleBox: TextBoxType = { id: uid(), x: 40, y: 24, w: 900, h: 50, content: '', boxHeadingStyle: 'h1', boxFontSize: 28, isTitle: true }
                setNotes(prev => prev.map(n => {
                  if (n.id !== activeTabId) return n
                  const pageBoxes = n.boxes[currentPageIdx] || []
                  const existing = pageBoxes.find(b => b.isTitle)
                  if (existing) return n
                  return { ...n, boxes: { ...n.boxes, [currentPageIdx]: [titleBox, ...pageBoxes] } }
                }))
                setTimeout(() => {
                  const el = document.getElementById(`box-${titleBox.id}`)
                  if (el) {
                    const editable = el.querySelector('[contenteditable]') as HTMLElement
                    if (editable) { editable.focus() }
                  }
                }, 50)
              }}
            />
          )}

          {showImageModal && (
            <ImageUploadModal
              onConfirm={(htmlOrUrl, isHtml) => {
                const boxId = pendingImageBoxId.current
                if (boxId) {
                  const imgHtml = isHtml ? htmlOrUrl : `<img src="${htmlOrUrl}" style="max-width:100%;height:auto;border-radius:6px;display:block" alt="Media" />`
                  setNotes(prev => prev.map(n => n.id !== activeTabId ? n : {
                    ...n, boxes: { ...n.boxes, [currentPageIdx]: (n.boxes[currentPageIdx] || []).map(b => b.id === boxId ? { ...b, content: imgHtml, sizeLocked: true } : b) }
                  }))
                  pendingImageBoxId.current = null
                } else if (isHtml) {
                  editor.insertHTML(htmlOrUrl)
                } else {
                  editor.insertHTML(`<img src="${htmlOrUrl}" style="max-width:100%;height:auto;border-radius:6px;display:block;margin:4px 0" alt="Media" /><br/>`)
                }
              }}
              onClose={() => { setShowImageModal(false); pendingImageBoxId.current = null }}
            />
          )}

          {showCoverModal && (<Suspense fallback={null}>
            <CoverModal
              existingCover={activeNote?.cover}
              onConfirm={setCover}
              onClose={() => setShowCoverModal(false)}
            />
          </Suspense>)}

          {aiMenu && (
            <AiInlineMenu
              x={aiMenu.x}
              y={aiMenu.y}
              selectedText={aiMenu.selectedText}
              initialPrompt={aiMenu.initialPrompt}
              isDark={theme === "dark"}
              onClose={() => setAiMenu(null)}
              onSubmit={async (prompt: string, selectedText?: string) => {
                setAiMenu(null)

                try {
                  const response = await apiFetch("/api/ai", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt, text: selectedText || "" })
                  })

                  const data = await response.json()

                  if (!response.ok) {
                    const errorMsg = data.error || `Request failed with status ${response.status}`
                    throw new Error(errorMsg)
                  }

                  const result = data.result || ""
                  if (!result) {
                    throw new Error("No response from AI")
                  }

                  // Insert inline: replace selected text or insert at cursor
                  if (selectedText) {
                    editor.execCmd("insertText", result)
                  } else {
                    const escaped = result.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")
                    editor.insertHTML(escaped)
                  }
                } catch (error) {
                  const errorMsg = error instanceof Error ? error.message : "Unknown error"
                  console.error("AI error:", errorMsg)
                  openAlert("AI Error", errorMsg)
                }
              }}
            />
          )}

          {aiResult && (
            <AiResultModal
              title={aiResult.title}
              result={aiResult.result}
              loading={aiResult.loading}
              prompt={aiResult.prompt}
              theme={theme}
              onClose={() => setAiResult(null)}
              onInsert={text => { editor.insertHTML(`<p>${text}</p>`); setAiResult(null) }}
            />
          )}


          {showAiCommandBar && (
            <AiCommandBar
              onClose={() => setShowAiCommandBar(false)}
              onSubmit={async (prompt) => {
                setShowAiCommandBar(false)
                setAiResult({ title: "AI Generation", result: "", loading: true, prompt })
                try {
                  const res = await apiFetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) })
                  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Request failed") }
                  const data = await res.json()
                  setAiResult(prev => prev ? { ...prev, result: data.result || "", loading: false } : null)
                } catch {
                  setAiResult(null); openAlert("AI Error", "Could not process your request.")
                }
              }}
            />
          )}

          {showNotebookChat && activeNote && (
            <NotebookChat
              note={activeNote}
              theme={theme}
              accent={accent}
              userId={user?.id}
              onClose={() => setShowNotebookChat(false)}
            />
          )}

          {showVersionHistory && activeNote && (
            <VersionHistoryPanel
              versions={versionHistory.getVersions(activeNote.id)}
              noteSubject={activeNote.subject}
              currentPages={activeNote.pages}
              onRestore={v => versionHistory.restoreVersion(activeNote.id, v, setNotes)}
              onDelete={ts => versionHistory.deleteVersion(activeNote.id, ts)}
              onSaveSnapshot={() => versionHistory.takeSnapshot()}
              onClose={() => setShowVersionHistory(false)}
              theme={theme}
            />
          )}

          {/* Sign In to Sync button moved to global scope below */}

        </div>

        <VitalitySystem
          theme={theme}
          totalChars={totalChars}
          sidebarWidth={sidebarWidth}
          timerOpen={timerOpen}
          onSetTimerOpen={setTimerOpen}
          sap={sap}
          grove={grove}
          achievements={achievements}
          setSap={setSap}
          setGrove={setGrove}
          setAchievements={setAchievements}
          lastCharCount={lastCharCount}
          setLastCharCount={setLastCharCount}
          checkAchievementRef={checkAchievementRef}
          claimAchievementRef={claimAchievementRef}
          inventory={inventory}
          setInventory={setInventory}
          activeTabId={activeTabId}
          initialNotes={initialNotesRef.current}
          onOpenSatchel={() => { startTransition(() => { closeAllPanels(); setShopOpen(true); setShopInitialTab('satchel') }) }}
          onOpenStats={() => { startTransition(() => { closeAllPanels(); setStatsOpen(true) }) }}
          goalStreak={goalStreak}
          setGoalStreak={setGoalStreak}
          goalStreakLastDate={goalStreakLastDate}
          setGoalStreakLastDate={setGoalStreakLastDate}
          dailyGoalMinutes={dailyGoalMinutes}
          quotaTier={quotaTier}
          isHibernating={isHibernating}
          hidden={orchardOpen || statsOpen || showSettings || shopOpen || leaderboardOpen}
        />

        {/* Persistent timer toggle — visible even when the sidebar is collapsed */}
        {sidebarWidth <= 40 && notes.filter(n => !n.archived).length > 0 && (
          <button
            onClick={() => setTimerOpen(!timerOpen)}
            title="Focus timer  (⌘⌥T)"
            className={`fixed bottom-3 left-3 z-[60] flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${timerOpen ? "" : "hover:scale-[1.04] active:scale-[0.97]"}`}
            style={{
              width: 56,
              height: 56,
              background: timerOpen
                ? 'linear-gradient(135deg, rgba(217,119,6,0.15), rgba(217,119,6,0.08))'
                : 'linear-gradient(135deg, rgba(217,119,6,0.06), rgba(217,119,6,0.02))',
              boxShadow: timerOpen
                ? '0 0 20px rgba(217,119,6,0.15), inset 0 1px 0 rgba(217,119,6,0.15)'
                : '0 0 12px rgba(217,119,6,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
              border: timerOpen ? '1px solid rgba(217,119,6,0.2)' : '1px solid rgba(255,255,255,0.05)',
              backdropFilter: "blur(12px)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={`mb-0.5 transition-colors ${timerOpen ? "text-amber-500" : "text-amber-600/60"}`}>
              <ellipse cx="12" cy="21" rx="7" ry="1.5" fill="currentColor" opacity="0.25" />
              <path d="M12 20 C12 16 11.5 14 12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 14 C9 12 7 10.5 7 8.5 C7 8.5 9.5 9 12 12" fill="currentColor" opacity="0.7" />
              <path d="M8.5 10 L10 11.5" stroke="currentColor" strokeWidth="0.6" opacity="0.4" strokeLinecap="round" />
              <path d="M12 11 C15 9 17 7.5 17 5.5 C17 5.5 14.5 6 12 9" fill="currentColor" opacity="0.7" />
              <path d="M15.5 7 L14 8.5" stroke="currentColor" strokeWidth="0.6" opacity="0.4" strokeLinecap="round" />
              <circle cx="12" cy="11" r="1" fill="currentColor" opacity="0.5" />
              <path d="M18 4 L18.5 3 L19 4 L18.5 5Z" fill="currentColor" opacity="0.3" />
              <path d="M5 6 L5.3 5.2 L5.6 6 L5.3 6.8Z" fill="currentColor" opacity="0.2" />
            </svg>
            <span className={`text-[8px] font-normal tracking-wide transition-colors ${timerOpen ? "text-amber-500" : "text-amber-600/50"}`} style={{ fontFamily: 'Crimson Pro, serif' }}>focus</span>
          </button>
        )}
        {!user && (
          <button
            onClick={() => window.location.href = "/login"}
            className="fixed bottom-4 right-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all bg-[#d97706]/10 hover:bg-[#d97706]/20 border border-[#d97706]/20 text-[#d97706] shadow-lg hover:shadow-xl z-[100]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
            <span className="text-[11px] font-normal tracking-[0.05em] uppercase">Sign In to Sync</span>
          </button>
        )}
        {isAdmin && <div style={{ position: 'fixed', bottom: 8, right: 12, zIndex: 9999, fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', color: '#ef4444', textTransform: 'uppercase', pointerEvents: 'none', userSelect: 'none', fontFamily: 'system-ui, sans-serif' }}>DEV</div>}
        <PlantImagePreloader />
      </>
    </LazyMotion>
  )
}
