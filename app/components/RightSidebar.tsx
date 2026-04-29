"use client"
import { memo, useState, useMemo } from "react"

import { TREE_TYPES, getLevel, LEADERBOARD_BOTS } from "@/app/constants"
import { PlantIcon } from "./PlantIcon"

interface RightSidebarProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  accent: string
  juice: number
  gems: number
  xp: number
  grove: any[]
  userName?: string
  setJuice: (v: number | ((p: number) => number)) => void
  setGems: (v: number | ((p: number) => number)) => void
  setGrove: (v: any[] | ((p: any[]) => any[])) => void
}

export const RightSidebar = memo(function RightSidebar({
  isOpen, onClose, theme, accent,
  juice, gems, xp, grove, userName, setJuice, setGems, setGrove
}: RightSidebarProps) {
  const [juiceTooltip, setJuiceTooltip] = useState(false)
  const [gemsTooltip, setGemsTooltip] = useState(false)
  const [tab, setTab] = useState<"grove" | "leaderboard">("grove")

  const lvl = getLevel(xp)
  const isDark = theme === "dark"

  const leaderboard = useMemo(() => {
    const you = { name: userName || "you", xp, juice, isYou: true }
    const others = LEADERBOARD_BOTS.map(b => ({ ...b, isYou: false }))
    return [...others, you].sort((a, b) => b.juice - a.juice)
  }, [xp, juice, userName])

  const yourRank = leaderboard.findIndex(e => e.isYou) + 1

  const plantSeed = (type: keyof typeof TREE_TYPES) => {
    const typeInfo = TREE_TYPES[type]
    const hasFunds = typeInfo.currency === 'juice' ? juice >= typeInfo.cost : gems >= typeInfo.cost
    if (!hasFunds) return

    if (typeInfo.currency === 'juice') setJuice(s => s - typeInfo.cost)
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
            <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400">The Pulp Grove</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* XP / Level Banner */}
        <div className={`mx-4 mt-4 p-3 rounded-xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-gradient-to-r from-amber-50/60 to-orange-50/40 border-orange-100/40'}`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className={`text-[18px] font-black tabular-nums ${isDark ? 'text-amber-400' : 'text-amber-600'}`} style={{ fontFamily: '"EB Garamond", serif' }}>
                Lv.{lvl.level}
              </span>
              <span className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {lvl.name}
              </span>
            </div>
            <span className="text-[9px] tabular-nums text-zinc-400 font-medium">
              {xp.toLocaleString()} XP
            </span>
          </div>
          <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-200/60'}`}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(2, lvl.progress * 100)}%`,
                background: `linear-gradient(90deg, #f59e0b, #ea580c)`,
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[8px] text-zinc-400 tabular-nums">{lvl.currentXp}/{lvl.nextXp} XP</span>
            <span className="text-[8px] text-zinc-400">Next: {getLevel(xp + lvl.nextXp - lvl.currentXp).name}</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex mx-4 mt-3 rounded-lg overflow-hidden border border-zinc-200/50 dark:border-zinc-800">
          <button
            onClick={() => setTab("grove")}
            className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] transition-colors ${tab === "grove" ? (isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-100 text-zinc-800') : 'text-zinc-400 hover:text-zinc-500'}`}
          >
            Grove
          </button>
          <button
            onClick={() => setTab("leaderboard")}
            className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] transition-colors ${tab === "leaderboard" ? (isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-100 text-zinc-800') : 'text-zinc-400 hover:text-zinc-500'}`}
          >
            Leaderboard
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {tab === "grove" ? (
            <>
              {/* Wallet / Currencies */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`p-4 rounded-2xl border flex flex-col items-center text-center relative cursor-help transition-all ${isDark ? 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/80' : 'bg-orange-50/30 border-orange-100/50 hover:bg-orange-50/50'}`}
                  onMouseEnter={() => setJuiceTooltip(true)}
                  onMouseLeave={() => setJuiceTooltip(false)}
                >
                  <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m12.72-12.72l1.42-1.42"/></svg>
                  </div>
                  <span className="text-[18px] font-bold font-serif">{juice}</span>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Juice</span>
                  {juiceTooltip && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-[10px] whitespace-nowrap font-medium pointer-events-none bg-zinc-800 text-white">
                      Earned by writing &amp; focus sessions.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-800" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}} />
                    </div>
                  )}
                </div>
                <div
                  className={`p-4 rounded-2xl border flex flex-col items-center text-center relative cursor-help transition-all ${isDark ? 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/80' : 'bg-purple-50/30 border-purple-100/50 hover:bg-purple-50/50'}`}
                  onMouseEnter={() => setGemsTooltip(true)}
                  onMouseLeave={() => setGemsTooltip(false)}
                >
                  <div className="w-8 h-8 rounded-full bg-purple-400/20 flex items-center justify-center mb-2">
                    <span className="text-sm">💎</span>
                  </div>
                  <span className="text-[18px] font-bold font-serif">{gems}</span>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Gems</span>
                  {gemsTooltip && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-[10px] whitespace-nowrap font-medium pointer-events-none bg-zinc-800 text-white">
                      Rare rewards from achievements.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-800" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}} />
                    </div>
                  )}
                </div>
              </div>

              {/* Nursery */}
              <section className="space-y-4">
                <h3 className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-400 text-center">Nursery Shop</h3>
                <div className="flex flex-wrap justify-center gap-4 px-2">
                  {(Object.keys(TREE_TYPES) as Array<keyof typeof TREE_TYPES>).map(type => (
                    <button
                      key={type}
                      onClick={() => plantSeed(type)}
                      disabled={TREE_TYPES[type].currency === 'juice' ? juice < TREE_TYPES[type].cost : gems < TREE_TYPES[type].cost}
                      className="flex flex-col items-center group disabled:opacity-30"
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center border-2 border-dashed border-zinc-200 group-hover:border-zinc-300 transition-all mb-1 overflow-hidden relative"
                        style={{ backgroundColor: TREE_TYPES[type].bg }}
                      >
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: TREE_TYPES[type].color }} />
                      </div>
                      <span className="text-[8px] font-bold text-zinc-500">{TREE_TYPES[type].name.split(' ')[0]}</span>
                      <span className="text-[7px] text-zinc-400">{TREE_TYPES[type].cost} {TREE_TYPES[type].currency === 'juice' ? 'Sun' : 'Gem'}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Grove Grid */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Your Grove</h2>
                  <span className="text-[9px] font-medium text-zinc-400 italic">{grove.filter(Boolean).length}/9</span>
                </div>
                <div className={`grid grid-cols-3 gap-3 p-4 rounded-3xl border shadow-inner ${isDark ? 'bg-[#0f0f12] border-zinc-800' : 'bg-emerald-50/10 border-emerald-100/30'}`}>
                  {[...Array(9)].map((_, i) => {
                    const tree = grove[i]
                    return (
                      <div
                        key={i}
                        className={`aspect-square rounded-2xl flex items-center justify-center relative border shadow-sm ${isDark ? 'bg-zinc-900/50 border-zinc-800/50' : 'bg-white/80 border-emerald-100/40'}`}
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
                <span className={`text-[11px] font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  You are ranked <span className="text-amber-500 font-black">#{yourRank}</span> of {leaderboard.length}
                </span>
              </div>

              <div className="space-y-1">
                {leaderboard.map((entry, i) => {
                  const rank = i + 1
                  const entryLevel = getLevel(entry.xp)
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
                      <span className={`text-[11px] font-black tabular-nums w-5 text-center ${
                        rank <= 3 ? 'text-amber-500' : (isDark ? 'text-zinc-500' : 'text-zinc-400')
                      }`}>
                        {medal || rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] font-semibold truncate ${
                            entry.isYou ? (isDark ? 'text-amber-400' : 'text-amber-700') : (isDark ? 'text-zinc-200' : 'text-zinc-700')
                          }`}>
                            {entry.isYou ? (userName || "you") : entry.name}
                          </span>
                          {entry.isYou && (
                            <span className="text-[7px] font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">you</span>
                          )}
                        </div>
                        <span className={`text-[8px] uppercase tracking-[0.1em] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          Lv.{entryLevel.level} {entryLevel.name}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold tabular-nums ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        🧃 {entry.juice.toLocaleString()}
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
