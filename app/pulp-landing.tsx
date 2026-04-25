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
  { type: 'manuscript', name: 'manuscript birch', rarity: 'uncommon' },
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
  const text = "not your avg docs."
  const [charIdx, setCharIdx] = useState(0)
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    if (charIdx >= text.length) {
      const t = setTimeout(() => { setShowCursor(false); onComplete?.() }, 800)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setCharIdx(i => i + 1), 55)
    return () => clearTimeout(t)
  }, [charIdx, text.length])

  const cursorEl = showCursor ? (
    <span style={{ display: 'inline-block', width: 3, height: '0.75em', background: '#ea580c', marginLeft: 2, verticalAlign: 'baseline', animation: 'cursorBlink 0.5s step-end infinite' }} />
  ) : null

  return (
    <h1 style={{
      fontFamily: serif, fontSize: 'clamp(2.4rem, 6vw, 5rem)', fontWeight: 400,
      lineHeight: 1, letterSpacing: '-0.03em', textTransform: 'lowercase' as const,
      color: '#0f0f10', margin: '0 0 0 0', whiteSpace: 'nowrap',
    }}>
      {text.slice(0, charIdx)}
      {cursorEl}
      <style>{`@keyframes cursorBlink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }`}</style>
    </h1>
  )
}

const DEMO_TREES = ['tangerine', 'manuscript', 'abyss'] as const

function DemoTimer({ serif, mono }: { serif: string, mono: string }) {
  const total = 10
  const [elapsed, setElapsed] = useState(0)
  const [started, setStarted] = useState(false)
  const [treeIdx, setTreeIdx] = useState(0)
  const [showFruit, setShowFruit] = useState(false)
  const treeType = DEMO_TREES[treeIdx % DEMO_TREES.length]

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 2500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!started) return
    if (elapsed >= total) {
      if (treeType === 'tangerine') {
        setShowFruit(true)
        const t = setTimeout(() => {
          setShowFruit(false)
          setTreeIdx(i => i + 1)
          setElapsed(0)
        }, 2000)
        return () => clearTimeout(t)
      }
      const t = setTimeout(() => {
        setTreeIdx(i => i + 1)
        setElapsed(0)
      }, 2000)
      return () => clearTimeout(t)
    }
    const t = setInterval(() => setElapsed(e => Math.min(e + 1, total)), 1000)
    return () => clearInterval(t)
  }, [started, elapsed])

  const progress = elapsed / total
  const fakeTotal = 25 * 60
  const fakeRemaining = Math.round(fakeTotal * (1 - progress))
  const mins = Math.floor(fakeRemaining / 60)
  const secs = fakeRemaining % 60

  const stage = !started ? -1 : progress < 0.1 ? 0 : progress < 0.3 ? 1 : progress < 0.6 ? 2 : progress < 0.85 ? 3 : 4
  const plantSize = !started ? 100 : stage === 0 ? 50 : 70 + stage * 12

  const mainColor = "#EA8C55"
  const textColor = "#e4e4e7"
  const dimColor = "#a1a1aa"
  const subtleColor = "#71717a"
  const borderColor = "rgba(255,255,255,0.04)"
  const done = elapsed >= total

  const boxW = 250
  const boxH = 480
  const perim = 2 * (boxW + boxH)
  const dashOffset = perim - perim * progress

  return (
    <div style={{
      width: boxW, position: 'relative',
      fontFamily: serif,
      userSelect: 'none',
    }}>
      {/* Border trace SVG */}
      <svg
        style={{ position: 'absolute', inset: -1, width: boxW + 2, height: boxH + 2, pointerEvents: 'none', zIndex: 1 }}
        viewBox={`-1 -1 ${boxW + 2} ${boxH + 2}`}
      >
        <rect x="0" y="0" width={boxW} height={boxH} rx="4" ry="4"
          fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
        <rect x="0" y="0" width={boxW} height={boxH} rx="4" ry="4"
          fill="none" stroke={mainColor} strokeWidth="2"
          strokeDasharray={perim} strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1s linear' }} />
      </svg>

      <div style={{
        background: 'rgba(0,0,0,0.02)', borderRadius: 4, overflow: 'hidden',
        height: boxH,
      }}>
        {/* Body */}
        <div style={{ padding: '36px 16px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
          {/* Time */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              fontFamily: serif, fontWeight: 500, fontSize: 44, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              <span style={{ color: started ? mainColor : textColor }}>{String(mins).padStart(2, '0')}</span>
              <span style={{ color: '#a1a1aa' }}>:{String(secs).padStart(2, '0')}</span>
            </div>
            <p style={{
              fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', marginTop: 8,
              color: done ? '#22c55e' : subtleColor,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>
              {done ? 'complete' : started ? 'in session' : 'ready'}
            </p>
          </div>

          {/* Tree scene */}
          <div style={{ position: 'relative', width: '100%', flex: 1 }}>
            {/* Hill */}
            <div style={{ position: 'absolute', bottom: 4, left: 0, width: '100%', zIndex: 0 }}>
              <svg width="100%" viewBox="0 0 200 40" preserveAspectRatio="none" style={{ height: 40 }}>
                <defs>
                  <linearGradient id="dh-hill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2a3a22" />
                    <stop offset="100%" stopColor="#1a2416" />
                  </linearGradient>
                  <linearGradient id="dh-moss" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3a4a30" />
                    <stop offset="100%" stopColor="#2a3620" />
                  </linearGradient>
                </defs>
                <ellipse cx="100" cy="22" rx="95" ry="18" fill="url(#dh-hill)" />
                <ellipse cx="80" cy="20" rx="50" ry="10" fill="url(#dh-moss)" opacity="0.6" />
                <ellipse cx="130" cy="21" rx="35" ry="8" fill="url(#dh-moss)" opacity="0.4" />
                {[25, 55, 80, 110, 140, 165].map((x, i) => (
                  <g key={i} opacity={0.3}>
                    <path d={`M${x},${14 + (i % 2) * 3} q${-1.5},${-3} ${-0.5},${-4.5} M${x},${14 + (i % 2) * 3} q${1},${-2.5} ${2},${-4}`} stroke="#5a7a48" strokeWidth="0.8" fill="none" />
                  </g>
                ))}
              </svg>
            </div>

            {/* Plant */}
            <div style={{
              position: 'absolute', left: '50%', transform: 'translateX(-50%)',
              bottom: stage === 0 ? 18 : 30, zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              {!started ? (
                <PlantIcon type={treeType} size={plantSize} stage={4} />
              ) : stage === 0 ? (
                <PlantIcon type={treeType} size={plantSize} isSeed />
              ) : (
                <PlantIcon type={treeType} size={plantSize} stage={stage - 1} />
              )}
            {/* Falling orange — matches the fruit at SVG (35,28) in the mature tangerine */}
            {showFruit && (
              <div style={{
                position: 'absolute', zIndex: 20,
                left: '50%', bottom: 30,
                width: plantSize, height: Math.round(plantSize * 1.3),
                marginLeft: -plantSize / 2,
                pointerEvents: 'none',
              }}>
                <svg width="100%" height="100%" viewBox="0 6 48 42" preserveAspectRatio="xMidYMax meet" style={{ overflow: 'visible' }}>
                  <g>
                    <circle cx="35" cy="28" r="1.1" fill="#ea580c" />
                    <animateTransform attributeName="transform" type="translate" values="0,0; 2,22" dur="1s" fill="freeze" calcMode="spline" keySplines="0.4 0 1 1" />
                    <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.75;1" dur="1s" fill="freeze" />
                  </g>
                </svg>
              </div>
            )}
            </div>
          </div>

          <span style={{
            fontFamily: 'Inter, system-ui, sans-serif', fontSize: 9, fontWeight: 500,
            textTransform: 'uppercase', letterSpacing: '0.15em',
            marginTop: 16, cursor: 'default',
            color: done ? '#22c55e' : 'transparent',
            backgroundImage: done ? 'none' : 'linear-gradient(90deg, #bdb9b2 0%, #bdb9b2 40%, #fff 50%, #bdb9b2 60%, #bdb9b2 100%)',
            backgroundSize: '200% 100%',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            animation: done ? 'none' : 'shimmer 2s ease-in-out infinite',
          }}>
            {done ? 'complete' : 'in progress'}
            <style>{`@keyframes shimmer { 0% { background-position: 100% 0 } 100% { background-position: -100% 0 } }`}</style>
          </span>
        </div>
      </div>
    </div>
  )
}

const MODAL_CONFIG: Record<string, { subtitle: string, hasSubject: boolean, subjectPlaceholder: string, bodyPlaceholder: string, bodyLabel: string }> = {
  'report a bug': { subtitle: 'help me squash it.', hasSubject: true, subjectPlaceholder: "what's broken?", bodyPlaceholder: 'steps to reproduce, what you expected, etc.', bodyLabel: 'details (optional)' },
  'request a feature': { subtitle: "i want to hear it. i'll let you know if i add it.", hasSubject: true, subjectPlaceholder: "what's the feature?", bodyPlaceholder: 'why would this be useful? any details help.', bodyLabel: 'description (optional)' },
  'feedback': { subtitle: 'i read everything.', hasSubject: false, subjectPlaceholder: '', bodyPlaceholder: "whats up?", bodyLabel: '' },
}

function ReachOutModal({ type, onClose }: { type: string, onClose: () => void }) {
  const [subject, setSubject] = useState('')
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const mono = '"JetBrains Mono", ui-monospace, monospace'
  const serif = '"EB Garamond", Georgia, serif'
  const accent = '#ea580c'
  const config = MODAL_CONFIG[type] || MODAL_CONFIG['feedback']
  const canSend = config.hasSubject ? subject.trim().length > 0 : text.trim().length > 0

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 420, borderRadius: 12, background: '#fff',
          border: '1px solid rgba(15,15,16,0.08)',
          boxShadow: '0 20px 60px -12px rgba(0,0,0,0.2)',
          padding: 32,
          animation: 'modalIn 0.25s ease',
        }}
      >
        <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }`}</style>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontFamily: serif, fontSize: '1.3rem', color: '#0f0f10', textTransform: 'lowercase', margin: '0 0 8px 0' }}>
              thank you for your support.
            </p>
            <p style={{ fontFamily: serif, fontSize: '0.9rem', color: '#6b6864', textTransform: 'lowercase', margin: '0 0 24px 0' }}>
              we'll get back to you as soon as we can.
            </p>
            <a
              onClick={onClose}
              style={{
                fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.06em',
                padding: '8px 20px', borderRadius: 6, cursor: 'pointer',
                background: accent, color: '#fff', textDecoration: 'none', textTransform: 'lowercase',
              }}
            >close</a>
          </div>
        ) : (
          <>
            <h3 style={{ fontFamily: serif, fontSize: '1.2rem', fontWeight: 500, color: '#0f0f10', textTransform: 'lowercase', margin: '0 0 4px 0' }}>
              {type}
            </h3>
            <p style={{ fontFamily: serif, fontSize: '0.85rem', color: '#a1a1aa', textTransform: 'lowercase', margin: '0 0 20px 0' }}>
              {config.subtitle}
            </p>
            {config.hasSubject && (
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder={config.subjectPlaceholder}
                autoFocus
                style={{
                  width: '100%', borderRadius: 8, border: '1px solid rgba(15,15,16,0.1)',
                  padding: 14, fontFamily: serif, fontSize: '0.92rem', color: '#0f0f10',
                  outline: 'none', background: 'rgba(0,0,0,0.02)', marginBottom: 12,
                  boxSizing: 'border-box',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = accent)}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(15,15,16,0.1)')}
              />
            )}
            {config.hasSubject && (
              <p style={{ fontFamily: mono, fontSize: '0.65rem', color: '#a1a1aa', textTransform: 'lowercase', margin: '0 0 6px 0', letterSpacing: '0.06em' }}>
                {config.bodyLabel}
              </p>
            )}
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={config.bodyPlaceholder}
              autoFocus={!config.hasSubject}
              style={{
                width: '100%', height: config.hasSubject ? 100 : 140, borderRadius: 8, border: '1px solid rgba(15,15,16,0.1)',
                padding: 14, fontFamily: serif, fontSize: '0.92rem', color: '#0f0f10',
                resize: 'vertical', outline: 'none',
                background: 'rgba(0,0,0,0.02)', boxSizing: 'border-box',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = accent)}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(15,15,16,0.1)')}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
              <a
                onClick={onClose}
                style={{
                  fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.06em',
                  padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
                  color: '#6b6864', textDecoration: 'none', textTransform: 'lowercase',
                }}
              >cancel</a>
              <a
                onClick={() => {
                  if (!canSend) return
                  const emailSubject = encodeURIComponent(config.hasSubject ? `${type}: ${subject} — Pulp` : `${type} — Pulp`)
                  const body = encodeURIComponent(config.hasSubject && text.trim() ? `${subject}\n\n${text}` : text || subject)
                  window.open(`mailto:pulpsupport@gmail.com?subject=${emailSubject}&body=${body}`, '_self')
                  setSent(true)
                }}
                style={{
                  fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.06em',
                  padding: '8px 20px', borderRadius: 6, cursor: 'pointer',
                  background: canSend ? accent : '#e5e5e5',
                  color: canSend ? '#fff' : '#a1a1aa',
                  textDecoration: 'none', textTransform: 'lowercase',
                  transition: 'background 0.2s, color 0.2s',
                }}
              >send</a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function PulpLanding() {
  const [heroDone, setHeroDone] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [reachOutOpen, setReachOutOpen] = useState(false)
  const [modalType, setModalType] = useState<string | null>(null)

  useEffect(() => {
    if (!reachOutOpen) return
    const close = () => setReachOutOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [reachOutOpen])
  const [visibleFeatures, setVisibleFeatures] = useState<number[]>([])
  const featuresRef = useRef<HTMLDivElement>(null)
  const slide2Ref = useRef<HTMLDivElement>(null)
  const transitionLock = useRef(false)

  const goToSlide = (slide: number) => {
    transitionLock.current = true
    setActiveSlide(slide)
    setTimeout(() => { transitionLock.current = false }, 600)
  }

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (transitionLock.current) return

      if (e.deltaY > 20 && activeSlide === 0) {
        e.preventDefault()
        goToSlide(1)
      } else if (e.deltaY < -80 && activeSlide === 1) {
        const el = slide2Ref.current
        const atTop = !el || el.scrollTop < 2
        if (atTop) {
          e.preventDefault()
          goToSlide(0)
        }
      }
    }

    let touchStartY = 0
    const handleTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY }
    const handleTouchEnd = (e: TouchEvent) => {
      if (transitionLock.current) return
      const dy = touchStartY - e.changedTouches[0].clientY
      if (dy > 50 && activeSlide === 0) {
        goToSlide(1)
      } else if (dy < -120 && activeSlide === 1) {
        const el = slide2Ref.current
        const atTop = !el || el.scrollTop < 2
        if (atTop) goToSlide(0)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (transitionLock.current) return
      if (e.key === 'ArrowDown' && activeSlide === 0) {
        e.preventDefault()
        goToSlide(1)
      } else if (e.key === 'ArrowUp' && activeSlide === 1) {
        const el = slide2Ref.current
        const atTop = !el || el.scrollTop < 2
        if (atTop) {
          e.preventDefault()
          goToSlide(0)
        }
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeSlide])

  useEffect(() => {
    if (activeSlide !== 1) return
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
      { threshold: 0.1, root: slide2Ref.current }
    )
    const items = featuresRef.current?.querySelectorAll('[data-idx]')
    items?.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [activeSlide])

  const mono = '"JetBrains Mono", ui-monospace, monospace'
  const serif = '"EB Garamond", Georgia, serif'
  const accent = '#ea580c'

  const slideBase: React.CSSProperties = {
    position: 'absolute', inset: 0,
    transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
  }

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden', background: '#fff', color: '#0f0f10' }}>
      {/* Subtle grid texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
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
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.04, mixBlendMode: 'multiply',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      {/* Nav */}
      <nav style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center',
        padding: '20px 40px',
        background: activeSlide === 1 ? 'rgba(255,255,255,0.85)' : 'transparent',
        backdropFilter: activeSlide === 1 ? 'blur(12px)' : 'none',
        borderBottom: activeSlide === 1 ? '1px solid rgba(15,15,16,0.06)' : '1px solid transparent',
        transition: 'background 0.5s ease, backdrop-filter 0.5s ease, border-bottom 0.5s ease',
      }}>
        <span
          onClick={() => { setActiveSlide(0); if (slide2Ref.current) slide2Ref.current.scrollTop = 0 }}
          style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, color: accent, letterSpacing: '-0.02em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <img src="/pulp_logo.svg" alt="pulp" style={{ width: 22, height: 22 }} />
          pulp
        </span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 32, marginLeft: 48,
          opacity: activeSlide === 1 ? 1 : 0,
          transform: activeSlide === 1 ? 'translateX(0)' : 'translateX(-12px)',
          transition: 'opacity 0.4s ease 0.15s, transform 0.4s ease 0.15s',
          pointerEvents: activeSlide === 1 ? 'auto' : 'none',
        }}>
          <div style={{ position: 'relative' }}>
            <a
              onClick={(e) => { e.stopPropagation(); setReachOutOpen(o => !o) }}
              style={{ fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.08em', color: '#b0b0b0', textDecoration: 'none', textTransform: 'lowercase', cursor: 'pointer', userSelect: 'none' }}
            >reach out</a>
            <div style={{
              position: 'absolute', top: '100%', left: '50%',
              marginTop: 10, minWidth: 160, borderRadius: 8,
              background: '#fff', border: '1px solid rgba(15,15,16,0.08)',
              boxShadow: '0 8px 30px -8px rgba(0,0,0,0.12)',
              padding: '6px 0',
              opacity: reachOutOpen ? 1 : 0,
              pointerEvents: reachOutOpen ? 'auto' : 'none',
              transform: reachOutOpen ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-6px)',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
            }}>
              {[
                { label: 'contact me!', action: 'contact' },
                { label: 'report a bug', action: 'bug' },
                { label: 'request a feature', action: 'feature' },
                { label: 'feedback', action: 'feedback' },
              ].map(item => (
                <a
                  key={item.label}
                  onClick={() => {
                    setReachOutOpen(false)
                    if (item.action === 'contact') {
                      window.open('https://www.cesarvillegas.me', '_blank')
                    } else {
                      setModalType(item.label)
                    }
                  }}
                  style={{
                    display: 'block', padding: '8px 16px',
                    fontFamily: mono, fontSize: '0.68rem', letterSpacing: '0.06em',
                    color: '#6b6864', textDecoration: 'none', textTransform: 'lowercase', cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >{item.label}</a>
              ))}
            </div>
          </div>
          <a href="/login" style={{ fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.08em', color: '#6b6864', textDecoration: 'none', textTransform: 'lowercase' }}>log in</a>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <a href="/login" style={{
            fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.08em',
            padding: '6px 16px', borderRadius: 6,
            background: accent, color: '#fff', textDecoration: 'none', textTransform: 'lowercase',
            display: 'inline-block',
            opacity: activeSlide === 1 ? 1 : 0,
            transform: activeSlide === 1 ? 'scale(1)' : 'scale(0.85)',
            transition: 'opacity 0.35s ease 0.3s, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s',
            pointerEvents: activeSlide === 1 ? 'auto' : 'none',
          }}>get started</a>
        </div>
      </nav>

      {/* Slide 1 — Hero */}
      <div style={{
        ...slideBase,
        opacity: activeSlide === 0 ? 1 : 0,
        transform: activeSlide === 0 ? 'translateY(0)' : 'translateY(-100%)',
        zIndex: activeSlide === 0 ? 2 : 1,
      }}>
        <section style={{ height: '100vh', display: 'flex', alignItems: 'center', padding: '0 40px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 80, width: '100%', marginTop: '-6vh' }}>
            <div style={{ flex: 1 }}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1], delay: 0.1 }}
              >
                <span style={{ fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.28em', color: accent, textTransform: 'lowercase', display: 'block', marginBottom: 32 }}>
                  -- made for students, by a student
                </span>

                <TypewriterHeadline serif={serif} onComplete={() => setHeroDone(true)} />

                <div style={{
                  marginTop: 36,
                  opacity: heroDone ? 1 : 0,
                  transform: heroDone ? 'translateY(0)' : 'translateY(24px)',
                  transition: 'opacity 0.8s cubic-bezier(0.2,0.8,0.2,1), transform 0.8s cubic-bezier(0.2,0.8,0.2,1)',
                }}>
                  <p style={{
                    fontFamily: serif, fontSize: '1.05rem', lineHeight: 1.7,
                    color: '#6b6864', maxWidth: 460, textTransform: 'lowercase', margin: '0 0 16px 0',
                    paddingLeft: 24,
                  }}>
                    pulp is a gamified notes webapp that keeps up with you in class — because note-taking should be fast, fun, and distraction-free.
                  </p>
                  <ul style={{
                    fontFamily: serif, fontSize: '1.05rem', lineHeight: 1.9,
                    color: '#6b6864', textTransform: 'lowercase', margin: '0 0 0 0',
                    paddingLeft: 42, listStyleType: "'·  '",
                  }}>
                    <li>focus timer + site blocker</li>
                    <li>real stakes. quit a session = lose all your progress</li>
                    <li>hyperproductive shortcut setup</li>
                    <li>an orchard that grows as you write</li>
                  </ul>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 56 }}>
                    <a href="/login" style={{
                      fontFamily: mono, fontSize: '0.76rem', letterSpacing: '0.06em',
                      padding: '10px 28px', borderRadius: 8, textDecoration: 'none', textTransform: 'lowercase',
                      background: accent, color: '#fff',
                      boxShadow: '0 4px 20px -4px rgba(234,88,12,0.3)',
                    }}>
                      start writing — free
                    </a>
                    <span style={{ fontFamily: mono, fontSize: '0.65rem', color: '#bdb9b2', letterSpacing: '0.06em', textTransform: 'lowercase' }}>
                      no credit card
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            <div style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: heroDone ? 1 : 0,
              transform: heroDone ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
              transition: 'opacity 1s cubic-bezier(0.2,0.8,0.2,1) 0.2s, transform 1s cubic-bezier(0.2,0.8,0.2,1) 0.2s',
            }}>
              {heroDone && <DemoTimer serif={serif} mono={mono} />}
            </div>
          </div>

          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            onClick={() => setActiveSlide(1)}
          >
            <span style={{ fontFamily: mono, fontSize: '0.6rem', letterSpacing: '0.1em', color: '#bdb9b2', textTransform: 'lowercase' }}>scroll or use arrow key</span>
            <span style={{ color: '#bdb9b2', fontSize: 24 }}>↓</span>
          </motion.div>
        </section>
      </div>

      {/* Slide 2 — Content */}
      <div
        ref={slide2Ref}
        style={{
          ...slideBase,
          opacity: activeSlide === 1 ? 1 : 0,
          transform: activeSlide === 1 ? 'translateY(0)' : 'translateY(100%)',
          zIndex: activeSlide === 1 ? 2 : 1,
          overflowY: activeSlide === 1 ? 'auto' : 'hidden',
          background: '#fff',
        }}
      >
        <div style={{ paddingTop: 70 }}>

        <div style={{ height: '4vh' }} />
        {/* Why not docs */}
        <section style={{ borderTop: '1px solid rgba(15,15,16,0.08)', padding: '80px 40px 40px' }}>
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
        <section id="features" ref={featuresRef} style={{ padding: '48px 40px 100px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
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
          </div>
        </section>

        {/* Tree collection */}
        <section id="collection" style={{ borderTop: '1px solid rgba(15,15,16,0.08)', borderBottom: '1px solid rgba(15,15,16,0.08)', padding: '80px 40px' }}>
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

            <div style={{ overflow: 'hidden', width: '100%', maskImage: 'linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)' }}>
              <div style={{
                display: 'flex', alignItems: 'flex-end', gap: 32, width: 'max-content',
                animation: 'conveyorScroll 60s linear infinite',
                willChange: 'transform',
              }}>
                {[...SHOWCASE_TREES, ...SHOWCASE_TREES].map((t, i) => (
                  <div
                    key={`${t.type}-${i}`}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}
                  >
                    <PlantIcon type={t.type} size={56} stage={3} hideGround />
                    <span style={{ fontFamily: serif, fontSize: '0.78rem', color: '#0f0f10', textTransform: 'lowercase' }}>{t.name}</span>
                    <span style={{ fontFamily: mono, fontSize: '0.55rem', letterSpacing: '0.12em', color: RARITY_COLOR[t.rarity] || '#a1a1aa', textTransform: 'lowercase' }}>{t.rarity}</span>
                  </div>
                ))}
              </div>
              <style>{`@keyframes conveyorScroll { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }`}</style>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '100px 40px', textAlign: 'center' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, root: slide2Ref }}
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
                textDecoration: 'underline', textUnderlineOffset: 4, textTransform: 'lowercase',
                color: accent,
              }}>
                pulpnotes.com
              </a>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          borderTop: '1px solid rgba(15,15,16,0.08)',
          padding: '24px 40px',
        }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: serif, fontSize: 14, fontWeight: 600, color: accent }}>pulp</span>
            <div style={{ display: 'flex', gap: 24 }}>
              <a href="/privacy" style={{ fontFamily: mono, fontSize: '0.65rem', color: '#bdb9b2', textDecoration: 'none', textTransform: 'lowercase', letterSpacing: '0.06em' }}>privacy</a>
              <a href="/terms" style={{ fontFamily: mono, fontSize: '0.65rem', color: '#bdb9b2', textDecoration: 'none', textTransform: 'lowercase', letterSpacing: '0.06em' }}>terms</a>
            </div>
          </div>
        </footer>
        </div>
      </div>

      {modalType && <ReachOutModal type={modalType} onClose={() => setModalType(null)} />}
    </div>
  )
}
