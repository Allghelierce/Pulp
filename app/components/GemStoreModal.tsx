"use client"
import { memo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface GemStoreModalProps {
  isOpen: boolean
  onClose: () => void
  gems: number
}

const GEM_PACKS = [
  { id: "starter", amount: 10, price: "$0.99", label: "Starter", popular: false },
  { id: "handful", amount: 30, price: "$1.99", label: "Handful", popular: false },
  { id: "pouch", amount: 75, price: "$3.99", label: "Pouch", popular: true },
  { id: "chest", amount: 200, price: "$8.99", label: "Chest", popular: false },
  { id: "vault", amount: 500, price: "$17.99", label: "Vault", popular: false },
  { id: "treasury", amount: 1200, price: "$34.99", label: "Treasury", popular: false },
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
          className="fixed inset-0 z-[1100]"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/30" />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
            className="absolute right-0 top-0 bottom-0 flex flex-col"
            style={{
              width: 340,
              maxWidth: "85vw",
              background: "#1a1614",
              borderLeft: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "-8px 0 32px rgba(0,0,0,0.4)",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "20px 22px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              background: "linear-gradient(180deg, rgba(180,140,80,0.05) 0%, transparent 100%)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: "#d8d0c4", fontFamily: '"EB Garamond", Georgia, serif', margin: 0 }}>
                    Gem Store
                  </h2>
                  <p style={{ fontSize: 11, color: "#706860", marginTop: 3 }}>
                    Balance: {gems} 💎
                  </p>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    width: 26, height: 26, borderRadius: 7, border: "none", background: "rgba(255,255,255,0.04)",
                    color: "#706860", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Packs */}
            <div className="flex-1 overflow-y-auto" style={{ padding: "14px 16px", scrollbarWidth: "thin", scrollbarColor: "#27272a transparent" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {GEM_PACKS.map(pack => (
                  <button
                    key={pack.id}
                    className="group"
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      background: pack.popular ? "rgba(180,140,80,0.06)" : "rgba(255,255,255,0.02)",
                      border: pack.popular ? "1px solid rgba(180,140,80,0.15)" : "1px solid rgba(255,255,255,0.04)",
                      borderRadius: 10,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 150ms ease",
                      width: "100%",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = pack.popular ? "rgba(180,140,80,0.1)" : "rgba(255,255,255,0.05)" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = pack.popular ? "rgba(180,140,80,0.06)" : "rgba(255,255,255,0.02)" }}
                  >
                    <div style={{ fontSize: 18, width: 32, textAlign: "center", flexShrink: 0 }}>
                      {pack.amount >= 500 ? "💎💎💎" : pack.amount >= 100 ? "💎💎" : "💎"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#d8d0c4", fontFamily: '"EB Garamond", Georgia, serif' }}>
                          {pack.amount} Gems
                        </span>
                        {pack.popular && (
                          <span style={{
                            fontSize: 8, fontWeight: 700, color: "#1a1614", background: "#b8943a",
                            padding: "1px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.8,
                          }}>
                            Best Value
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 10, color: "#5a5450" }}>{pack.label}</span>
                    </div>
                    <div style={{
                      fontSize: 12, fontWeight: 600, color: "#b8943a",
                      background: "rgba(180,140,80,0.08)", borderRadius: 6, padding: "4px 10px",
                      flexShrink: 0,
                    }}>
                      {pack.price}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.04)",
            }}>
              <p style={{ fontSize: 9, color: "#4a4640", lineHeight: 1.4 }}>
                Purchases are non-refundable. Gems buy seeds, cosmetics, and recover lost sunshine.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
