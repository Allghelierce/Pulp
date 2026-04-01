"use client"

import { motion } from "framer-motion"
import { BookOpen } from "lucide-react"

interface AnimatedCreateButtonProps {
  onClick: () => void
  accent: string
  theme: "light" | "dark"
}

export function AnimatedCreateButton({ onClick, accent, theme }: AnimatedCreateButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className="relative w-full rounded-lg font-medium overflow-hidden active:scale-95"
      style={{ height: "48px", paddingTop: "4px" }}
      whileHover="hover"
      initial="initial"
    >
      {/* Layer 3 - Deep shadow (bottom, visible) */}
      <motion.div
        className="absolute left-0 right-0 rounded-lg"
        style={{
          backgroundColor: accent,
          opacity: 0.25,
          height: "48px",
          bottom: "-4px",
          zIndex: 0
        }}
        variants={{
          initial: { scaleY: 0.85 },
          hover: { scaleY: 0.88 }
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      />

      {/* Layer 2 - Mid shadow (visible) */}
      <motion.div
        className="absolute left-0 right-0 rounded-lg"
        style={{
          backgroundColor: accent,
          opacity: 0.55,
          height: "48px",
          bottom: "-2px",
          zIndex: 1
        }}
        variants={{
          initial: { scaleY: 0.92 },
          hover: { scaleY: 0.94 }
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      />

      {/* Layer 1 - Main button (on top) */}
      <motion.div
        className="absolute inset-0 rounded-lg flex items-center justify-center gap-2 text-white font-medium overflow-hidden"
        style={{
          backgroundColor: accent,
          zIndex: 2,
          height: "48px"
        }}
        variants={{
          initial: { y: 0 },
          hover: { y: -1 }
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Content wrapper */}
        <motion.div
          className="flex items-center gap-2 relative z-10"
          variants={{
            initial: { y: 0, opacity: 1 },
            hover: { y: -48, opacity: 0 }
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <BookOpen size={18} />
          <span>Start Now</span>
        </motion.div>

        {/* Hover text */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center font-bold text-white z-10"
          style={{ height: "48px" }}
          variants={{
            initial: { y: 48, opacity: 0 },
            hover: { y: 0, opacity: 1 }
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <span style={{ fontSize: "28px", lineHeight: "1" }}>+</span>
        </motion.div>
      </motion.div>
    </motion.button>
  )
}
