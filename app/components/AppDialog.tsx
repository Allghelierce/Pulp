"use client"
import { useState, memo } from "react"
import { motion } from "framer-motion"
import type { DialogConfig } from "@/app/types"

const font = '"EB Garamond", serif'

export const AppDialog = memo(function AppDialog({ config, accent, onClose }: { config: DialogConfig; accent: string; onClose: () => void }) {
  const [val, setVal] = useState(config.type === "prompt" ? (config.defaultValue ?? "") : "")
  const [checked, setChecked] = useState(false)

  const confirm = () => {
    if (config.type === "prompt") config.onConfirm(val.trim() || (config.defaultValue ?? ""))
    else if (config.type === "confirm") config.onConfirm(checked)
    else if (config.type === "alert" && (config as any).onConfirm) (config as any).onConfirm()
    onClose()
  }

  const danger = config.type === "confirm" && config.danger
  const btnColor = danger ? "#ef4444" : accent

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        onClick={onClose}
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 4 }}
        transition={{ duration: 0.12 }}
        className="relative w-full overflow-hidden"
        style={{
          maxWidth: 320,
          borderRadius: 12,
          background: '#09090b',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 20px 60px -10px rgba(0,0,0,0.6)',
        }}
        onKeyDown={e => {
          if (e.key === "Enter" && config.type !== "alert") { e.preventDefault(); confirm(); }
          if (e.key === "Escape") onClose();
        }}
      >
        <div className="px-6 pt-5 pb-5">
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e4e0d8', fontFamily: font, margin: 0, lineHeight: 1.3 }}>
            {config.title}
          </h2>

          {(config.type === "confirm" || config.type === "alert") && config.message && (
            <p style={{ fontSize: 13, color: '#8a8680', fontFamily: font, marginTop: 6, lineHeight: 1.5, margin: '6px 0 0' }}>
              {config.message}
            </p>
          )}

          {config.type === "prompt" && (
            <input
              autoFocus
              value={val}
              onChange={e => setVal(e.target.value)}
              placeholder={config.placeholder ?? "Type something..."}
              style={{
                fontFamily: font,
                fontSize: 13,
                width: '100%',
                marginTop: 12,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(0,0,0,0.3)',
                color: '#e4e0d8',
                outline: 'none',
              }}
              onFocus={e => e.currentTarget.style.borderColor = `${accent}50`}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          )}

          {config.type === "confirm" && config.showCheckbox && (
            <label className="flex items-center gap-2.5 cursor-pointer select-none" style={{ marginTop: 14 }}>
              <div
                onClick={() => setChecked(!checked)}
                style={{
                  width: 16, height: 16, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: checked ? `1.5px solid ${accent}` : '1.5px solid rgba(255,255,255,0.15)',
                  background: checked ? accent : 'transparent',
                  transition: 'all 0.1s',
                }}
              >
                {checked && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 12, color: '#6a6660', fontFamily: font }}>{config.checkboxLabel ?? "Don't ask again"}</span>
            </label>
          )}

          <div className="flex gap-2" style={{ marginTop: 16 }}>
            {config.type !== "alert" && (
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 500,
                  fontFamily: font, color: '#8a8680', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              >
                Cancel
              </button>
            )}
            <button
              onClick={confirm}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
                fontFamily: font, color: '#fff', background: btnColor, border: 'none', cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
            >
              {config.type === "prompt" ? (config.confirmLabel ?? "Confirm") :
               config.type === "confirm" ? (config.confirmLabel ?? "Confirm") :
               (config as any).confirmLabel ?? "OK"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
})
