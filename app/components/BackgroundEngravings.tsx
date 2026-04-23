"use client"
import React from "react"
import { motion } from "framer-motion"

const symbols = [
  // Orange icon
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3 v2" />
    <path d="M14 4 l-2 2" />
  </svg>,
  // Leaf
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20 a15 15 0 0 1 7-13 15 15 0 0 1-13 7 15 15 0 0 1 6 6Z" />
    <path d="M11 20 v-13" />
  </svg>,
  // Pen/Writing
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l5 5" />
  </svg>,
  // Book
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6.5a2.5 2.5 0 0 0-2 2.5v1a2.5 2.5 0 0 0 2.5 2.5H20" />
  </svg>,
  // Sun/Light
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>,
  // Pulse/Vitality
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
]

export function BackgroundEngravings({ theme }: { theme: "light" | "dark" }) {
  const isDark = theme === "dark"
  const strokeColor = isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.015)"
  const textColor = isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)"

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" style={{ zIndex: 0 }}>
      {/* Sketched Text Engravings */}
      <div className="absolute top-[10%] left-[5%] rotate-[-12deg]" style={{ color: textColor, fontStyle: 'italic', fontSize: '120px', fontWeight: 900, fontFamily: 'var(--font-italiana)' }}>
        Pulp
      </div>
      <div className="absolute bottom-[15%] right-[8%] rotate-[15deg]" style={{ color: textColor, fontStyle: 'italic', fontSize: '80px', fontWeight: 700, fontFamily: 'var(--font-italiana)' }}>
        Garden
      </div>
      <div className="absolute top-[45%] right-[12%] rotate-[-45deg]" style={{ color: textColor, fontStyle: 'italic', fontSize: '60px', fontWeight: 600, fontFamily: 'var(--font-italiana)' }}>
        Vitality
      </div>
      <div className="absolute bottom-[40%] left-[10%] rotate-[25deg]" style={{ color: textColor, fontStyle: 'italic', fontSize: '40px', fontWeight: 500, fontFamily: 'var(--font-italiana)' }}>
        Mindfulness
      </div>

      {/* Decorative Icons */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          style={{
            top: `${Math.random() * 90}%`,
            left: `${Math.random() * 90}%`,
            width: `${40 + Math.random() * 120}px`,
            height: `${40 + Math.random() * 120}px`,
            color: strokeColor,
            transform: `rotate(${Math.random() * 360}deg)`,
            filter: 'url(#handwritten-jitter-subtle)'
          }}
        >
          {symbols[i % symbols.length]}
        </motion.div>
      ))}

      {/* Subtle Scratch Marks / Textures */}
      <svg width="100%" height="100%" className="absolute inset-0" style={{ opacity: isDark ? 0.2 : 0.05 }}>
        <filter id="handwritten-jitter-subtle-bg">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
        </filter>
        <g filter="url(#handwritten-jitter-subtle-bg)" stroke={strokeColor} fill="none" strokeWidth="0.5">
          <path d="M10,10 Q50,50 100,20 T200,80" />
          <path d="M800,200 Q850,300 750,400 T600,500" />
          <path d="M1500,800 Q1400,900 1300,750 T1200,600" />
        </g>
      </svg>
    </div>
  )
}
