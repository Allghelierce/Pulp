"use client"
import { memo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface GemStoreModalProps {
  isOpen: boolean
  onClose: () => void
  gems: number
}

const GEM_PACKS = [
  { id: "handful", amount: 5, price: "$1.49", label: "Handful" },
  { id: "pouch", amount: 15, price: "$2.99", label: "Pouch", popular: true },
  { id: "chest", amount: 40, price: "$5.99", label: "Chest" },
]

const font = '"EB Garamond", Georgia, serif'
const accent = '#ea580c'

export const GemStoreModal = memo(function GemStoreModal({ isOpen, onClose, gems }: GemStoreModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
          onMouseDown={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            onMouseDown={e => e.stopPropagation()}
            className="relative w-full overflow-hidden"
            style={{
              maxWidth: 380,
              borderRadius: 16,
              background: '#0c0e10',
              boxShadow: '0 25px 80px -15px rgba(0,0,0,0.7)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: '#dcd8d0', fontFamily: font, margin: 0, letterSpacing: '-0.01em' }}>
                  Get Gems
                </h2>
                <p style={{ fontSize: 11, color: '#5a5650', marginTop: 2, fontFamily: font }}>
                  You have <span style={{ color: accent, fontWeight: 600 }}>{gems}</span> 💎
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: '#5a5650' }}
                onMouseEnter={e => e.currentTarget.style.color = '#dcd8d0'}
                onMouseLeave={e => e.currentTarget.style.color = '#5a5650'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Packs */}
            <div className="px-5 py-4 flex gap-3">
              {GEM_PACKS.map(pack => (
                <button
                  key={pack.id}
                  className="flex-1 flex flex-col items-center gap-2 rounded-xl transition-all relative overflow-hidden"
                  style={{
                    padding: '20px 10px 16px',
                    background: pack.popular ? `${accent}0a` : 'rgba(255,255,255,0.02)',
                    border: pack.popular ? `1px solid ${accent}25` : '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = pack.popular ? `${accent}15` : 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = pack.popular ? `${accent}0a` : 'rgba(255,255,255,0.02)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {pack.popular && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0,
                      fontSize: 8, fontWeight: 700, color: '#fff', background: accent,
                      padding: '2px 0', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>
                      Popular
                    </div>
                  )}
                  <span style={{ fontSize: 22, marginTop: pack.popular ? 4 : 0 }}>💎</span>
                  <span style={{ fontSize: 18, fontWeight: 600, color: '#dcd8d0', fontFamily: font }}>
                    {pack.amount}
                  </span>
                  <span style={{ fontSize: 10, color: '#5a5650', fontFamily: font }}>{pack.label}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: accent,
                    background: `${accent}10`, borderRadius: 8, padding: '4px 12px',
                    width: '100%', textAlign: 'center', fontFamily: font,
                  }}>
                    {pack.price}
                  </span>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 pb-4">
              <p style={{ fontSize: 9, color: '#3a3630', lineHeight: 1.4, textAlign: 'center', margin: 0, fontFamily: font }}>
                Gems unlock cosmetics and recover lost sunshine.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
