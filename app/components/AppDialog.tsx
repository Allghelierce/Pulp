"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { DialogConfig } from "@/app/types"

export function AppDialog({ config, accent, onClose }: { config: DialogConfig; accent: string; onClose: () => void }) {
  const [val, setVal] = useState(config.type === "prompt" ? (config.defaultValue ?? "") : "")
  const [checked, setChecked] = useState(false)

  const confirm = () => {
    if (config.type === "prompt") config.onConfirm(val.trim())
    else if (config.type === "confirm") config.onConfirm(checked)
    else if (config.type === "alert" && (config as any).onConfirm) (config as any).onConfirm()
    onClose()
  }

  const orange = "#F5A030"
  const btnColor = config.type === "confirm" && config.danger ? "#ef4444" : orange

  // Close on backdrop click (optional, but requested implicitly by "Pulp design language" which is dark/modal-ish)
  
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 sm:p-0">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Dialog Frame */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative bg-zinc-800 border border-zinc-700/50 rounded-2xl shadow-[0_32px_128px_rgba(0,0,0,0.8)] w-full max-w-[360px] overflow-hidden"
        onKeyDown={e => { 
          if (e.key === "Enter" && config.type !== "alert") { e.preventDefault(); confirm(); }
          if (e.key === "Escape") onClose();
        }}
      >
        {/* Header Decor */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-right from-transparent via-orange-500/30 to-transparent" />

        <div className="px-8 pt-10 pb-8 flex flex-col items-center text-center">
          {/* Icon/Visual feedback based on type */}
          <div className="mb-6 w-14 h-14 rounded-full bg-zinc-700/30 flex items-center justify-center border border-zinc-700/50">
            {config.type === "prompt" && <span className="text-2xl text-orange-400">✨</span>}
            {config.type === "confirm" && <span className="text-2xl text-orange-400">⚠️</span>}
            {config.type === "alert" && <span className="text-2xl text-orange-400">👋</span>}
          </div>

          <h2 
            className="text-2xl text-white tracking-widest uppercase mb-3"
            style={{ fontFamily: 'var(--font-italiana)' }}
          >
            {config.type === "prompt" ? config.title : config.title}
          </h2>

          {(config.type === "confirm" || config.type === "alert") && config.message && (
            <p className="text-[14px] text-zinc-400 leading-relaxed max-w-[260px] mb-6" style={{ fontFamily: '"EB Garamond", serif' }}>
              {config.message}
            </p>
          )}

          {config.type === "prompt" && (
            <div className="w-full mb-8">
              <input
                autoFocus
                value={val}
                onChange={e => setVal(e.target.value)}
                placeholder={config.placeholder ?? "Type something..."}
                style={{ fontFamily: '"EB Garamond", serif' }}
                className="w-full bg-zinc-900/50 border border-zinc-700 rounded-xl px-4 py-3 text-lg text-white focus:outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-zinc-600"
              />
            </div>
          )}

          {config.type === "confirm" && config.showCheckbox && (
            <label className="flex items-center gap-3 mb-8 cursor-pointer group select-none">
              <div 
                onClick={() => setChecked(!checked)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${checked ? 'bg-orange-500 border-orange-500 shadow-[0_0_15px_rgba(245,160,48,0.3)]' : 'bg-transparent border-zinc-600 group-hover:border-zinc-500'}`}
              >
                {checked && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="text-[12px] text-zinc-500 group-hover:text-zinc-400 transition-colors uppercase tracking-widest">{config.checkboxLabel ?? "Don't ask again"}</span>
            </label>
          )}

          <div className="flex flex-col w-full gap-3">
            <button
              onClick={confirm}
              className="w-full py-3.5 rounded-xl text-white text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg transition-all active:scale-[0.98] hover:brightness-110"
              style={{ backgroundColor: btnColor, boxShadow: `0 8px 24px -6px ${btnColor}44` }}
            >
              {config.type === "prompt"  ? (config.confirmLabel ?? "Confirm") :
               config.type === "confirm" ? (config.confirmLabel ?? "Confirm Selection") : "Understood"}
            </button>
            {config.type !== "alert" && (
              <button 
                onClick={onClose} 
                className="w-full py-3 rounded-xl text-[10px] font-bold text-zinc-500 uppercase tracking-[0.22em] hover:bg-zinc-700/30 transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

