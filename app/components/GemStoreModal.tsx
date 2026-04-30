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
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <polygon points="0,-5 -3.5,0 0,5 3.5,0" fill="#0ea5e9" stroke="#0369a1" strokeWidth="0.8"/>
      <polygon points="0,-5 -3.5,0 0,0" fill="#7dd3fc" opacity="0.5"/>
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
      <ellipse cx="24" cy="32" rx="11" ry="9" fill="#92400e" stroke="#78350f" strokeWidth="1.2"/>
      <path d="M16 24 C16 20, 19 18, 24 18 C29 18, 32 20, 32 24" fill="#a16207" stroke="#78350f" strokeWidth="1"/>
      <path d="M18 18 C20 16, 22 17, 24 15 C26 17, 28 16, 30 18" fill="none" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M21 15 C19 11, 15 11, 16 15" fill="none" stroke="#78350f" strokeWidth="1" strokeLinecap="round"/>
      <path d="M27 15 C29 11, 33 11, 32 15" fill="none" stroke="#78350f" strokeWidth="1" strokeLinecap="round"/>
      <GemShape x={21} y={14} s={0.8}/>
      <GemShape x={27} y={15} s={0.7}/>
      <circle cx="24" cy="10" r="0.8" fill="#fff" opacity="0.7"/>
    </svg>
  )
}

function ChestSprite({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="10" y="24" width="28" height="14" rx="2" fill="#92400e" stroke="#78350f" strokeWidth="1.2"/>
      <rect x="10" y="23" width="28" height="2.5" fill="#d97706" opacity="0.25"/>
      <GemShape x={17} y={21} s={0.8}/>
      <GemShape x={24} y={19} s={0.9}/>
      <GemShape x={31} y={21} s={0.8}/>
      <path d="M10 24 L8 15 C8 11, 14 8, 24 8 C34 8, 40 11, 40 15 L38 24" fill="#a16207" stroke="#78350f" strokeWidth="1.2"/>
      <path d="M8 15 C8 11, 14 8, 24 8 C34 8, 40 11, 40 15" fill="#b45309" stroke="#78350f" strokeWidth="0.8"/>
      <rect x="21" y="23" width="6" height="4" rx="1" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8"/>
      <circle cx="24" cy="25.5" r="0.8" fill="#92400e"/>
      <circle cx="24" cy="12" r="0.8" fill="#fff" opacity="0.6"/>
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
                  <span style={{ marginTop: pack.popular ? 4 : 0 }}>{(() => { const Sprite = PACK_SPRITES[pack.id]; return Sprite ? <Sprite size={40} /> : <GemIcon size={22} /> })()}</span>
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
