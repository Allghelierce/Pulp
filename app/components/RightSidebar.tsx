"use client"
import { memo, useState, useMemo } from "react"

import { TREE_TYPES, LEADERBOARD_BOTS } from "@/app/constants"
import { PlantIcon } from "./PlantIcon"
import { PulpIcon, GemIcon } from '@/app/components/CurrencyIcons'

interface RightSidebarProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  accent: string
  sap: number
  gems: number
  xp?: number
  grove: any[]
  userName?: string
  setSap: (v: number | ((p: number) => number)) => void
  setGems: (v: number | ((p: number) => number)) => void
  setGrove: (v: any[] | ((p: any[]) => any[])) => void
}

export const RightSidebar = memo(function RightSidebar({
  isOpen, onClose, theme, accent,
  sap, gems, xp, grove, userName, setSap, setGems, setGrove
}: RightSidebarProps) {
  const [gemsTooltip, setGemsTooltip] = useState(false)
  const [tab, setTab] = useState<"grove" | "leaderboard">("grove")

  const isDark = theme === "dark"

  const leaderboard = useMemo(() => {
    const you = { name: userName || "you", xp: 0, sap, isYou: true }
    const others = LEADERBOARD_BOTS.map(b => ({ ...b, isYou: false }))
    return [...others, you].sort((a, b) => b.sap - a.sap)
  }, [sap, userName])

  const yourRank = leaderboard.findIndex(e => e.isYou) + 1

  const plantSeed = (type: keyof typeof TREE_TYPES) => {
    const typeInfo = TREE_TYPES[type]
    const hasFunds = typeInfo.currency === 'sap' ? sap >= typeInfo.cost : gems >= typeInfo.cost
    if (!hasFunds) return

    if (typeInfo.currency === 'sap') setSap(s => s - typeInfo.cost)
    else setGems(g => g - typeInfo.cost)

    setGrove(g => [...g.slice(0, 8), {
      id: Date.now(),
      type,
      stage: 0,
      progress: 0,
      plantedAt: Date.now()
    }].slice(0, 9))
  }

  return (
    <div
      className={`fixed right-0 top-12 bottom-0 z-40 flex transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      style={{ width: 320 }}
    >
      <div className={`flex-1 h-full border-l flex flex-col shadow-2xl ${isDark ? 'bg-[#151518] border-zinc-800' : 'bg-[#fff] border-zinc-200'}`}>
        {/* Header */}
        <div className="p-4 border-b border-zinc-200/50 flex items-center justify-between">
          <div>
            <h2 className="text-[10px] font-normal tracking-[0.2em] uppercase text-zinc-400">The Pulp Grove</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Currency Banner */}
        <div className={`mx-4 mt-4 p-3 rounded-lg border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-gradient-to-r from-amber-50/60 to-orange-50/40 border-orange-100/40'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <PulpIcon size={13} />
                <span className={`text-[13px] font-normal tabular-nums ${isDark ? 'text-amber-400' : 'text-amber-600'}`} style={{ fontFamily: 'Crimson Pro, serif' }}>{sap.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GemIcon size={12} />
                <span className={`text-[13px] font-normal tabular-nums ${isDark ? 'text-blue-400' : 'text-blue-600'}`} style={{ fontFamily: 'Crimson Pro, serif' }}>{gems}</span>
              </div>
            </div>
            <span className="text-[9px] text-zinc-400 font-normal">{grove.filter(t => t?.type !== 'spoiled').length} trees</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex mx-4 mt-3 rounded-lg overflow-hidden border border-zinc-200/50 dark:border-zinc-800">
          <button
            onClick={() => setTab("grove")}
            className={`flex-1 py-1.5 text-[9px] font-normal uppercase tracking-[0.12em] transition-colors ${tab === "grove" ? (isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-100 text-zinc-800') : 'text-zinc-400 hover:text-zinc-500'}`}
          >
            Grove
          </button>
          <button
            onClick={() => setTab("leaderboard")}
            className={`flex-1 py-1.5 text-[9px] font-normal uppercase tracking-[0.12em] transition-colors ${tab === "leaderboard" ? (isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-100 text-zinc-800') : 'text-zinc-400 hover:text-zinc-500'}`}
          >
            Leaderboard
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {tab === "grove" ? (
            <>
              {/* Time Currency */}
              <div
                className={`p-4 rounded-lg border flex flex-col items-center text-center relative cursor-help transition-all ${isDark ? 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/80' : 'bg-zinc-50/50 border-zinc-200/50 hover:bg-zinc-100/50'}`}
                onMouseEnter={() => setGemsTooltip(true)}
                onMouseLeave={() => setGemsTooltip(false)}
              >
                <div className="w-8 h-8 rounded-full bg-zinc-400/15 flex items-center justify-center mb-2">
                  <GemIcon size={14} />
                </div>
                <span className="text-[18px] font-normal font-serif">{gems}</span>
                <span className="text-[8px] font-normal uppercase tracking-widest text-zinc-400">Time</span>
                {gemsTooltip && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-[10px] whitespace-nowrap font-normal pointer-events-none bg-zinc-800 text-white">
                    1 minute focused = 1 time earned.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-800" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}} />
                  </div>
                )}
              </div>

              {/* Nursery */}
              <section className="space-y-4">
                <h3 className="text-[9px] font-normal uppercase tracking-[0.1em] text-zinc-400 text-center">Nursery Shop</h3>
                <div className="flex flex-wrap justify-center gap-4 px-2">
                  {(Object.keys(TREE_TYPES) as Array<keyof typeof TREE_TYPES>).map(type => (
                    <button
                      key={type}
                      onClick={() => plantSeed(type)}
                      disabled={TREE_TYPES[type].currency === 'sap' ? sap < TREE_TYPES[type].cost : gems < TREE_TYPES[type].cost}
                      className="flex flex-col items-center group disabled:opacity-30"
                    >
                      <div
                        className="w-11 h-11 rounded-lg flex items-center justify-center border-2 border-dashed border-zinc-200 group-hover:border-zinc-300 transition-all mb-1 overflow-hidden relative"
                        style={{ backgroundColor: TREE_TYPES[type].bg }}
                      >
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: TREE_TYPES[type].color }} />
                      </div>
                      <span className="text-[8px] font-normal text-zinc-500">{TREE_TYPES[type].name.split(' ')[0]}</span>
                      <span className="text-[7px] text-zinc-400">{TREE_TYPES[type].cost} {TREE_TYPES[type].currency === 'sap' ? 'Sap' : 'Gem'}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Grove Grid */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[9px] font-normal uppercase tracking-widest text-zinc-300">Your Grove</h2>
                  <span className="text-[9px] font-normal text-zinc-400 italic">{grove.filter(Boolean).length}/9</span>
                </div>
                <div className={`grid grid-cols-3 gap-3 p-4 rounded-2xl border shadow-inner ${isDark ? 'bg-[#09090b] border-zinc-800' : 'bg-emerald-50/10 border-emerald-100/30'}`}>
                  {[...Array(9)].map((_, i) => {
                    const tree = grove[i]
                    return (
                      <div
                        key={i}
                        className={`aspect-square rounded-lg flex items-center justify-center relative border shadow-sm ${isDark ? 'bg-zinc-900/50 border-zinc-800/50' : 'bg-white/80 border-emerald-100/40'}`}
                      >
                        {!tree ? (
                          <div className="w-1 h-1 rounded-full bg-zinc-200" />
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="overflow-visible">
                              <PlantIcon type={tree.type} size={32} stage={tree.stage} />
                            </div>
                            <div className="w-full px-2 h-0.5 bg-zinc-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, (tree.progress / 100) * 100)}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            </>
          ) : (
            /* Leaderboard Tab */
            <section className="space-y-3">
              <div className="text-center mb-2">
                <span className={`text-[11px] font-normal ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  You are ranked <span className="text-amber-500 font-normal">#{yourRank}</span> of {leaderboard.length}
                </span>
              </div>

              <div className="space-y-1">
                {leaderboard.map((entry, i) => {
                  const rank = i + 1
                  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null
                  return (
                    <div
                      key={entry.name}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                        entry.isYou
                          ? (isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200/50')
                          : (isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50')
                      }`}
                    >
                      <span className={`text-[11px] font-normal tabular-nums w-5 text-center ${
                        rank <= 3 ? 'text-amber-500' : (isDark ? 'text-zinc-500' : 'text-zinc-400')
                      }`}>
                        {medal || rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] font-normal truncate ${
                            entry.isYou ? (isDark ? 'text-amber-400' : 'text-amber-700') : (isDark ? 'text-zinc-200' : 'text-zinc-700')
                          }`}>
                            {entry.isYou ? (userName || "you") : entry.name}
                          </span>
                          {entry.isYou && (
                            <span className="text-[7px] font-normal uppercase tracking-widest text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">you</span>
                          )}
                        </div>
                        <span className={`text-[8px] uppercase tracking-[0.1em] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          {entry.sap.toLocaleString()} sap
                        </span>
                      </div>
                      <span className={`text-[10px] font-normal tabular-nums ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        <PulpIcon size={10} /> {entry.sap.toLocaleString()}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 text-center border-t border-zinc-200/50">
          <p className="text-[9px] text-zinc-400 italic">"Write more, climb higher."</p>
        </div>
      </div>
    </div>
  )
})
