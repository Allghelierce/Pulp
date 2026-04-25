"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: "Focus Timer",
    desc: "Pomodoro-style sessions that grow trees as you write. Stay focused, watch your forest grow.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c4-4 8-7 8-12a8 8 0 1 0-16 0c0 5 4 8 8 12z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    title: "Living Orchard",
    desc: "Each notebook has its own orchard. Complete sessions to plant trees across a hand-painted terrain.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
      </svg>
    ),
    title: "Notebooks",
    desc: "Multiple notebook types — standard, single page, flashcards, Cornell, and encrypted vaults.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    title: "Achievements",
    desc: "Unlock milestones as you write and focus. Earn sunshine, gems, and XP to level up.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
    title: "Seed Shop",
    desc: "Spend sunshine on rare seeds. Grow 30+ unique species — from common Tangerines to mythic Abyssal trees.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    title: "Beautiful Writing",
    desc: "Clean, distraction-free editor with rich formatting, drawing tools, and AI assistance.",
  },
]

export default function PulpLanding() {
  const [platform, setPlatform] = useState<"mac" | "windows" | "linux" | null>(null)

  useEffect(() => {
    const ua = navigator.userAgent
    if (ua.indexOf("Mac") > -1) setPlatform("mac")
    else if (ua.indexOf("Windows") > -1) setPlatform("windows")
    else if (ua.indexOf("Linux") > -1) setPlatform("linux")
  }, [])

  const accent = '#ea580c'

  return (
    <div className="min-h-screen text-white" style={{ background: '#0a0a0c' }}>
      {/* Subtle background glow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(234,88,12,0.06) 0%, transparent 70%)`,
      }} />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between max-w-5xl mx-auto px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="text-[20px] font-bold tracking-tight" style={{ color: accent, fontFamily: '"EB Garamond", Georgia, serif' }}>
            Pulp
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-[13px] text-zinc-500 hover:text-zinc-300 transition-colors" style={{ fontFamily: '"EB Garamond", Georgia, serif' }}>Features</a>
          <a href="/login" className="text-[13px] text-zinc-500 hover:text-zinc-300 transition-colors" style={{ fontFamily: '"EB Garamond", Georgia, serif' }}>Log in</a>
          <a
            href="/login"
            className="text-[13px] font-medium px-4 py-1.5 rounded-lg transition-all hover:brightness-110"
            style={{ background: accent, color: '#fff', fontFamily: '"EB Garamond", Georgia, serif' }}
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <h1
            className="text-6xl md:text-7xl font-bold mb-6 tracking-tight"
            style={{ fontFamily: '"EB Garamond", Georgia, serif', color: '#e8e4de' }}
          >
            Write. Focus. Grow.
          </h1>
          <p
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: '#8a8680', fontFamily: '"EB Garamond", Georgia, serif' }}
          >
            A notebook app that turns your writing sessions into a living forest.
            Stay focused, collect rare trees, and watch your orchard bloom.
          </p>

          <div className="flex items-center justify-center gap-4">
            <a
              href="/login"
              className="px-8 py-3 rounded-lg text-[15px] font-semibold transition-all hover:brightness-110 hover:shadow-lg"
              style={{
                background: accent,
                color: '#fff',
                fontFamily: '"EB Garamond", Georgia, serif',
                boxShadow: `0 8px 30px -8px rgba(234,88,12,0.4)`,
              }}
            >
              Start Writing — Free
            </a>
          </div>

          <p className="mt-4 text-[12px]" style={{ color: '#4a4840' }}>
            No credit card required
          </p>
        </motion.div>

        {/* App preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-20 relative"
        >
          <div
            className="w-full rounded-2xl overflow-hidden"
            style={{
              background: '#111114',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 40px 100px -30px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)',
              aspectRatio: '16/9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div className="flex flex-col items-center gap-3">
              <span className="text-[40px]">🍊</span>
              <span className="text-[13px] font-medium" style={{ color: '#4a4840', fontFamily: '"EB Garamond", Georgia, serif' }}>
                App screenshot coming soon
              </span>
            </div>
          </div>
          {/* Glow under preview */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 blur-3xl" style={{ background: `rgba(234,88,12,0.08)` }} />
        </motion.div>
      </div>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: '"EB Garamond", Georgia, serif', color: '#e8e4de' }}>
            Everything you need to write
          </h2>
          <p className="text-[15px]" style={{ color: '#6a665e', fontFamily: '"EB Garamond", Georgia, serif' }}>
            A notebook, a timer, and a garden — woven together.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="p-6 rounded-xl transition-colors"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div className="mb-4" style={{ color: accent }}>
                {f.icon}
              </div>
              <h3 className="text-[14px] font-semibold mb-2" style={{ color: '#d4d0c8', fontFamily: '"EB Garamond", Georgia, serif' }}>
                {f.title}
              </h3>
              <p className="text-[13px] leading-relaxed" style={{ color: '#6a665e', fontFamily: '"EB Garamond", Georgia, serif' }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tree showcase strip */}
      <section className="relative z-10 py-20 overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: '"EB Garamond", Georgia, serif', color: '#e8e4de' }}>
            30+ unique species to collect
          </h2>
          <p className="text-[14px] mb-10" style={{ color: '#6a665e', fontFamily: '"EB Garamond", Georgia, serif' }}>
            From common Tangerines to mythic Chroma trees — each species is hand-drawn and earned through focus.
          </p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {[
              { name: 'Tangerine', color: '#ea580c', rarity: 'Common' },
              { name: 'Sentinel', color: '#064e3b', rarity: 'Uncommon' },
              { name: 'Goldleaf', color: '#facc15', rarity: 'Rare' },
              { name: 'Wisteria', color: '#c084fc', rarity: 'True Rare' },
              { name: 'Odyssey', color: '#eab308', rarity: 'Premium' },
              { name: 'Fossil', color: '#bedaf7', rarity: 'Extinct' },
              { name: 'Prism', color: '#67e8f9', rarity: 'Chroma' },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-10 h-10 rounded-full" style={{ background: t.color, opacity: 0.8, boxShadow: `0 4px 20px -4px ${t.color}40` }} />
                <span className="text-[11px] font-semibold" style={{ color: '#8a8680', fontFamily: '"EB Garamond", Georgia, serif' }}>{t.name}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#4a4840' }}>{t.rarity}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: '"EB Garamond", Georgia, serif', color: '#e8e4de' }}>
            Your forest is waiting
          </h2>
          <p className="text-[16px] mb-8 max-w-lg mx-auto" style={{ color: '#6a665e', fontFamily: '"EB Garamond", Georgia, serif' }}>
            Start writing, stay focused, and grow something beautiful.
          </p>
          <a
            href="/login"
            className="inline-block px-8 py-3 rounded-lg text-[15px] font-semibold transition-all hover:brightness-110"
            style={{
              background: accent,
              color: '#fff',
              fontFamily: '"EB Garamond", Georgia, serif',
              boxShadow: `0 8px 30px -8px rgba(234,88,12,0.4)`,
            }}
          >
            Get Started — Free
          </a>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-[13px] font-semibold" style={{ color: accent, fontFamily: '"EB Garamond", Georgia, serif' }}>Pulp</span>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="text-[12px] hover:text-zinc-300 transition-colors" style={{ color: '#4a4840' }}>Privacy</a>
            <a href="/terms" className="text-[12px] hover:text-zinc-300 transition-colors" style={{ color: '#4a4840' }}>Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
