"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { PlantIcon } from "./components/PlantIcon"

const SHOWCASE_TREES = [
  { type: 'tangerine', name: 'tangerine', rarity: 'default' },
  { type: 'ember', name: 'ember', rarity: 'uncommon' },
  { type: 'sentinel', name: 'sentinel', rarity: 'uncommon' },
  { type: 'goldleaf', name: 'goldleaf', rarity: 'rare' },
  { type: 'wisteria', name: 'wisteria', rarity: 'true rare' },
  { type: 'hanami', name: 'hanami', rarity: 'true rare' },
  { type: 'odyssey', name: 'odyssey', rarity: 'premium' },
  { type: 'fossil', name: 'fossil', rarity: 'extinct' },
  { type: 'prism', name: 'prism', rarity: 'chroma' },
  { type: 'abyss', name: 'abyss maw', rarity: 'chroma' },
]

const FEATURES = [
  { label: 'focus timer', desc: 'pomodoro sessions that grow trees as you write. stay focused, watch your orchard grow.' },
  { label: 'living orchard', desc: 'each notebook has its own orchard. complete sessions to plant trees across hand-painted terrain.' },
  { label: 'site blocker', desc: 'when the timer is running, distracting sites are blocked. no willpower required — just focus.' },
  { label: 'notebooks', desc: 'multiple types — standard, single page, flashcards, cornell, and encrypted vaults.' },
  { label: 'achievements', desc: 'unlock milestones as you write. earn sunshine, gems, and xp to level up.' },
  { label: 'seed shop', desc: 'spend sunshine on rare seeds. grow 30+ unique species from tangerines to mythic chroma trees.' },
]

const RARITY_COLOR: Record<string, string> = {
  default: '#ea580c',
  common: '#a1a1aa',
  uncommon: '#34d399',
  rare: '#60a5fa',
  'true rare': '#a78bfa',
  premium: '#ea580c',
  extinct: '#f87171',
  chroma: '#f472b6',
}

function TypewriterHeadline({ serif, onComplete }: { serif: string, onComplete?: () => void }) {
  const line1 = "not your"
  const line2 = "avg docs."
  const full = line1 + "\n" + line2
  const [charIdx, setCharIdx] = useState(0)
  const [showCursor, setShowCursor] = useState(true)
  const [pausing, setPausing] = useState(false)
  const line2Started = charIdx > line1.length

  useEffect(() => {
    if (charIdx >= full.length) {
      const t = setTimeout(() => { setShowCursor(false); onComplete?.() }, 800)
      return () => clearTimeout(t)
    }
    // Pause for 1s after finishing line1 (the \n char)
    if (charIdx === line1.length) {
      setPausing(true)
      const t = setTimeout(() => { setPausing(false); setCharIdx(i => i + 1) }, 1000)
      return () => clearTimeout(t)
    }
    if (pausing) return
    const t = setTimeout(() => setCharIdx(i => i + 1), 55)
    return () => clearTimeout(t)
  }, [charIdx, full.length, pausing])

  const typed = full.slice(0, charIdx)
  const parts = typed.split("\n")
  const showLine1 = parts[0] || ""
  const showLine2 = parts[1] || ""

  const headlineStyle = {
    fontFamily: serif, fontSize: 'clamp(3rem, 8vw, 6.5rem)', fontWeight: 400,
    lineHeight: 0.85, letterSpacing: '-0.03em', textTransform: 'lowercase' as const,
    color: '#0f0f10', margin: '0 0 0 0',
  }

  const cursorEl = showCursor ? (
    <span style={{ display: 'inline-block', width: 3, height: '0.75em', background: '#ea580c', marginLeft: 2, verticalAlign: 'baseline', animation: 'cursorBlink 0.5s step-end infinite' }} />
  ) : null

  return (
    <h1 style={headlineStyle}>
      {showLine1}
      {!line2Started && cursorEl}
      {line2Started && <br />}
      <span style={{
        color: '#6b6864',
        marginLeft: 'clamp(3rem, 8vw, 7rem)',
        display: 'inline-block',
        marginTop: 'clamp(0.6rem, 2vw, 1.4rem)',
        opacity: line2Started ? 1 : 0,
        transform: line2Started ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.5s cubic-bezier(0.2,0.8,0.2,1), transform 0.5s cubic-bezier(0.2,0.8,0.2,1)',
      }}>
        {showLine2}
        {line2Started && cursorEl}
      </span>
      <style>{`@keyframes cursorBlink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }`}</style>
    </h1>
  )
}

export default function PulpLanding() {
  const [heroDone, setHeroDone] = useState(false)
  const [visibleFeatures, setVisibleFeatures] = useState<number[]>([])
  const featuresRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-idx'))
            if (!isNaN(idx)) {
              setTimeout(() => {
                setVisibleFeatures(prev => prev.includes(idx) ? prev : [...prev, idx])
              }, idx * 100)
            }
          }
        })
      },
      { threshold: 0.1 }
    )
    const items = featuresRef.current?.querySelectorAll('[data-idx]')
    items?.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const mono = '"JetBrains Mono", ui-monospace, monospace'
  const serif = '"EB Garamond", Georgia, serif'
  const accent = '#ea580c'

  return (
    <div style={{ background: '#fff', color: '#0f0f10', minHeight: '100vh', position: 'relative' }}>
      {/* Subtle grid texture */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(15,15,16,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(15,15,16,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '38px 38px',
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)',
      }} />

      {/* Noise grain */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.04, mixBlendMode: 'multiply',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 40px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(15,15,16,0.06)',
      }}>
        <span style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, color: accent, letterSpacing: '-0.02em' }}>
          pulp
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <a href="#features" style={{ fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.08em', color: '#b0b0b0', textDecoration: 'none', textTransform: 'lowercase' }}>features</a>
          <a href="#collection" style={{ fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.08em', color: '#b0b0b0', textDecoration: 'none', textTransform: 'lowercase' }}>collection</a>
          <a href="mailto:ctvillegas@ucsd.edu" style={{ fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.08em', color: '#b0b0b0', textDecoration: 'none', textTransform: 'lowercase' }}>reach out</a>
          <a href="/login" style={{ fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.08em', color: '#6b6864', textDecoration: 'none', textTransform: 'lowercase' }}>log in</a>
          <a href="/login" style={{
            fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.08em',
            padding: '6px 16px', borderRadius: 6,
            background: accent, color: '#fff', textDecoration: 'none', textTransform: 'lowercase',
          }}>get started</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px', maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1], delay: 0.1 }}
        >
          <span style={{ fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.28em', color: accent, textTransform: 'lowercase', display: 'block', marginBottom: 40 }}>
            -- built for students, by students
          </span>

          <TypewriterHeadline serif={serif} onComplete={() => setHeroDone(true)} />

          <div style={{
            marginTop: 56,
            opacity: heroDone ? 1 : 0,
            transform: heroDone ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.8s cubic-bezier(0.2,0.8,0.2,1), transform 0.8s cubic-bezier(0.2,0.8,0.2,1)',
          }}>
            <p style={{
              fontFamily: serif, fontSize: '1.05rem', lineHeight: 1.7,
              color: '#6b6864', maxWidth: 500, textTransform: 'lowercase', margin: '0 0 16px 0',
            }}>
              a lightweight notebook app that keeps up with you in class.
              focus timer, site blocker, and an orchard that grows as you write.
            </p>

            <p style={{
              fontFamily: serif, fontSize: '0.95rem', lineHeight: 1.7,
              color: '#6b6864', textTransform: 'lowercase', margin: '0 0 40px 0',
            }}>
              because note-taking should be fast, fun, and distraction-free.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <a href="/login" style={{
                fontFamily: mono, fontSize: '0.76rem', letterSpacing: '0.06em',
                padding: '10px 28px', borderRadius: 8, textDecoration: 'none', textTransform: 'lowercase',
                background: accent, color: '#fff',
                boxShadow: '0 4px 20px -4px rgba(234,88,12,0.3)',
              }}>
                start writing — free
              </a>
              <span style={{ fontFamily: mono, fontSize: '0.65rem', color: '#bdb9b2', letterSpacing: '0.06em', textTransform: 'lowercase' }}>
                no credit card. lightweight. no bloat.
              </span>
            </div>
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', color: '#bdb9b2', fontSize: 14 }}
        >
          ↓
        </motion.div>
      </section>

      {/* Why not docs */}
      <section style={{ borderTop: '1px solid rgba(15,15,16,0.08)', padding: '80px 40px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60 }}>
          <div>
            <span style={{ fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.28em', color: accent, textTransform: 'lowercase', display: 'block', marginBottom: 16 }}>
              -- why pulp
            </span>
            <h2 style={{ fontFamily: serif, fontSize: '1.8rem', fontWeight: 400, color: '#0f0f10', textTransform: 'lowercase', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
              docs wasn't built for this.
            </h2>
            <p style={{ fontFamily: serif, fontSize: '0.95rem', lineHeight: 1.7, color: '#6b6864', textTransform: 'lowercase', margin: 0 }}>
              google docs is a word processor pretending to be a notebook. it's slow, cluttered, and built for collaboration — not for you sitting in lecture trying to keep up.
              pulp is different. it loads instantly, stays out of your way, and rewards you for staying focused. no toolbar maze, no 2-second load times, no distractions.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center' }}>
            {[
              { left: 'google docs', right: 'pulp', items: [
                ['slow startup', 'instant load'],
                ['no focus tools', 'built-in timer + blocker'],
                ['just text', 'gamified — trees, xp, achievements'],
                ['bloated toolbar', 'clean, minimal editor'],
                ['generic', 'built for students'],
              ]}
            ].map(section => (
              <div key="compare" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: mono, fontSize: '0.6rem', letterSpacing: '0.15em', color: '#bdb9b2', textTransform: 'lowercase' }}>others</span>
                  <span style={{ fontFamily: mono, fontSize: '0.6rem', letterSpacing: '0.15em', color: accent, textTransform: 'lowercase' }}>pulp</span>
                </div>
                {section.items.map(([l, r], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid rgba(15,15,16,0.05)' }}>
                    <span style={{ fontFamily: serif, fontSize: '0.85rem', color: '#bdb9b2', textTransform: 'lowercase', textDecoration: 'line-through', textDecorationColor: 'rgba(15,15,16,0.15)' }}>{l}</span>
                    <span style={{ fontFamily: serif, fontSize: '0.85rem', color: '#0f0f10', textTransform: 'lowercase', fontWeight: 500 }}>{r}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" ref={featuresRef} style={{ maxWidth: 900, margin: '0 auto', padding: '80px 40px 100px', position: 'relative', zIndex: 1 }}>
        <span style={{ fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.28em', color: accent, textTransform: 'lowercase', display: 'block', marginBottom: 48 }}>
          -- features
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px 60px' }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              data-idx={i}
              style={{
                opacity: visibleFeatures.includes(i) ? 1 : 0,
                transform: visibleFeatures.includes(i) ? 'translateY(0)' : 'translateY(24px)',
                transition: 'opacity 0.6s cubic-bezier(0.2,0.8,0.2,1), transform 0.6s cubic-bezier(0.2,0.8,0.2,1)',
              }}
            >
              <h3 style={{ fontFamily: serif, fontSize: '1.1rem', fontWeight: 600, color: '#0f0f10', textTransform: 'lowercase', margin: '0 0 8px 0' }}>
                {f.label}
              </h3>
              <p style={{ fontFamily: serif, fontSize: '0.92rem', lineHeight: 1.65, color: '#6b6864', textTransform: 'lowercase', margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tree collection */}
      <section id="collection" style={{ borderTop: '1px solid rgba(15,15,16,0.08)', borderBottom: '1px solid rgba(15,15,16,0.08)', padding: '80px 40px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <span style={{ fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.28em', color: accent, textTransform: 'lowercase', display: 'block', marginBottom: 12 }}>
            -- collection
          </span>
          <h2 style={{ fontFamily: serif, fontSize: '1.8rem', fontWeight: 400, color: '#0f0f10', textTransform: 'lowercase', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            30+ species to collect
          </h2>
          <p style={{ fontFamily: serif, fontSize: '0.92rem', color: '#6b6864', textTransform: 'lowercase', margin: '0 0 48px 0' }}>
            each hand-drawn and earned through focus.
          </p>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 32, flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 8 }}>
            {SHOWCASE_TREES.map((t, i) => (
              <motion.div
                key={t.type}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}
              >
                <PlantIcon type={t.type} size={56} stage={3} hideGround />
                <span style={{ fontFamily: serif, fontSize: '0.78rem', color: '#0f0f10', textTransform: 'lowercase' }}>{t.name}</span>
                <span style={{ fontFamily: mono, fontSize: '0.55rem', letterSpacing: '0.12em', color: RARITY_COLOR[t.rarity] || '#a1a1aa', textTransform: 'lowercase' }}>{t.rarity}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '100px 40px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <h2 style={{ fontFamily: serif, fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 400, color: '#0f0f10', textTransform: 'lowercase', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
            your orchard is waiting.
          </h2>
          <p style={{ fontFamily: serif, fontSize: '1rem', color: '#6b6864', textTransform: 'lowercase', margin: '0 0 32px 0' }}>
            start writing, stay focused, and grow something beautiful.
          </p>
          <a href="/login" style={{
            fontFamily: mono, fontSize: '0.76rem', letterSpacing: '0.06em',
            padding: '10px 28px', borderRadius: 8, textDecoration: 'none', textTransform: 'lowercase',
            background: accent, color: '#fff', display: 'inline-block',
            boxShadow: '0 4px 20px -4px rgba(234,88,12,0.3)',
          }}>
            get started — free
          </a>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(15,15,16,0.08)',
        padding: '24px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: 900, margin: '0 auto',
        position: 'relative', zIndex: 1,
      }}>
        <span style={{ fontFamily: serif, fontSize: 14, fontWeight: 600, color: accent }}>pulp</span>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="/privacy" style={{ fontFamily: mono, fontSize: '0.65rem', color: '#bdb9b2', textDecoration: 'none', textTransform: 'lowercase', letterSpacing: '0.06em' }}>privacy</a>
          <a href="/terms" style={{ fontFamily: mono, fontSize: '0.65rem', color: '#bdb9b2', textDecoration: 'none', textTransform: 'lowercase', letterSpacing: '0.06em' }}>terms</a>
        </div>
      </footer>
    </div>
  )
}
