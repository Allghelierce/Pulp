"use client"
import { memo, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TREE_TYPES, getLevel } from "@/app/constants"
import { PlantIcon } from "./PlantIcon"
import type { NoteData } from "@/app/types"

interface OrchardViewProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  accent: string
  sunshine: number
  gems: number
  xp: number
  grove: any[]
  inventory: string[]
  setSunshine: (v: number | ((p: number) => number)) => void
  setGems: (v: number | ((p: number) => number)) => void
  setInventory: (v: string[] | ((p: string[]) => string[])) => void
  setGrove: (v: any[] | ((p: any[]) => any[])) => void
  notes: NoteData[]
}

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'true rare', 'premium', 'extinct', 'chroma']
const RARITY_META: Record<string, { label: string; color: string }> = {
  common: { label: 'Common', color: '#8a8a8f' },
  uncommon: { label: 'Uncommon', color: '#6b9a6b' },
  rare: { label: 'Rare', color: '#6888a8' },
  'true rare': { label: 'True Rare', color: '#8b7aaa' },
  premium: { label: 'Premium', color: '#b89860' },
  chroma: { label: 'Chroma', color: '#a8708a' },
  extinct: { label: 'Extinct', color: '#7a6a9a' },
}

function seededRng(seed: number) {
  let s = Math.abs(seed) || 1
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000 }
}

function centerOutPlacement(trees: any[]): { x: number; y: number; tree: any }[] {
  if (trees.length === 0) return []

  const cx = 50, cy = 52
  const results: { x: number; y: number; tree: any }[] = []
  const goldenAngle = 137.508 * (Math.PI / 180)

  for (let i = 0; i < trees.length; i++) {
    const rng = seededRng(i * 311 + 4729)
    const t = i / Math.max(trees.length - 1, 1)

    const maxR = 38
    const r = maxR * Math.sqrt(t) * (0.8 + rng() * 0.4)
    const angle = i * goldenAngle + (rng() - 0.5) * 1.2

    const rawX = cx + Math.cos(angle) * r
    const rawY = cy + Math.sin(angle) * r * 0.55

    const jX = (rng() - 0.5) * 8
    const jY = (rng() - 0.5) * 6

    results.push({
      x: Math.max(4, Math.min(96, rawX + jX)),
      y: Math.max(6, Math.min(92, rawY + jY)),
      tree: trees[i],
    })
  }

  return results.sort((a, b) => a.y - b.y)
}

function getRarityPlantClass(type: string): string {
  const rarity = TREE_TYPES[type]?.rarity
  switch (rarity) {
    case 'uncommon': return 'rarity-uncommon'
    case 'rare': return 'rarity-rare'
    case 'true rare': return 'rarity-true-rare'
    case 'premium': return 'rarity-premium'
    case 'chroma': return 'rarity-chroma'
    case 'extinct': return 'rarity-extinct'
    default: return ''
  }
}

const Terrain = memo(function Terrain({ isDark }: { isDark: boolean }) {
  const ground = isDark ? '#141a12' : '#c8c4b4'
  const groundLight = isDark ? '#1a2216' : '#d0ccbc'
  const hillFar = isDark ? '#0e140e' : '#c0bcac'
  const hillMid = isDark ? '#121812' : '#bab6a6'
  const grass = isDark ? '#2a3a22' : '#a8a490'

  return (
    <>
      <div className="absolute inset-0" style={{ background: ground }} />

      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <rect x="0" y="0" width="100" height="18" fill={hillFar} />
        <path d="M0,16 Q10,12 22,15 Q35,10 50,14 Q65,9 78,13 Q90,10 100,14 L100,22 L0,22 Z" fill={hillMid} />
        <path d="M0,20 Q15,16 28,19 Q42,13 58,18 Q72,12 85,17 Q95,14 100,16 L100,35 L0,35 Z" fill={ground} />
        <ellipse cx="30" cy="45" rx="22" ry="8" fill={groundLight} opacity="0.4" />
        <ellipse cx="72" cy="52" rx="18" ry="6" fill={groundLight} opacity="0.35" />
        <ellipse cx="50" cy="55" rx="28" ry="14" fill={groundLight} opacity="0.2" />

        <path
          d="M -2,98 C 10,90 18,82 24,74 C 30,66 36,60 42,55 C 48,50 52,46 50,40 C 48,34 46,28 50,22"
          stroke={isDark ? '#1e1a14' : '#b8b0a0'}
          strokeWidth="2.5"
          fill="none"
          opacity={isDark ? 0.35 : 0.25}
          strokeLinecap="round"
        />
        <path
          d="M 102,78 C 90,72 80,66 72,60 C 64,54 58,50 52,48"
          stroke={isDark ? '#1e1a14' : '#b8b0a0'}
          strokeWidth="1.5"
          fill="none"
          opacity={isDark ? 0.2 : 0.15}
          strokeLinecap="round"
        />

        <ellipse cx="50" cy="55" rx="32" ry="18" fill="none" stroke={isDark ? '#282420' : '#b0a898'} strokeWidth="0.4" opacity={isDark ? 0.2 : 0.15} strokeDasharray="1.5 2" />

        {Array.from({ length: 20 }).map((_, i) => {
          const rng = seededRng(i * 53 + 101)
          const x = 3 + rng() * 94
          const y = 22 + rng() * 74
          const h = 0.6 + rng() * 0.8
          return (
            <g key={`g${i}`} opacity={isDark ? 0.15 + rng() * 0.08 : 0.1 + rng() * 0.06}>
              <line x1={`${x}`} y1={`${y}`} x2={`${x - 0.2}`} y2={`${y - h}`} stroke={grass} strokeWidth="0.3" />
              <line x1={`${x}`} y1={`${y}`} x2={`${x + 0.15}`} y2={`${y - h * 0.85}`} stroke={grass} strokeWidth="0.3" />
            </g>
          )
        })}

        {Array.from({ length: 8 }).map((_, i) => {
          const rng = seededRng(i * 89 + 337)
          const x = 15 + rng() * 70
          const y = 30 + rng() * 55
          return <ellipse key={`s${i}`} cx={`${x}`} cy={`${y}`} rx={`${0.3 + rng() * 0.25}`} ry={`${0.12 + rng() * 0.1}`} fill={isDark ? '#1c1e1a' : '#a8a498'} opacity={isDark ? 0.25 : 0.18} />
        })}
      </svg>

      <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{
        height: '20%',
        background: isDark
          ? `linear-gradient(180deg, ${ground}cc 0%, ${ground}00 100%)`
          : `linear-gradient(180deg, ${ground}88 0%, ${ground}00 100%)`,
      }} />

      <div className="absolute inset-0 pointer-events-none" style={{
        boxShadow: isDark
          ? 'inset 0 0 80px 20px rgba(10,14,10,0.5)'
          : 'inset 0 0 80px 20px rgba(180,176,164,0.3)',
      }} />
    </>
  )
})

const NOTE_TYPE_ICONS: Record<string, string> = {
  notebook: '📓',
  singlepage: '📄',
  flashcard: '🃏',
  vault: '🔒',
  cornell: '📋',
}

export const OrchardView = memo(function OrchardView({
  isOpen, onClose, theme,
  sunshine, gems, xp, grove, notes,
}: OrchardViewProps) {

  const [selectedNotebook, setSelectedNotebook] = useState<string | null>(null)
  const lvl = getLevel(xp)
  const isDark = theme === 'dark'

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose, isOpen])

  const activeNotes = useMemo(() => notes.filter(n => !n.archived && !n.deletedAt), [notes])

  const notebookTreeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    grove.filter(Boolean).forEach(t => {
      const nid = t.notebookId || '_unassigned'
      counts[nid] = (counts[nid] || 0) + 1
    })
    return counts
  }, [grove])

  const filteredTrees = useMemo(() => {
    const all = grove.filter(t => t !== null)
    if (selectedNotebook === null) return all
    if (selectedNotebook === '_unassigned') return all.filter(t => !t.notebookId)
    return all.filter(t => t.notebookId === selectedNotebook)
  }, [grove, selectedNotebook])

  const placed = useMemo(() => centerOutPlacement(filteredTrees), [filteredTrees])

  const rarityCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredTrees.forEach(t => {
      const r = TREE_TYPES[t.type]?.rarity || 'common'
      counts[r] = (counts[r] || 0) + 1
    })
    return counts
  }, [filteredTrees])

  if (!isOpen) return null

  const cardBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'
  const textPrimary = isDark ? '#d4d0c8' : '#3a3630'
  const textSecondary = isDark ? '#6b6860' : '#9a9590'
  const textMuted = isDark ? '#4a4840' : '#b8b4ae'
  const sidebarBg = isDark ? 'rgba(10,12,10,0.85)' : 'rgba(240,236,228,0.9)'
  const sidebarItemHover = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'
  const sidebarItemActive = isDark ? 'rgba(234,88,12,0.1)' : 'rgba(234,88,12,0.08)'

  const treeSize = filteredTrees.length <= 6 ? 80 :
    filteredTrees.length <= 15 ? 74 :
    filteredTrees.length <= 30 ? 68 : 62

  const totalTrees = grove.filter(Boolean).length

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative flex overflow-hidden"
        style={{
          width: "96vw", maxWidth: 1060, height: "92vh", maxHeight: 780,
          borderRadius: 18,
          boxShadow: isDark ? "0 30px 100px -20px rgba(0,0,0,0.8)" : "0 30px 100px -20px rgba(0,0,0,0.2)",
          border: `1px solid ${cardBorder}`,
        }}
      >
        {/* Notebook Sidebar */}
        <div className="shrink-0 flex flex-col z-30 overflow-hidden" style={{
          width: 200,
          background: sidebarBg,
          backdropFilter: 'blur(16px)',
          borderRight: `1px solid ${cardBorder}`,
        }}>
          {/* Sidebar header */}
          <div className="px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${cardBorder}` }}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: textMuted }}>
              Orchards
            </h2>
          </div>

          {/* All trees button */}
          <div className="px-2 pt-2 shrink-0">
            <button
              onClick={() => setSelectedNotebook(null)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors"
              style={{
                background: selectedNotebook === null ? sidebarItemActive : 'transparent',
                borderLeft: selectedNotebook === null ? '2px solid #ea580c' : '2px solid transparent',
              }}
              onMouseEnter={e => { if (selectedNotebook !== null) e.currentTarget.style.background = sidebarItemHover }}
              onMouseLeave={e => { if (selectedNotebook !== null) e.currentTarget.style.background = 'transparent' }}
            >
              <span className="text-[13px]">🌳</span>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold block truncate" style={{
                  color: selectedNotebook === null ? '#ea580c' : textPrimary,
                }}>All Trees</span>
              </div>
              <span className="text-[9px] font-bold tabular-nums shrink-0" style={{ color: textMuted }}>
                {totalTrees}
              </span>
            </button>
          </div>

          {/* Notebook list */}
          <div className="flex-1 overflow-y-auto px-2 py-1.5" style={{ scrollbarWidth: 'thin' }}>
            {activeNotes.map(note => {
              const count = notebookTreeCounts[note.id] || 0
              const isSelected = selectedNotebook === note.id
              const icon = note.icon || NOTE_TYPE_ICONS[note.noteType || 'notebook'] || '📓'

              return (
                <button
                  key={note.id}
                  onClick={() => setSelectedNotebook(note.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors mb-0.5"
                  style={{
                    background: isSelected ? sidebarItemActive : 'transparent',
                    borderLeft: isSelected ? '2px solid #ea580c' : '2px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = sidebarItemHover }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                >
                  <span className="text-[13px] shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-medium block truncate" style={{
                      color: isSelected ? '#ea580c' : textPrimary,
                    }}>{note.subject || 'Untitled'}</span>
                  </div>
                  {count > 0 && (
                    <span className="text-[9px] font-bold tabular-nums shrink-0" style={{ color: textMuted }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}

            {/* Unassigned trees */}
            {(notebookTreeCounts['_unassigned'] || 0) > 0 && (
              <button
                onClick={() => setSelectedNotebook('_unassigned')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors mt-1"
                style={{
                  background: selectedNotebook === '_unassigned' ? sidebarItemActive : 'transparent',
                  borderLeft: selectedNotebook === '_unassigned' ? '2px solid #ea580c' : '2px solid transparent',
                  borderTop: `1px solid ${cardBorder}`,
                }}
                onMouseEnter={e => { if (selectedNotebook !== '_unassigned') e.currentTarget.style.background = sidebarItemHover }}
                onMouseLeave={e => { if (selectedNotebook !== '_unassigned') e.currentTarget.style.background = 'transparent' }}
              >
                <span className="text-[13px] shrink-0 opacity-50">🌿</span>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-medium block truncate" style={{
                    color: selectedNotebook === '_unassigned' ? '#ea580c' : textMuted,
                  }}>Unassigned</span>
                </div>
                <span className="text-[9px] font-bold tabular-nums shrink-0" style={{ color: textMuted }}>
                  {notebookTreeCounts['_unassigned']}
                </span>
              </button>
            )}
          </div>

          {/* Sidebar footer — stats */}
          <div className="shrink-0 px-4 py-3 flex flex-col gap-1.5" style={{ borderTop: `1px solid ${cardBorder}` }}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider" style={{ color: textMuted }}>Level</span>
              <span className="text-[10px] font-bold" style={{ color: textSecondary }}>
                {lvl.level} · {lvl.name}
              </span>
            </div>
            <div className="h-[2px] rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: '#ea580c' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(2, lvl.progress * 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <div className="flex items-center gap-1">
                <span className="text-[9px]">☀️</span>
                <span className="text-[9px] font-bold tabular-nums" style={{ color: textSecondary }}>{sunshine}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px]">💎</span>
                <span className="text-[9px] font-bold tabular-nums" style={{ color: textSecondary }}>{gems}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main orchard area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <Terrain isDark={isDark} />

          {/* Thin top bar */}
          <div className="relative z-20 flex items-center justify-between px-5 py-2 shrink-0" style={{
            background: isDark ? 'rgba(14,18,12,0.7)' : 'rgba(200,196,180,0.7)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${cardBorder}`,
          }}>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold" style={{ color: textPrimary }}>
                {selectedNotebook === null ? 'All Trees' :
                 selectedNotebook === '_unassigned' ? 'Unassigned' :
                 activeNotes.find(n => n.id === selectedNotebook)?.subject || 'Untitled'}
              </span>
              <span className="text-[10px] font-medium tabular-nums" style={{ color: textMuted }}>
                {filteredTrees.length} {filteredTrees.length === 1 ? 'tree' : 'trees'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {RARITY_ORDER.filter(r => rarityCounts[r] && r !== 'common').map(r => (
                <span key={r} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: RARITY_META[r].color }} />
                  <span className="text-[9px] tabular-nums" style={{ color: RARITY_META[r].color }}>{rarityCounts[r]}</span>
                </span>
              ))}
              <button onClick={onClose} className="ml-2 p-1.5 rounded-lg transition-colors" style={{ color: textMuted }} onMouseEnter={e => e.currentTarget.style.color = textPrimary} onMouseLeave={e => e.currentTarget.style.color = textMuted}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {/* Orchard scene */}
          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedNotebook ?? 'all'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0"
              >
                {filteredTrees.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-2 relative z-10">
                    <span className="text-[32px]">🌱</span>
                    <p className="text-[12px]" style={{ color: textMuted }}>
                      {selectedNotebook === null ? 'Your orchard is empty.' :
                       selectedNotebook === '_unassigned' ? 'No unassigned trees.' :
                       'No trees grown for this notebook yet.'}
                    </p>
                    <p className="text-[10px]" style={{ color: textMuted }}>
                      Complete focus sessions with a seed selected to grow your collection.
                    </p>
                  </div>
                ) : (
                  <>
                    {placed.map(({ x, y, tree }, renderIdx) => {
                      const typeInfo = TREE_TYPES[tree.type]
                      const rarity = typeInfo?.rarity || 'common'
                      const meta = RARITY_META[rarity] || RARITY_META.common

                      return (
                        <div
                          key={`${tree.id ?? 'tree'}-${renderIdx}`}
                          className="absolute flex flex-col items-center group"
                          style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            transform: 'translate(-50%, -85%)',
                            zIndex: Math.round(y),
                          }}
                        >
                          <div className={tree.stage >= 3 ? getRarityPlantClass(tree.type) : ''}>
                            <PlantIcon type={tree.type} size={treeSize} stage={tree.stage} />
                          </div>

                          <div className="rounded-full -mt-1" style={{
                            width: Math.round(treeSize * 0.45),
                            height: Math.max(2, Math.round(treeSize * 0.08)),
                            backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.08)',
                            filter: 'blur(2px)',
                          }} />

                          <div className="mt-0.5 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ zIndex: 300 }}>
                            <div className="px-2.5 py-1.5 rounded-lg" style={{
                              backgroundColor: isDark ? 'rgba(0,0,0,0.88)' : 'rgba(255,255,255,0.94)',
                              backdropFilter: 'blur(10px)',
                              border: `1px solid ${cardBorder}`,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            }}>
                              <span className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap block" style={{ color: textPrimary }}>
                                {typeInfo?.name || tree.type}
                              </span>
                              <span className="text-[8px] font-semibold uppercase tracking-widest whitespace-nowrap block mt-0.5" style={{ color: meta.color }}>
                                {meta.label}
                              </span>
                              {tree.stage < 4 && (
                                <div className="w-full h-[2px] rounded-full mt-1 overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, tree.progress)}%`, background: '#8ba870' }} />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
})
