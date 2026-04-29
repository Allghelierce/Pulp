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

function HandfulSprite({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Open palm */}
      <path d="M14 34 C10 30, 8 24, 12 18 C14 14, 18 12, 22 14 L24 16 L26 14 C30 12, 34 14, 36 18 C40 24, 38 30, 34 34 Z" fill="#8B7355" stroke="#6B5640" strokeWidth="1.2"/>
      <path d="M16 32 C13 28, 12 24, 14 20 C16 17, 19 15, 22 16" fill="none" stroke="#a08c6e" strokeWidth="0.8" opacity="0.5"/>
      {/* Fingers */}
      <path d="M16 18 C15 14, 16 10, 18 8 C19 7, 21 7, 21 9 L21 16" fill="#8B7355" stroke="#6B5640" strokeWidth="1"/>
      <path d="M21 15 C21 10, 22 6, 24 5 C25 4, 27 5, 26 8 L25 15" fill="#8B7355" stroke="#6B5640" strokeWidth="1"/>
      <path d="M26 15 C27 10, 28 7, 30 6 C31 5, 33 6, 32 9 L30 16" fill="#8B7355" stroke="#6B5640" strokeWidth="1"/>
      <path d="M31 18 C33 14, 34 11, 33 9" fill="none" stroke="#6B5640" strokeWidth="1"/>
      {/* Gems in palm */}
      <polygon points="20,24 22,20 26,20 28,24 26,28 22,28" fill="#7dd3fc" stroke="#38bdf8" strokeWidth="0.8"/>
      <polygon points="20,24 22,20 24,24 22,28" fill="#bae6fd" opacity="0.5"/>
      <circle cx="18" cy="26" r="2.5" fill="#a78bfa" stroke="#8b5cf6" strokeWidth="0.6"/>
      <circle cx="30" cy="25" r="2" fill="#fbbf24" stroke="#d97706" strokeWidth="0.6"/>
      {/* Sparkles */}
      <circle cx="24" cy="18" r="0.8" fill="#fff" opacity="0.7"/>
      <circle cx="30" cy="22" r="0.6" fill="#fff" opacity="0.5"/>
    </svg>
  )
}

function PouchSprite({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Pouch body */}
      <path d="M12 22 C10 28, 10 34, 14 38 C18 42, 30 42, 34 38 C38 34, 38 28, 36 22 Z" fill="#92400e" stroke="#78350f" strokeWidth="1.2"/>
      <path d="M14 24 C13 28, 13 33, 16 36" fill="none" stroke="#a16207" strokeWidth="0.8" opacity="0.4"/>
      {/* Pouch neck / drawstring */}
      <path d="M14 22 C14 18, 16 16, 20 16 L28 16 C32 16, 34 18, 34 22" fill="#a16207" stroke="#78350f" strokeWidth="1"/>
      <path d="M16 16 C18 14, 20 15, 24 13 C28 15, 30 14, 32 16" fill="none" stroke="#78350f" strokeWidth="1.2"/>
      {/* Drawstring ties */}
      <path d="M20 13 C18 10, 14 10, 14 13" fill="none" stroke="#78350f" strokeWidth="1" strokeLinecap="round"/>
      <path d="M28 13 C30 10, 34 10, 34 13" fill="none" stroke="#78350f" strokeWidth="1" strokeLinecap="round"/>
      {/* Gems peeking out */}
      <polygon points="22,16 24,12 26,16" fill="#7dd3fc" stroke="#38bdf8" strokeWidth="0.6"/>
      <polygon points="19,17 20,14 22,16" fill="#a78bfa" stroke="#8b5cf6" strokeWidth="0.5"/>
      <circle cx="28" cy="15" r="1.5" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5"/>
      {/* Pouch detail stitching */}
      <path d="M18 28 L18 34" fill="none" stroke="#78350f" strokeWidth="0.6" strokeDasharray="1.5 2" opacity="0.5"/>
      <path d="M30 28 L30 34" fill="none" stroke="#78350f" strokeWidth="0.6" strokeDasharray="1.5 2" opacity="0.5"/>
      {/* Sparkles */}
      <circle cx="24" cy="10" r="1" fill="#fff" opacity="0.8"/>
      <circle cx="18" cy="12" r="0.6" fill="#fff" opacity="0.5"/>
      <circle cx="30" cy="12" r="0.7" fill="#fff" opacity="0.6"/>
    </svg>
  )
}

function ChestSprite({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Chest body */}
      <rect x="8" y="22" width="32" height="18" rx="2" fill="#92400e" stroke="#78350f" strokeWidth="1.2"/>
      {/* Wood grain */}
      <path d="M10 28 H38" stroke="#78350f" strokeWidth="0.6" opacity="0.4"/>
      <path d="M10 33 H38" stroke="#78350f" strokeWidth="0.6" opacity="0.4"/>
      {/* Chest lid — open, tilted back */}
      <path d="M8 22 L8 16 C8 12, 12 10, 24 10 C36 10, 40 12, 40 16 L40 22" fill="#a16207" stroke="#78350f" strokeWidth="1.2"/>
      <path d="M8 16 C8 12, 12 10, 24 10 C36 10, 40 12, 40 16" fill="#b45309" stroke="#78350f" strokeWidth="0.8"/>
      {/* Metal bands */}
      <rect x="8" y="21" width="32" height="3" fill="#d97706" opacity="0.3"/>
      <rect x="8" y="15" width="32" height="2" rx="0.5" fill="#d97706" opacity="0.25"/>
      {/* Lock / clasp */}
      <rect x="21" y="20" width="6" height="5" rx="1" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8"/>
      <circle cx="24" cy="23" r="1" fill="#92400e"/>
      {/* Gems overflowing */}
      <polygon points="16,14 18,10 20,14" fill="#7dd3fc" stroke="#38bdf8" strokeWidth="0.6"/>
      <polygon points="22,12 24,8 26,12" fill="#a78bfa" stroke="#8b5cf6" strokeWidth="0.6"/>
      <polygon points="28,14 30,10 32,14" fill="#fbbf24" stroke="#d97706" strokeWidth="0.6"/>
      <circle cx="19" cy="11" r="1.8" fill="#34d399" stroke="#059669" strokeWidth="0.5"/>
      <circle cx="29" cy="11" r="1.5" fill="#fb7185" stroke="#e11d48" strokeWidth="0.5"/>
      {/* Glow / sparkles */}
      <circle cx="24" cy="6" r="1.2" fill="#fff" opacity="0.8"/>
      <circle cx="17" cy="8" r="0.7" fill="#fff" opacity="0.5"/>
      <circle cx="31" cy="8" r="0.8" fill="#fff" opacity="0.6"/>
      <circle cx="24" cy="11" r="0.5" fill="#fff" opacity="0.9"/>
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
              <p style={{ fontSize: 9, color: '#3a3630', lineHeight: 1.4, textAlign: 'center', margin: 0, fontFamily: font }}>
                Gems unlock cosmetics and recover lost sap.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
