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

  return (
    <motion.div
      initial={{ y: 50, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 50, opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`fixed bottom-8 right-8 z-[100] cursor-pointer flex items-center gap-4 p-3 pr-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border ${
        isDark ? "bg-[#09090b]/90 border-zinc-800" : "bg-white/95 border-orange-100"
      } backdrop-blur-3xl group transition-all`}
    >
      {/* Miniature Botanical Circle */}
      <div className="relative w-12 h-12 flex items-center justify-center">
         <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} strokeWidth="6" />
            <motion.circle 
               cx="50" cy="50" r="44" fill="none" 
               stroke="#ea580c" strokeWidth="8" strokeLinecap="round" strokeDasharray="276"
               animate={{ strokeDashoffset: 276 - (276 * progress) }} 
               transition={{ duration: 1.2, ease: "easeOut" }}
            />
         </svg>
         
         {/* Small Growing Asset Icon */}
         <motion.div 
           animate={{ scale: [1, 1.05, 1] }} 
           transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
           className="relative z-10 w-5 h-5 flex items-center justify-center"
         >
            {progress < 0.2 ? (
               <div className="w-1.5 h-1.5 bg-[#5d4037] rounded-full rotate-45 transform translate-y-0.5" style={{ borderRadius: '100% 0% 100% 0%' }} />
            ) : progress < 0.7 ? (
               <div className="flex flex-col items-center">
                  <div className="w-3 h-1.5 bg-emerald-500 rounded-full mb-0.5" style={{ borderRadius: '100% 0' }} />
                  <div className="w-0.5 h-2 bg-emerald-700/50 rounded-full" />
               </div>
            ) : (
               <div className="w-4 h-4 bg-[#ea580c] rounded-full shadow-inner border border-white/20 overflow-hidden relative">
                  <div className="absolute -top-1 -left-1 w-2 h-1 bg-white/30 rounded-full blur-[1px]" />
               </div>
            )}
         </motion.div>
      </div>

      <div className="flex flex-col min-w-[64px]">
        <span className="text-[16px] font-medium tracking-tight tabular-nums leading-tight" style={{ fontFamily: '"EB Garamond", serif', color: isDark ? "#fff" : "#18181b" }}>
          {remainingTime}
        </span>
        <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${
          isComplete ? "text-emerald-500" : isDark ? "text-zinc-600 group-hover:text-zinc-400" : "text-zinc-300 group-hover:text-zinc-400"
        }`}>
          {isComplete ? "Bloom" : "Growth"}
        </span>
      </div>

      {/* Pulsing indicator */}
      {!isComplete && (
        <div className="absolute top-2 right-2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ea580c] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ea580c]"></span>
        </div>
      )}
      
      {/* Subtle Shadow bloom */}
      <div className="absolute inset-0 rounded-3xl bg-[#ea580c]/3 blur-xl -z-10 group-hover:bg-[#ea580c]/5 transition-all" />
    </motion.div>
  )
}
