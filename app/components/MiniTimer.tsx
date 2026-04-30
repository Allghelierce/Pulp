"use client"
import { motion, AnimatePresence } from "framer-motion"

interface MiniTimerProps {
  isRunning: boolean
  remainingTime: string
  progress: number
  accent: string
  isDark: boolean
  onClick: () => void
}

export function MiniTimer({ isRunning, remainingTime, progress, accent, isDark, onClick }: MiniTimerProps) {
  if (!isRunning) return null

  const isComplete = progress >= 1
  const waveHeight = 100 - (progress * 100)

  return (
    <motion.div
      initial={{ y: 50, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 50, opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`fixed bottom-8 right-8 z-[100] cursor-pointer flex items-center gap-4 p-3 pr-6 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border ${
        isDark ? "bg-[#09090b]/90 border-zinc-800" : "bg-white/95 border-orange-100"
      } backdrop-blur-3xl group transition-all`}
    >
      {/* Hand-drawn Mini Orange Liquid Fill */}
      <div className="relative w-11 h-11 flex items-center justify-center">
         <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-12 transition-transform group-hover:rotate-0">
            <defs>
               <clipPath id="mini-orange-liquid-clip">
                 <motion.path 
                    animate={{ 
                      d: [
                        `M -20 ${waveHeight} Q 15 ${waveHeight - 3}, 50 ${waveHeight} T 120 ${waveHeight} V 120 H -20 Z`,
                        `M -20 ${waveHeight} Q 15 ${waveHeight + 3}, 50 ${waveHeight} T 120 ${waveHeight} V 120 H -20 Z`,
                        `M -20 ${waveHeight} Q 15 ${waveHeight - 3}, 50 ${waveHeight} T 120 ${waveHeight} V 120 H -20 Z`
                      ]
                    }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  />
               </clipPath>
            </defs>
            
            {/* Outline */}
            <path 
              d="M50 15 C35 15 15 30 15 50 C15 70 35 85 50 85 C65 85 85 70 85 50 C85 30 65 15 50 15 Z" 
              fill="none" stroke={isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)"} strokeWidth="6" 
            />
            
            {/* Liquid Fill */}
            <g clipPath="url(#mini-orange-liquid-clip)">
              <path 
                d="M50 15 C35 15 15 30 15 50 C15 70 35 85 50 85 C65 85 85 70 85 50 C85 30 65 15 50 15 Z" 
                fill="#d97706" 
              />
              <path 
                d="M50 15 L50 40" stroke="white" strokeOpacity="0.15" strokeWidth="2" strokeLinecap="round"
              />
            </g>
         </svg>
         
         {/* Stem */}
         <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-3 bg-[#4a2c2a] rounded-full -mt-0.5" />
      </div>

      <div className="flex flex-col min-w-[56px]">
        <span className="text-[17px] font-bold tracking-tight tabular-nums leading-tight" style={{ fontFamily: 'Georgia, serif', color: isDark ? "#fff" : "#18181b" }}>
          {remainingTime}
        </span>
        <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-colors ${
          isComplete ? "text-emerald-500" : isDark ? "text-zinc-600" : "text-orange-400"
        }`}>
          {isComplete ? "Ready" : "Pulping"}
        </span>
      </div>

      {/* Pulsing indicator */}
      {!isComplete && (
        <div className="absolute top-1 right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d97706] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d97706]"></span>
        </div>
      )}
    </motion.div>
  )
}
