"use client"
import { memo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GemIcon } from '@/app/components/CurrencyIcons'

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
const accent = '#d97706'

function GemShape({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const id = `gs-${x}-${y}`
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d="M0,-4 L-3.5,0 L0,6 L3.5,0 Z" fill={`url(#${id}-b)`}/>
      <path d="M-3.5,0 L0,-4 L3.5,0" fill={`url(#${id}-t)`}/>
      <path d="M-3.5,0 L0,1.5 L3.5,0" fill="#7dd3fc" opacity="0.3"/>
      <path d="M-3.5,0 L0,6 L0,1.5 Z" fill="#38bdf8" opacity="0.4"/>
      <path d="M3.5,0 L0,6 L0,1.5 Z" fill="#0284c7" opacity="0.3"/>
      <defs>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8"/>
          <stop offset="50%" stopColor="#0ea5e9"/>
          <stop offset="100%" stopColor="#0369a1"/>
        </linearGradient>
        <linearGradient id={`${id}-t`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7dd3fc"/>
          <stop offset="100%" stopColor="#38bdf8"/>
        </linearGradient>
      </defs>
    </g>
  )
}

function HandfulSprite({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <GemShape x={16} y={28} s={1.1}/>
      <GemShape x={24} y={24} s={1.3}/>
      <GemShape x={32} y={28} s={1}/>
      <circle cx="20" cy="18" r="0.8" fill="#fff" opacity="0.6"/>
      <circle cx="28" cy="19" r="0.6" fill="#fff" opacity="0.5"/>
    </svg>
  )
}

function PouchSprite({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Pouch body */}
      <path d="M15 22 C14 28, 14 34, 16 37 C18 40, 21 42, 24 42 C27 42, 30 40, 32 37 C34 34, 34 28, 33 22 Z" fill="#92400e" stroke="#78350f" strokeWidth="1.2"/>
      {/* Highlight */}
      <path d="M19 25 C18 30, 19 36, 24 38 C22 36, 20 32, 19 25 Z" fill="#b45309" opacity="0.5"/>
      {/* Gathered neck / cinch */}
      <path d="M15 22 C18 24, 21 25, 24 25 C27 25, 30 24, 33 22" fill="none" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Drawstring ties */}
      <path d="M21 22 C19 18, 16 15, 15 13" fill="none" stroke="#78350f" strokeWidth="1" strokeLinecap="round"/>
      <path d="M27 22 C29 18, 32 15, 33 13" fill="none" stroke="#78350f" strokeWidth="1" strokeLinecap="round"/>
      {/* Drawstring knot */}
      <ellipse cx="24" cy="22" rx="2.5" ry="1.5" fill="#78350f"/>
      {/* Sparkle */}
      <circle cx="21" cy="30" r="0.7" fill="#fff" opacity="0.4"/>
    </svg>
  )
}

function ChestSprite({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Chest bottom box */}
      <rect x="10" y="26" width="28" height="12" rx="2" fill="#92400e" stroke="#78350f" strokeWidth="1.2"/>
      {/* Bottom highlight */}
      <rect x="12" y="28" width="24" height="3" rx="1" fill="#a16207" opacity="0.3"/>
      {/* Lid - flat rectangle sitting on top */}
      <rect x="9" y="18" width="30" height="9" rx="2" fill="#a16207" stroke="#78350f" strokeWidth="1.2"/>
      {/* Lid top face highlight */}
      <rect x="11" y="19" width="26" height="4" rx="1" fill="#b45309" opacity="0.4"/>
      {/* Metal band across seam */}
      <rect x="9" y="25" width="30" height="2.5" rx="0.5" fill="#d97706" opacity="0.3" stroke="#78350f" strokeWidth="0.5"/>
      {/* Lock/clasp */}
      <rect x="21" y="24" width="6" height="5" rx="1" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8"/>
      <circle cx="24" cy="27" r="1" fill="#92400e"/>
      {/* Corner studs */}
      <circle cx="12" cy="36" r="1" fill="#d97706" opacity="0.5"/>
      <circle cx="36" cy="36" r="1" fill="#d97706" opacity="0.5"/>
      {/* Shine on lid */}
      <circle cx="18" cy="21" r="0.8" fill="#fff" opacity="0.5"/>
    </svg>
  )
}

const PACK_SPRITES: Record<string, React.FC<{ size?: number }>> = {
  handful: HandfulSprite,
  pouch: PouchSprite,
  chest: ChestSprite,
}

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
          className="fixed inset-0 z-[1100] flex items-start justify-center p-4"
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
              maxWidth: 440,
              marginTop: 48,
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
                  You have <span style={{ color: accent, fontWeight: 600 }}>{gems}</span> <GemIcon size={11} />
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
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
                    padding: '24px 12px 18px',
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
                  <span style={{ marginTop: pack.popular ? 4 : 0 }}>{(() => { const Sprite = PACK_SPRITES[pack.id]; return Sprite ? <Sprite size={52} /> : <GemIcon size={26} /> })()}</span>
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
              <p style={{ fontSize: 10, color: '#71717a', lineHeight: 1.4, textAlign: 'center', margin: 0, fontFamily: font }}>
                Gems unlock cosmetics and recover lost sap.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
