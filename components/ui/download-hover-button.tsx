"use client"

import * as React from "react"
import { motion } from "framer-motion"

interface AnimatedDownloadButtonProps {
  onDownload: () => void
}

export default function AnimatedDownloadButton({ onDownload }: AnimatedDownloadButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <motion.button
      onClick={onDownload}
      initial={{ width: 28 }}
      whileHover={{ width: 100 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="h-[28px] bg-transparent border border-[#e4e4e7]/60 hover:border-[#d4d4d8] hover:bg-[#f9f9f9] overflow-hidden relative flex items-center justify-center shrink-0"
      style={{ borderRadius: 6 }}
      title="Download note"
    >
      <motion.div
        className="absolute"
        animate={{
          opacity: isHovered ? 0 : 1,
          scale: isHovered ? 0.7 : 1,
        }}
        transition={{ duration: 0.15 }}
      >
        <svg className="w-3.5 h-3.5 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </motion.div>

      <motion.span
        className="text-[13.5px] font-normal tracking-wide text-[#6b6b72] whitespace-nowrap"
        style={{ fontFamily: '"EB Garamond", Georgia, serif' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.15, delay: isHovered ? 0.1 : 0 }}
      >
        Export
      </motion.span>
    </motion.button>
  )
}
