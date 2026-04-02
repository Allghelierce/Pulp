"use client"
import { memo, useState } from "react"

interface RightSidebarProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  accent: string
  sunshine: number
  gems: number
  grove: any[]
  setSunshine: (v: number | ((p: number) => number)) => void
  setGems: (v: number | ((p: number) => number)) => void
  setGrove: (v: any[] | ((p: any[]) => any[])) => void
}

export const RightSidebar = memo(function RightSidebar({
  isOpen, onClose, theme, accent,
  sunshine, gems, grove, setSunshine, setGems, setGrove
}: RightSidebarProps) {
  const [sunshineTooltip, setSunshineTooltip] = useState(false)
  const [gemsTooltip, setGemsTooltip] = useState(false)

  const plantSeed = (type: 'navel' | 'blood' | 'clementine') => {
    const cost = 10
    if (sunshine < cost) return
    setSunshine(s => s - cost)
    setGrove(g => [...g.slice(0, 8), { 
      id: Date.now(), 
      type, 
      stage: 0, 
      progress: 0,
      plantedAt: Date.now() 
    }].slice(0, 9))
  }

  const TREE_TYPES = {
    navel: { name: 'Navel Orange', color: '#b85e22', bg: 'rgba(184, 94, 34, 0.1)' },
    blood: { name: 'Blood Orange', color: '#800000', bg: 'rgba(128, 0, 0, 0.1)' },
    clementine: { name: 'Clementine', color: '#ff8c00', bg: 'rgba(255, 140, 0, 0.1)' }
  }

  return (
    <div
      className={`fixed right-0 top-12 bottom-0 z-40 flex transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      style={{ width: 320 }}
    >
      <div className={`flex-1 h-full border-l flex flex-col shadow-2xl ${theme === 'dark' ? 'bg-[#151518] border-zinc-800' : 'bg-[#fff] border-zinc-200'}`}>
        {/* Header */}
        <div className="p-4 border-b border-zinc-200/50 flex items-center justify-between">
          <div>
            <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400">The Pulp Grove</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-8">
          {/* Wallet / Currencies */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className={`p-4 rounded-2xl border flex flex-col items-center text-center relative cursor-help transition-all ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/80' : 'bg-orange-50/30 border-orange-100/50 hover:bg-orange-50/50'}`}
              onMouseEnter={() => setSunshineTooltip(true)}
              onMouseLeave={() => setSunshineTooltip(false)}
              onClick={() => setSunshineTooltip(!sunshineTooltip)}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setSunshine(s => s + 100) }}
                className="absolute top-2 right-2 w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 flex items-center justify-center text-xs pb-[1px]"
                title="Buy 100 ☀️ ($1.99)"
              >+</button>
              <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center mb-2 animate-pulse">
                <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m12.72-12.72l1.42-1.42"/></svg>
              </div>
              <span className="text-[18px] font-bold font-serif">{sunshine}</span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Sunshine</span>

              {sunshineTooltip && (
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-[10px] whitespace-nowrap font-medium pointer-events-none ${theme === 'dark' ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-800 text-white'}`}>
                  Earned by writing notes. Spend to plant trees.
                  <div className={`absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-800'}`} style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}} />
                </div>
              )}
            </div>

            <div
              className={`p-4 rounded-2xl border flex flex-col items-center text-center relative cursor-help transition-all ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/80' : 'bg-purple-50/30 border-purple-100/50 hover:bg-purple-50/50'}`}
              onMouseEnter={() => setGemsTooltip(true)}
              onMouseLeave={() => setGemsTooltip(false)}
              onClick={() => setGemsTooltip(!gemsTooltip)}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setGems(g => g + 50) }}
                className="absolute top-2 right-2 w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 flex items-center justify-center text-xs pb-[1px]"
                title="Buy 50 💎 ($0.99)"
              >+</button>
              <div className="w-8 h-8 rounded-full bg-purple-400/20 flex items-center justify-center mb-2">
                <span className="text-sm">💎</span>
              </div>
              <span className="text-[18px] font-bold font-serif">{gems}</span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Gems</span>

              {gemsTooltip && (
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-[10px] whitespace-nowrap font-medium pointer-events-none ${theme === 'dark' ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-800 text-white'}`}>
                  Rare rewards from achievements. Premium upgrades.
                  <div className={`absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-800'}`} style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}} />
                </div>
              )}
            </div>
          </div>

          {/* Seed Variety Selection */}
          <section className="space-y-4">
             <h3 className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-400 text-center">Nursery Shop</h3>
             <div className="flex justify-between gap-2 px-2">
                {(Object.keys(TREE_TYPES) as Array<keyof typeof TREE_TYPES>).map(type => (
                  <button 
                    key={type}
                    onClick={() => plantSeed(type)}
                    disabled={sunshine < 10}
                    className="flex flex-col items-center group disabled:opacity-30"
                  >
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-dashed border-zinc-200 group-hover:border-zinc-300 transition-all mb-1"
                      style={{ backgroundColor: TREE_TYPES[type].bg }}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TREE_TYPES[type].color }} />
                    </div>
                    <span className="text-[8px] font-bold text-zinc-500">{TREE_TYPES[type].name.split(' ')[0]}</span>
                    <span className="text-[7px] text-zinc-400">10 Sun</span>
                  </button>
                ))}
             </div>
          </section>

          {/* The Grove Grid */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Your Grove</h2>
              <span className="text-[9px] font-medium text-zinc-400 italic">{grove.length}/9 Plots Used</span>
            </div>
            
            <div className={`grid grid-cols-3 gap-3 p-4 rounded-3xl border shadow-inner ${theme === 'dark' ? 'bg-[#0f0f12] border-zinc-800' : 'bg-emerald-50/10 border-emerald-100/30'}`}>
              {[...Array(9)].map((_, i) => {
                const tree = grove[i]
                return (
                  <div 
                    key={i} 
                    className={`aspect-square rounded-2xl flex items-center justify-center relative border shadow-sm ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800/50' : 'bg-white/80 border-emerald-100/40'}`}
                  >
                    {!tree ? (
                      <div className="w-1 h-1 rounded-full bg-zinc-200" />
                    ) : (
                      <div className="flex flex-col items-center">
                        {/* Tree Stages Visual */}
                        <div className="relative mb-1">
                           {/* Simple Procedural Tree SVG */}
                           <svg width="32" height="32" viewBox="0 0 24 24" className="overflow-visible">
                              {/* Trunk */}
                              <rect x="11" y="16" width="2" height="6" fill="#5c2d0b" rx="0.5" />
                              {/* Leaves (Stage based scaling) */}
                              <circle 
                                cx="12" cy="12" 
                                r={4 + (tree.stage * 1.5)} 
                                fill={TREE_TYPES[tree.type as keyof typeof TREE_TYPES].color} 
                                opacity="0.8" 
                              />
                              {/* Gathered Fruit at the base (for stage >= 3) */}
                              {tree.stage >= 3 && (
                                <g>
                                  {/* Orange 1 */}
                                  <line x1="10" y1="21.5" x2="10" y2="22.5" stroke="#5c2d0b" strokeWidth="0.4" />
                                  <circle cx="10" cy="22.5" r="1.2" fill="#f97316" />
                                  {/* Orange 2 */}
                                  <line x1="14" y1="21.5" x2="14" y2="22.5" stroke="#5c2d0b" strokeWidth="0.4" />
                                  <circle cx="14" cy="22.5" r="1.1" fill="#f97316" />
                                </g>
                              )}
                           </svg>
                        </div>
                        <div className="w-full px-2 h-0.5 bg-zinc-100 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-400" style={{ width: '40%' }} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-8 text-center border-t border-zinc-200/50">
          <p className="text-[9px] text-zinc-400 italic">"Patience is the true gem of the wise."</p>
        </div>
      </div>
    </div>
  )
})
