"use client"
import { memo, useState } from "react"
import { motion } from "framer-motion"

interface OrchardViewProps {
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

export const OrchardView = memo(function OrchardView({
  isOpen, onClose, theme, accent,
  sunshine, gems, grove, setSunshine, setGems, setGrove
}: OrchardViewProps) {

  const plantSeed = (type: keyof typeof TREE_TYPES) => {
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
    clementine: { name: 'Clementine', color: '#ff8c00', bg: 'rgba(255, 140, 0, 0.1)' },
    spoiled: { name: 'Spoiled Grove', color: '#71717a', bg: 'rgba(113, 113, 122, 0.1)' }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 overflow-hidden"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-black/40' : 'bg-white/60'}`} />

      {/* Content */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative inset-x-0 top-1/2 -translate-y-1/2 max-w-4xl mx-auto max-h-[90vh] overflow-y-auto rounded-3xl flex flex-col shadow-2xl border ${
          theme === 'dark'
            ? 'bg-gradient-to-b from-[#0f0f12] to-[#151518] border-zinc-700/50'
            : 'bg-gradient-to-b from-white to-orange-50/20 border-orange-200/50'
        }`}
      >
        {/* Header */}
        <div className={`sticky top-0 z-20 p-8 border-b flex items-center justify-between backdrop-blur-sm ${
          theme === 'dark' ? 'border-zinc-700/50' : 'border-orange-200/50'
        }`}>
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-dancing), cursive', color: accent }}>
              Your Orchard
            </h1>
            <p className="text-sm mt-1 opacity-60">Grow your grove through writing</p>
          </motion.div>
          <button
            onClick={onClose}
            className={`p-3 rounded-full transition-all hover:scale-110 ${
              theme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-orange-100'
            }`}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 space-y-12">
          {/* Currencies - Full Width */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            <div className={`p-8 rounded-3xl border-2 flex flex-col items-center text-center transition-all hover:scale-105 relative group ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/30'
                : 'bg-gradient-to-br from-yellow-100/50 to-yellow-50/20 border-yellow-300/50'
            }`} style={{ borderColor: 'rgba(255, 193, 7, 0.5)' }}>
              <button 
                onClick={() => setSunshine(s => s + 100)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-amber-200 dark:bg-amber-700/50 hover:bg-amber-300 dark:hover:bg-amber-600/50 flex items-center justify-center text-lg pb-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                title="Buy 100 ☀️ ($1.99)"
              >+</button>
              <motion.div
                className="w-16 h-16 rounded-full bg-yellow-400/20 flex items-center justify-center mb-4 text-4xl"
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              >
                ☀️
              </motion.div>
              <span className="text-5xl font-bold font-serif mb-2" style={{ color: accent }}>{sunshine}</span>
              <span className="text-xs font-bold uppercase tracking-widest opacity-60">Sunshine</span>
              <p className="text-xs mt-2 opacity-50">Earned from notes written</p>
            </div>

            <div className={`p-8 rounded-3xl border-2 flex flex-col items-center text-center transition-all hover:scale-105 relative group ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30'
                : 'bg-gradient-to-br from-purple-100/50 to-purple-50/20 border-purple-300/50'
            }`} style={{ borderColor: 'rgba(168, 85, 247, 0.5)' }}>
              <button 
                onClick={() => setGems(g => g + 50)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-purple-200 dark:bg-purple-700/50 hover:bg-purple-300 dark:hover:bg-purple-600/50 flex items-center justify-center text-lg pb-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                title="Buy 50 💎 ($0.99)"
              >+</button>
              <motion.div
                className="w-16 h-16 rounded-full bg-purple-400/20 flex items-center justify-center mb-4 text-4xl"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                💎
              </motion.div>
              <span className="text-5xl font-bold font-serif mb-2" style={{ color: accent }}>{gems}</span>
              <span className="text-xs font-bold uppercase tracking-widest opacity-60">Gems</span>
              <p className="text-xs mt-2 opacity-50">Rare rewards from growth</p>
            </div>
          </motion.div>

          {/* Nursery Shop */}
          <motion.section
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-dancing), cursive', color: accent }}>
              Nursery Shop
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {(Object.keys(TREE_TYPES) as Array<keyof typeof TREE_TYPES>).map((type, idx) => (
                <motion.button
                  key={type}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  onClick={() => plantSeed(type)}
                  disabled={sunshine < 10}
                  className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                    sunshine < 10
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:scale-105 active:scale-95 cursor-pointer'
                  } ${
                    theme === 'dark'
                      ? 'bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-700/50'
                      : 'bg-white/40 border-orange-200/50 hover:bg-white/60'
                  }`}
                >
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-dashed mb-3 text-5xl transition-all"
                    style={{
                      backgroundColor: TREE_TYPES[type].bg,
                      borderColor: TREE_TYPES[type].color
                    }}
                  >
                    🌳
                  </div>
                  <span className="font-bold text-lg" style={{ color: TREE_TYPES[type].color }}>
                    {TREE_TYPES[type].name}
                  </span>
                  <span className="text-sm font-semibold mt-1">10 ☀️</span>
                </motion.button>
              ))}
            </div>
          </motion.section>

          {/* The Grove Grid */}
          <motion.section
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-dancing), cursive', color: accent }}>
                Your Grove
              </h2>
              <span className={`text-sm font-bold tracking-wide ${theme === 'dark' ? 'text-zinc-400' : 'text-orange-700'}`}>
                {grove.length}/9 Plots Used
              </span>
            </div>

            <div className={`grid grid-cols-3 gap-6 p-8 rounded-3xl border-2 ${
              theme === 'dark'
                ? 'bg-[#0f0f12]/50 border-emerald-800/30'
                : 'bg-emerald-50/30 border-emerald-200/50'
            }`}>
              {[...Array(9)].map((_, i) => {
                const tree = grove[i]
                return (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className={`aspect-square rounded-3xl flex flex-col items-center justify-center relative border-2 transition-all hover:scale-110 ${
                      theme === 'dark'
                        ? 'bg-zinc-900/50 border-emerald-700/50'
                        : 'bg-white/60 border-emerald-200/50'
                    }`}
                  >
                    {!tree ? (
                      <div className="text-4xl opacity-30">+</div>
                    ) : (
                      <motion.div
                        className="flex flex-col items-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 10, delay: 0.5 + i * 0.05 }}
                      >
                        {/* Tree SVG */}
                        <svg width="56" height="56" viewBox="0 0 24 24" className="overflow-visible mb-2">
                          {/* Trunk */}
                          <rect x="10.5" y="14" width="3" height="8" fill={tree.type === 'spoiled' ? "#4b5563" : "#5c2d0b"} rx="1" />
                          {/* Leaves / Dead Twigs */}
                          {tree.type === 'spoiled' ? (
                            <path d="M12 14v-4m-3 2l3-2 3 2" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" fill="none" />
                          ) : (
                            <circle
                              cx="12" cy="11"
                              r={5 + (tree.stage * 2)}
                              fill={TREE_TYPES[tree.type as keyof typeof TREE_TYPES].color}
                              opacity="0.9"
                            />
                          )}
                          {/* Gathered Fruit at the base (for stage >= 3) */}
                          {tree.stage >= 3 && tree.type !== 'spoiled' && (
                            <g>
                              {/* Orange 1 */}
                              <line x1="9" y1="20.5" x2="9" y2="22" stroke="#5c2d0b" strokeWidth="0.5" />
                              <circle cx="9" cy="22" r="1.5" fill="#f97316" />
                              {/* Orange 2 */}
                              <line x1="15" y1="20.5" x2="15" y2="22" stroke="#5c2d0b" strokeWidth="0.5" />
                              <circle cx="15" cy="22" r="1.4" fill="#f97316" />
                              {/* Orange 3 */}
                              <line x1="12" y1="21.5" x2="12" y2="23" stroke="#5c2d0b" strokeWidth="0.5" />
                              <circle cx="12" cy="23" r="1.3" fill="#f97316" />
                            </g>
                          )}
                        </svg>
                        <div className={`w-12 h-1 rounded-full overflow-hidden border ${
                          theme === 'dark' ? 'bg-zinc-700 border-zinc-600' : 'bg-gray-200 border-gray-300'
                        }`}>
                          <motion.div
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                            style={{ width: `${(tree.stage / 4) * 100}%` }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.section>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className={`text-center py-6 border-t ${theme === 'dark' ? 'border-zinc-700/50' : 'border-orange-200/50'}`}
          >
            <p className="text-sm opacity-60 italic">&quot;An orchard is grown with patience and nurtured by persistence.&quot;</p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
})
