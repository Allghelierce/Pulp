"use client"
import { memo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface GemStoreModalProps {
  isOpen: boolean
  onClose: () => void
  gems: number
}

const GEM_PACKS = [
  { id: "handful", amount: 50, price: "$1.99", label: "Handful", icon: "💎" },
  { id: "pouch", amount: 150, price: "$4.99", label: "Pouch", icon: "💎💎", popular: true },
  { id: "chest", amount: 500, price: "$12.99", label: "Chest", icon: "💎💎💎" },
]

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
          className="fixed inset-0 z-[1100] flex items-center justify-center"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 350 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: "relative",
              width: 420,
              maxWidth: "90vw",
              background: "linear-gradient(165deg, #1e1a16 0%, #141210 100%)",
              border: "1px solid rgba(180,140,80,0.12)",
              borderRadius: 18,
              boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset",
              overflow: "hidden",
            }}
          >
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "radial-gradient(ellipse 60% 40% at 50% -10%, rgba(139,122,205,0.08) 0%, transparent 60%)",
            }} />

            {/* Header */}
            <div style={{ padding: "22px 26px 14px", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 600, color: "#d8d0c4", fontFamily: '"EB Garamond", Georgia, serif', margin: 0 }}>
                    Get Gems
                  </h2>
                  <p style={{ fontSize: 11, color: "#706860", marginTop: 3 }}>
                    You have {gems} 💎
                  </p>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.04)", color: "#706860", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 3 Purchase Options */}
            <div style={{ padding: "8px 22px 22px", display: "flex", gap: 10, position: "relative" }}>
              {GEM_PACKS.map(pack => (
                <button
                  key={pack.id}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    padding: "20px 12px 16px",
                    background: pack.popular ? "rgba(180,140,80,0.08)" : "rgba(255,255,255,0.02)",
                    border: pack.popular ? "1px solid rgba(180,140,80,0.2)" : "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 14,
                    cursor: "pointer",
                    transition: "all 150ms ease",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = pack.popular ? "rgba(180,140,80,0.13)" : "rgba(255,255,255,0.06)"
                    ;(e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = pack.popular ? "rgba(180,140,80,0.08)" : "rgba(255,255,255,0.02)"
                    ;(e.currentTarget as HTMLElement).style.transform = "translateY(0)"
                  }}
                >
                  {pack.popular && (
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0,
                      fontSize: 8, fontWeight: 700, color: "#1a1614", background: "linear-gradient(90deg, #b8943a, #d4a84a)",
                      padding: "2px 0", textAlign: "center", textTransform: "uppercase", letterSpacing: 1,
                    }}>
                      Most Popular
                    </div>
                  )}
                  <div style={{ fontSize: 24, marginTop: pack.popular ? 6 : 0 }}>
                    {pack.icon}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: "#d8d0c4", fontFamily: '"EB Garamond", Georgia, serif' }}>
                    {pack.amount}
                  </div>
                  <div style={{ fontSize: 10, color: "#5a5450", marginBottom: 4 }}>{pack.label}</div>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: "#b8943a",
                    background: "rgba(180,140,80,0.1)", borderRadius: 8, padding: "5px 14px",
                    width: "100%", textAlign: "center",
                  }}>
                    {pack.price}
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: "0 22px 16px", position: "relative" }}>
              <p style={{ fontSize: 9, color: "#4a4640", lineHeight: 1.4, textAlign: "center", margin: 0 }}>
                Gems buy seeds, cosmetics, and recover lost sunshine.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
