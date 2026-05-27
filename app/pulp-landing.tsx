"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { PlantIcon } from "./components/PlantIcon"
import { LandingTerrain } from "./components/LandingTerrain"


const FEATURES = [
  { label: 'focus timer', desc: 'pomodoro sessions that grow trees as you write. stay focused, watch your orchard grow.', icon: '⏱' },
  { label: 'living orchard', desc: 'every notebook grows its own orchard — harvest sap and cut trees for paper.', icon: '🌳' },
  { label: 'site blocker', desc: 'when the timer is running, distracting sites are blocked. no willpower required — just focus.', icon: '🚫' },
  { label: 'notebooks', desc: 'multiple types — standard, single page, cornell, and encrypted vaults.', icon: '📓' },
  { label: 'achievements', desc: 'unlock milestones as you write. earn sap, gems, and xp to level up.', icon: '🏆' },
  { label: 'seed shop', desc: 'spend sap on seeds. grow fruit trees, lumber trees, and rare gem-producing trees.', icon: '🌱' },
]

function AnimatedCounter({ target, suffix = '', delay = 0 }: { target: number, suffix?: string, delay?: number }) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setStarted(true); obs.disconnect() }
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const t = setTimeout(() => {
      const duration = 1500
      const steps = 30
      const inc = target / steps
      let current = 0
      const interval = setInterval(() => {
        current += inc
        if (current >= target) { setCount(target); clearInterval(interval) }
        else setCount(Math.floor(current))
      }, duration / steps)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(t)
  }, [started, target, delay])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}


function TypewriterHeadline({ serif, onComplete, settled }: { serif: string, onComplete?: () => void, settled: boolean }) {
  const line1 = "notes don't need"
  const line2 = "to be boring."
  const text = line1 + '\n' + line2
  const [charIdx, setCharIdx] = useState(0)
  const [showCursor, setShowCursor] = useState(true)
  const [typingDone, setTypingDone] = useState(false)

  useEffect(() => {
    if (charIdx >= text.length) {
      const t = setTimeout(() => { setShowCursor(false); setTypingDone(true); onComplete?.() }, 800)
      return () => clearTimeout(t)
    }
    const ch = text[charIdx]
    const prev = charIdx > 0 ? text[charIdx - 1] : ''
    let delay = 40 + Math.random() * 30
    if (ch === '\n') delay = 350
    else if (ch === ' ') delay = 70 + Math.random() * 40
    else if (prev === ' ' || prev === '\n' || charIdx === 0) delay = 80 + Math.random() * 30
    else if ("'.,".includes(ch)) delay = 90 + Math.random() * 30
    const t = setTimeout(() => setCharIdx(i => i + 1), delay)
    return () => clearTimeout(t)
  }, [charIdx, text.length])

  const cursorEl = showCursor ? (
    <span style={{ display: 'inline-block', width: 3, height: '0.75em', background: '#d97706', marginLeft: 2, verticalAlign: 'baseline', animation: 'cursorBlink 0.5s step-end infinite' }} />
  ) : null

  const displayed = text.slice(0, charIdx)
  const parts = displayed.split('\n')

  const settledScale = 0.7
  return (
    <h1 style={{
      fontFamily: serif, fontWeight: 400,
      lineHeight: 1.1, letterSpacing: '-0.03em', textTransform: 'lowercase' as const,
      color: '#0f0f10', margin: '0 0 0 0',
      fontSize: 'clamp(3rem, 7vw, 5.5rem)',
      textAlign: 'left',
      whiteSpace: 'nowrap',
      transform: settled ? `scale(${settledScale})` : 'scale(1)',
      transformOrigin: settled ? 'top left' : 'center center',
      transition: typingDone ? 'transform 0.9s cubic-bezier(0.2,0.8,0.2,1), transform-origin 0.9s cubic-bezier(0.2,0.8,0.2,1)' : 'none',
      willChange: 'transform',
    }}>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {p}
        </span>
      ))}
      {cursorEl}
      <style>{`@keyframes cursorBlink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }`}</style>
    </h1>
  )
}

const DEMO_TREES = [
  'tangerine', 'lemon', 'plum', 'pineapple', 'passionfruit', 'pomegranate', 'coconut',
  'sunflower', 'grape', 'pear', 'melon', 'mushroom', 'cactus', 'sage', 'lychee', 'papaya',
  'coral', 'bloom', 'lotus', 'birch', 'pine', 'ivy', 'oak', 'sakura', 'cattail', 'cypress',
  'bamboo', 'mangrove', 'bonsai', 'juniper', 'cedarwood', 'baobab', 'winterveil', 'agave',
  'abyss', 'starweaver', 'leviathan', 'prismatic',
] as const

function DemoTimer({ serif }: { serif: string }) {
  const [started, setStarted] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [sapReward, setSapReward] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const [showCta, setShowCta] = useState(false)
  const total = 10 * 60
  const treeChangeInterval = 3
  const mono = '"JetBrains Mono", ui-monospace, monospace'

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 1200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!started || paused) return
    const iv = setInterval(() => {
      setElapsed(e => {
        if (e >= total) {
          setSapReward(Math.floor(Math.random() * 40) + 10)
          setPaused(true)
          setTimeout(() => setShowCta(true), 1500)
          setTimeout(() => {
            setSapReward(null)
            setShowCta(false)
            setPaused(false)
            return
          }, 5000)
          return 0
        }
        return e + 1
      })
    }, 100)
    return () => clearInterval(iv)
  }, [started, paused, total])

  const progress = elapsed / total
  const remaining = total - elapsed
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  const treeIdx = Math.floor(elapsed / treeChangeInterval) % DEMO_TREES.length
  const shuffleType = DEMO_TREES[treeIdx]
  const stage = !started ? -1 : progress < 0.08 ? 0 : progress < 0.25 ? 1 : progress < 0.5 ? 2 : progress < 0.8 ? 3 : 4
  const plantSize = !started ? 100 : stage === 0 ? 50 : 70 + stage * 12
  const done = elapsed >= total

  const mainColor = "#d97706"
  const subtleColor = "#71717a"

  const boxW = 220
  const boxH = 420
  const perim = 2 * (boxW + boxH)
  const dashOffset = perim - perim * progress

  return (
    <div style={{
      width: boxW, position: 'relative',
      fontFamily: serif,
      userSelect: 'none',
    }}>
      <svg
        style={{ position: 'absolute', inset: -1, width: boxW + 2, height: boxH + 2, pointerEvents: 'none', zIndex: 1 }}
        viewBox={`-1 -1 ${boxW + 2} ${boxH + 2}`}
      >
        <rect x="0" y="0" width={boxW} height={boxH} rx="4" ry="4"
          fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
        <rect x="0" y="0" width={boxW} height={boxH} rx="4" ry="4"
          fill="none" stroke={mainColor} strokeWidth="2"
          strokeDasharray={perim} strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.3s linear' }} />
      </svg>

      <div style={{
        background: 'rgba(0,0,0,0.02)', borderRadius: 4, overflow: 'hidden',
        height: boxH,
      }}>
        <div style={{ padding: '36px 16px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              fontFamily: serif, fontWeight: 500, fontSize: 44, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              <span style={{ color: started ? mainColor : '#bdb9b2' }}>{String(mins).padStart(2, '0')}</span>
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

          <div style={{ position: 'relative', width: '100%', flex: 1 }}>
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

            <div style={{
              position: 'absolute', left: '50%', transform: 'translateX(-50%)',
              bottom: stage === 0 ? 18 : 30, zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              {!started ? (
                <PlantIcon type={shuffleType} size={plantSize} stage={4} />
              ) : stage === 0 ? (
                <PlantIcon type={shuffleType} size={plantSize} isSeed />
              ) : (
                <PlantIcon type={shuffleType} size={plantSize} stage={Math.min(stage - 1, 3)} />
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
            {done ? 'complete' : ' '}
            <style>{`@keyframes shimmer { 0% { background-position: 100% 0 } 100% { background-position: -100% 0 } }
              @keyframes sapPop { 0% { opacity: 0; transform: translateY(6px) scale(0.8) } 20% { opacity: 1; transform: translateY(0) scale(1) } 80% { opacity: 1 } 100% { opacity: 0; transform: translateY(-8px) } }`}</style>
          </span>
          {sapReward !== null && (
            <span style={{
              fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11, fontWeight: 600,
              color: '#d97706', marginTop: 8,
              animation: 'sapPop 1.8s ease forwards',
            }}>
              +{sapReward} sap
            </span>
          )}
          {showCta && (
            <a href="/login" style={{
              fontFamily: mono, fontSize: '0.68rem', letterSpacing: '0.06em',
              padding: '8px 18px', borderRadius: 6, textDecoration: 'none', textTransform: 'lowercase',
              background: '#d97706', color: '#fff', marginTop: 10,
              animation: 'sapPop 0.6s ease forwards',
              boxShadow: '0 3px 12px -3px rgba(234,88,12,0.3)',
            }}>
              start growing — free
            </a>
          )}
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
  const serif = '"Georgia", Georgia, serif'
  const accent = '#d97706'
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
            <h3 style={{ fontFamily: serif, fontSize: '1.2rem', fontWeight: 400, color: '#0f0f10', textTransform: 'lowercase', margin: '0 0 4px 0' }}>
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
  const [heroSettled, setHeroSettled] = useState(false)
  const [reachOutOpen, setReachOutOpen] = useState(false)
  const [modalType, setModalType] = useState<string | null>(null)
  const [orchardProgress, setOrchardProgress] = useState(0)
  const orchardSectionRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        setScrolled(window.scrollY > 60)
        const el = orchardSectionRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const scrollable = el.offsetHeight - window.innerHeight
        if (scrollable <= 0) return
        const raw = -rect.top / (el.offsetHeight - window.innerHeight)
        setOrchardProgress(Math.max(0, Math.min(1, raw)))
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])

  useEffect(() => {
    if (!reachOutOpen) return
    const close = () => setReachOutOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [reachOutOpen])

  const mono = '"JetBrains Mono", ui-monospace, monospace'
  const serif = '"Georgia", Georgia, serif'
  const accent = '#d97706'

  const inOrchard = orchardProgress > 0.05
  const heroTextOpacity = Math.max(0, 1 - orchardProgress * 3)

  return (
    <div style={{ background: '#E8E0D0', color: '#0f0f10' }}>
      {/* Nav — fixed */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center',
        padding: '12px 80px',
        opacity: 1,
        transform: 'translateY(0)',
        pointerEvents: 'auto',
        transition: 'opacity 0.4s, transform 0.4s, background 0.4s, border-bottom 0.4s, backdrop-filter 0.4s',
        background: inOrchard ? 'transparent' : scrolled ? 'rgba(255,255,255,0.35)' : 'transparent',
        backdropFilter: inOrchard || !scrolled ? 'none' : 'blur(16px)',
        WebkitBackdropFilter: inOrchard || !scrolled ? 'none' : 'blur(16px)',
        borderBottom: inOrchard ? '1px solid transparent' : scrolled ? '1px solid rgba(15,15,16,0.06)' : '1px solid transparent',
      }}>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          style={{ fontFamily: serif, fontSize: 18, fontWeight: 400, color: inOrchard ? 'rgba(255,255,255,0.9)' : accent, letterSpacing: '-0.02em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', transition: 'color 0.4s' }}
        >
          <img src="/pulp_logo.svg" alt="pulp" style={{ width: 22, height: 22 }} />
          <span style={{ transform: 'translateY(-2px)' }}>pulp</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginLeft: 48 }}>
          <div style={{ position: 'relative' }}>
            <a
              onClick={(e) => { e.stopPropagation(); setReachOutOpen(o => !o) }}
              style={{ fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.08em', color: inOrchard ? 'rgba(255,255,255,0.8)' : '#6b6864', textDecoration: 'none', textTransform: 'lowercase', cursor: 'pointer', userSelect: 'none', transition: 'color 0.4s' }}
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
          <a href="/login" style={{ fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.08em', color: inOrchard ? 'rgba(255,255,255,0.8)' : '#6b6864', textDecoration: 'none', textTransform: 'lowercase', transition: 'color 0.4s' }}>log in</a>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <a href="/login" style={{
            fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.08em',
            padding: '6px 16px', borderRadius: 6,
            background: accent, color: '#fff', textDecoration: 'none', textTransform: 'lowercase',
            display: 'inline-block',
          }}>get started</a>
        </div>
      </nav>

      {/* Subtle dot texture — fixed behind hero */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'url(/paper-texture.png)',
        backgroundSize: '512px 512px',
        backgroundRepeat: 'repeat',
        opacity: Math.max(0, (1 - orchardProgress * 2) * 0.5),
      }} />


      {/* ===== Hero ===== */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Dot grid background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1px)',
          backgroundSize: '2rem 2rem',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, #E8E0D0, rgba(232,224,208,0.8), #E8E0D0)',
        }} />

        <div
          style={{
            position: 'relative', width: '100%', maxWidth: 1200, margin: '0 auto',
            padding: isMobile ? '80px 24px' : '0 80px',
            minHeight: '100vh',
            display: 'flex', alignItems: 'center',
            opacity: heroTextOpacity, transform: `translateY(${orchardProgress * -40}px)`,
            transition: 'opacity 0.05s, transform 0.05s',
          }}
        >
          {/* Left: Text Content with hand-drawn line */}
          <div
            style={{
              width: heroSettled ? (isMobile ? '100%' : '46%') : '100%',
              position: 'relative',
              paddingLeft: heroSettled && !isMobile ? 36 : 0,
              textAlign: 'left' as const,
              display: 'flex', flexDirection: 'column',
              alignItems: heroSettled ? (isMobile ? 'center' : 'flex-start') : 'center',
              justifyContent: 'center',
              transition: 'width 0.9s cubic-bezier(0.2,0.8,0.2,1), padding-left 0.9s cubic-bezier(0.2,0.8,0.2,1)',
            }}
          >
            {/* Hand-drawn orange vertical line */}
            {!isMobile && (
              <div style={{
                position: 'absolute', left: -4, top: -40, bottom: -40, width: 24, pointerEvents: 'none',
                opacity: heroSettled ? 0.35 : 0,
                transition: 'opacity 0.8s cubic-bezier(0.2,0.8,0.2,1) 0.3s',
              }}>
                <svg width="24" height="100%" preserveAspectRatio="none" viewBox="0 0 24 100" style={{ width: '100%', height: '100%' }}>
                  <path d="M12,0 Q16,8 13,16 Q10,24 14,32 Q18,40 14,48 Q10,56 15,64 Q20,72 15,80 Q10,88 14,96 Q18,100 14,100" fill="none" stroke="#d97706" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
              </div>
            )}

            <TypewriterHeadline serif={serif} settled={heroSettled} onComplete={() => {
              setHeroDone(true)
              setTimeout(() => setHeroSettled(true), 600)
            }} />

            <p style={{
              fontFamily: serif, fontSize: '1.05rem', lineHeight: 1.7,
              color: '#6b6864', textTransform: 'lowercase', maxWidth: 420,
              marginTop: 24,
              opacity: heroSettled ? 1 : 0,
              transform: heroSettled ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.8s cubic-bezier(0.2,0.8,0.2,1) 0.4s, transform 0.8s cubic-bezier(0.2,0.8,0.2,1) 0.4s',
            }}>
              a cozy notes app that makes studying feel like a game. focus timer, growing orchards, 40+ species to collect.
            </p>

            <div style={{
              marginTop: 32,
              opacity: heroSettled ? 1 : 0,
              transform: heroSettled ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.8s cubic-bezier(0.2,0.8,0.2,1) 0.6s, transform 0.8s cubic-bezier(0.2,0.8,0.2,1) 0.6s',
            }}>
              <a href="/login" style={{
                fontFamily: mono, fontSize: '0.76rem', letterSpacing: '0.06em',
                padding: '12px 32px', borderRadius: 8, textDecoration: 'none', textTransform: 'lowercase',
                background: accent, color: '#fff',
                boxShadow: '0 4px 20px -4px rgba(234,88,12,0.3)',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                start growing — free
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </a>
            </div>
          </div>

          {/* Right: Conveyor belt cards */}
          {!isMobile && (() => {
            const cardW = 240
            const cardH = 220
            const timerH = 440
            const gap = 20
            const tallH = 320
            const leftCards = [
              { label: 'notebook', icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a09888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>, bg: '#d4cbb8', h: tallH, rot: -1.2, br: '18px 14px 20px 12px' },
              { label: 'orchard', icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a09888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/><path d="M8 5.2C9 4 10.5 3 12 3s3 1 4 2.2"/></svg>, bg: '#cfc5b0', h: cardH, rot: 0.8, br: '14px 18px 12px 20px' },
              { label: 'seed shop', icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a09888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></svg>, bg: '#d9d0be', h: cardH, rot: -0.7, br: '20px 12px 16px 18px' },
            ]
            const rightCards = [
              { label: 'editor', icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a09888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>, bg: '#cfc5b0', h: cardH, rot: 1, br: '20px 16px 14px 18px' },
              { label: 'focus timer', timer: true, bg: '#ccc3af', h: timerH, rot: -0.6, br: '16px 20px 18px 12px' },
              { label: 'stats', icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a09888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>, bg: '#d9d0be', h: tallH, rot: 1.3, br: '14px 18px 20px 16px' },
            ]

            const leftTotal = leftCards.reduce((s, c) => s + c.h + gap, 0)
            const rightTotal = rightCards.reduce((s, c) => s + c.h + gap, 0)

            const renderCard = (card: typeof leftCards[0] & { timer?: boolean }, idx: number) => (
              <div key={idx}
                onMouseEnter={e => { e.currentTarget.style.transform = `rotate(${card.rot}deg) scale(1.04)`; e.currentTarget.style.boxShadow = '0 20px 44px -10px rgba(0,0,0,0.16)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = `rotate(${card.rot}deg) scale(1)`; e.currentTarget.style.boxShadow = '0 16px 36px -10px rgba(0,0,0,0.1)' }}
                style={{
                width: cardW, height: card.h, flexShrink: 0,
                background: card.bg, borderRadius: card.br, overflow: 'hidden',
                boxShadow: '0 16px 36px -10px rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8,
                transform: `rotate(${card.rot}deg) scale(1)`,
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                marginBottom: gap,
              }}>
                {card.timer ? (
                  <DemoTimer serif={serif} />
                ) : (
                  <>
                    {card.icon}
                    <span style={{ fontFamily: mono, fontSize: '0.6rem', color: '#a09888', letterSpacing: '0.1em', textTransform: 'lowercase' }}>{card.label}</span>
                  </>
                )}
              </div>
            )

            return (
              <div style={{
                position: 'absolute', right: 0, top: 0, bottom: 0,
                width: cardW * 2 + 28,
                overflow: 'hidden',
                opacity: heroSettled ? 1 : 0,
                transition: 'opacity 1s cubic-bezier(0.2,0.8,0.2,1) 0.2s',
                maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
              }}>
                <style>{`
                  @keyframes beltDown { 0% { transform: translateY(0) } 100% { transform: translateY(-${leftTotal}px) } }
                  @keyframes beltUp { 0% { transform: translateY(-${rightTotal}px) } 100% { transform: translateY(0) } }
                `}</style>

                {/* Left belt — scrolls DOWN */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, width: cardW,
                  animation: `beltDown ${leftCards.length * 6}s linear infinite`,
                }}>
                  {leftCards.map((c, i) => renderCard(c, i))}
                  {leftCards.map((c, i) => renderCard(c, i + leftCards.length))}
                </div>

                {/* Right belt — scrolls UP */}
                <div style={{
                  position: 'absolute', right: 0, top: 0, width: cardW,
                  animation: `beltUp ${rightCards.length * 6}s linear infinite`,
                }}>
                  {rightCards.map((c, i) => renderCard(c, i))}
                  {rightCards.map((c, i) => renderCard(c, i + rightCards.length))}
                </div>
              </div>
            )
          })()}
        </div>

        {/* Cart of oranges — bottom left */}
        <div style={{
          position: 'absolute', bottom: -140, left: -130, pointerEvents: 'none',
          opacity: 0.85,
        }}>
          <svg width="520" height="420" viewBox="0 0 160 130" fill="none">
            {/* === 1. Left support post — behind everything === */}
            <path d="M36 55 L30 130" stroke="#8b7355" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M37 55 L31 130" stroke="#7a6445" strokeWidth="0.6" opacity="0.3" />

            {/* === 2. Wheel — behind cart, angled right to match cart perspective === */}
            <ellipse cx="105" cy="72" rx="18" ry="17" stroke="#6b5a42" strokeWidth="2.5" fill="#c4a878" />
            <ellipse cx="105" cy="72" rx="14.5" ry="13.5" stroke="#6b5a42" strokeWidth="0.8" fill="none" opacity="0.4" />
            <circle cx="105" cy="72" r="3" fill="#6b5a42" />
            <line x1="105" y1="55" x2="105" y2="89" stroke="#6b5a42" strokeWidth="1.2" />
            <line x1="87" y1="72" x2="123" y2="72" stroke="#6b5a42" strokeWidth="1.2" />
            <line x1="92.3" y1="60" x2="117.7" y2="84" stroke="#6b5a42" strokeWidth="1.2" />
            <line x1="117.7" y1="60" x2="92.3" y2="84" stroke="#6b5a42" strokeWidth="1.2" />
            {/* Wheel bracket connecting to cart bottom */}
            <path d="M105 58 L110 56" stroke="#6b5a42" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M112 58 L105 58" stroke="#6b5a42" strokeWidth="1.5" />

            {/* === 3. Oranges — behind cart walls === */}
            <circle cx="42" cy="34" r="8" fill="#e8940a" /><circle cx="42" cy="34" r="8" stroke="#c67e08" strokeWidth="0.8" fill="none" />
            <circle cx="56" cy="30" r="7" fill="#d97706" /><circle cx="56" cy="30" r="7" stroke="#b56a06" strokeWidth="0.8" fill="none" />
            <circle cx="69" cy="28" r="8" fill="#e8940a" /><circle cx="69" cy="28" r="8" stroke="#c67e08" strokeWidth="0.8" fill="none" />
            <circle cx="82" cy="27" r="7.5" fill="#d97706" /><circle cx="82" cy="27" r="7.5" stroke="#b56a06" strokeWidth="0.8" fill="none" />
            <circle cx="95" cy="28" r="8" fill="#e8940a" /><circle cx="95" cy="28" r="8" stroke="#c67e08" strokeWidth="0.8" fill="none" />
            <circle cx="106" cy="30" r="7" fill="#d97706" /><circle cx="106" cy="30" r="7" stroke="#b56a06" strokeWidth="0.8" fill="none" />
            <circle cx="48" cy="40" r="7.5" fill="#f0a020" /><circle cx="48" cy="40" r="7.5" stroke="#c67e08" strokeWidth="0.8" fill="none" />
            <circle cx="62" cy="37" r="8" fill="#e8940a" /><circle cx="62" cy="37" r="8" stroke="#c67e08" strokeWidth="0.8" fill="none" />
            <circle cx="76" cy="35" r="7" fill="#f0a020" /><circle cx="76" cy="35" r="7" stroke="#c67e08" strokeWidth="0.8" fill="none" />
            <circle cx="90" cy="36" r="7.5" fill="#e8940a" /><circle cx="90" cy="36" r="7.5" stroke="#c67e08" strokeWidth="0.8" fill="none" />
            <circle cx="102" cy="38" r="7" fill="#f0a020" /><circle cx="102" cy="38" r="7" stroke="#c67e08" strokeWidth="0.8" fill="none" />
            <circle cx="55" cy="44" r="6.5" fill="#d97706" /><circle cx="55" cy="44" r="6.5" stroke="#b56a06" strokeWidth="0.8" fill="none" />
            <circle cx="68" cy="42" r="7" fill="#e8940a" /><circle cx="68" cy="42" r="7" stroke="#c67e08" strokeWidth="0.8" fill="none" />
            <circle cx="83" cy="42" r="6.5" fill="#d97706" /><circle cx="83" cy="42" r="6.5" stroke="#b56a06" strokeWidth="0.8" fill="none" />
            <circle cx="96" cy="43" r="7" fill="#e8940a" /><circle cx="96" cy="43" r="7" stroke="#c67e08" strokeWidth="0.8" fill="none" />
            {/* Stems — varied but subtle */}
            <path d="M42 26 L43 23" stroke="#5a6b30" strokeWidth="0.7" strokeLinecap="round" />
            <path d="M43 23 Q46 22 45 25" fill="#6b7a3a" />
            <path d="M69 20 L68 18" stroke="#5a6b30" strokeWidth="0.6" strokeLinecap="round" />
            <path d="M68 18 Q65 17 66 20" fill="#6b7a3a" />
            <path d="M95 20 L96.5 17" stroke="#5a6b30" strokeWidth="0.7" strokeLinecap="round" />
            <path d="M96.5 17 Q99 16.5 98 19" fill="#7a8a44" />
            <path d="M56 23 L55 21.5" stroke="#5a6b30" strokeWidth="0.5" strokeLinecap="round" />
            <path d="M82 19.5 L83.5 17" stroke="#5a6b30" strokeWidth="0.6" strokeLinecap="round" />
            <path d="M83.5 17 Q86 16 85 18.5" fill="#6b7a3a" />
            <path d="M106 23 L107 21" stroke="#5a6b30" strokeWidth="0.5" strokeLinecap="round" />
            <path d="M107 21 Q109 20.5 108.5 22.5" fill="#7a8a44" />
            {/* Half orange */}
            <circle cx="38" cy="42" r="7" fill="#f5c560" /><circle cx="38" cy="42" r="7" stroke="#c67e08" strokeWidth="0.8" fill="none" />
            <circle cx="38" cy="42" r="4.5" stroke="#e8b030" strokeWidth="0.5" fill="none" />
            <line x1="38" y1="42" x2="38" y2="35.5" stroke="#e8b030" strokeWidth="0.4" />
            <line x1="38" y1="42" x2="32" y2="38" stroke="#e8b030" strokeWidth="0.4" />
            <line x1="38" y1="42" x2="44" y2="38" stroke="#e8b030" strokeWidth="0.4" />
            <line x1="38" y1="42" x2="33" y2="46" stroke="#e8b030" strokeWidth="0.4" />
            <line x1="38" y1="42" x2="43" y2="46" stroke="#e8b030" strokeWidth="0.4" />
            <circle cx="38" cy="42" r="1.2" fill="#e8b030" />

            {/* === 4. Cart body — on top === */}
            <path d="M8 58 Q12 56 30 62" stroke="#8b7355" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M6 66 Q10 64 28 68" stroke="#8b7355" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M4 56 Q2 62 4 68" stroke="#6b5a42" strokeWidth="2" strokeLinecap="round" />
            <path d="M28 54 L32 38 L108 34 L112 58 Z" fill="#b09870" />
            <path d="M28 54 L32 38" stroke="#7a6445" strokeWidth="2" strokeLinecap="round" />
            <path d="M32 38 L108 34" stroke="#7a6445" strokeWidth="2" strokeLinecap="round" />
            <path d="M108 34 L112 58" stroke="#7a6445" strokeWidth="2" strokeLinecap="round" />
            <path d="M112 58 L28 54" stroke="#7a6445" strokeWidth="2" strokeLinecap="round" />
            <path d="M29 48 L110 44" stroke="#7a6445" strokeWidth="0.8" opacity="0.6" />
            <path d="M30 51 L111 48" stroke="#7a6445" strokeWidth="0.6" opacity="0.4" />
            <path d="M31 45 L109 41" stroke="#7a6445" strokeWidth="0.5" opacity="0.3" />
            <path d="M108 34 L120 38 L124 62 L112 58 Z" fill="#9a8565" />
            <path d="M108 34 L120 38 L124 62 L112 58 Z" stroke="#7a6445" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
            <path d="M110 44 L122 48" stroke="#7a6445" strokeWidth="0.6" opacity="0.4" />
            <path d="M111 50 L123 54" stroke="#7a6445" strokeWidth="0.5" opacity="0.3" />
          </svg>
        </div>

        {/* Scroll down indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: heroDone ? 1 : 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          style={{
            position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            opacity: heroTextOpacity,
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontFamily: mono, fontSize: '0.6rem', letterSpacing: '0.2em', color: '#bdb9b2', textTransform: 'lowercase' }}>
            scroll down
          </span>
          <motion.svg
            width="16" height="16" viewBox="0 0 16 16" fill="none"
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path d="M4 6L8 10L12 6" stroke="#bdb9b2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </motion.div>
        <style>{`@keyframes fadeIn { to { opacity: 1 } }`}</style>
      </section>

      {/* Spacer before orchard */}
      <div style={{ height: '4vh' }} />

      {/* ===== Orchard expansion zone — tall scroll spacer with pinned orchard ===== */}
      <div ref={orchardSectionRef} style={{ height: '300vh', position: 'relative' }}>
        <div style={{
          position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
          padding: '24px 40px',
        }}>
          {/* Fullscreen orchard terrain — fades in as user scrolls */}
          <div style={{
            position: 'relative', width: '100%', height: '100%',
            borderRadius: 20, overflow: 'hidden',
            opacity: Math.min(1, orchardProgress * 20 + 0.3),
            transition: 'opacity 0.05s',
          }}>
            <LandingTerrain progress={orchardProgress} />

          {/* Overlay text — appears after all tree rows have scrolled in */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', zIndex: 100,
            opacity: orchardProgress > 0.05 ? Math.min(1, (orchardProgress - 0.05) * 4) : 0,
          }}>
            <div style={{
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(8px)',
              borderRadius: 12,
              padding: '32px 48px',
              border: '1px solid rgba(255,255,255,0.08)',
              textAlign: 'center',
              transform: `translateY(${(1 - Math.min(1, orchardProgress > 0.05 ? (orchardProgress - 0.05) * 4 : 0)) * 30}px)`,
            }}>
              <h2 style={{
                fontFamily: serif, fontSize: 'clamp(2rem, 5vw, 3.6rem)', fontWeight: 400,
                color: '#fff', textTransform: 'lowercase', letterSpacing: '-0.03em',
                margin: '0 0 12px 0',
              }}>
                your orchard awaits.
              </h2>
              <p style={{
                fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.15em',
                color: 'rgba(255,255,255,0.7)', textTransform: 'lowercase',
                margin: 0,
              }}>
                every tree grown through focus
              </p>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* ===== Content sections — normal flow ===== */}
      <div style={{ background: '#E8E0D0', position: 'relative', zIndex: 2 }}>

        {/* Animated stats banner */}
        <section style={{ padding: '80px 80px 48px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 80 }}>
            {[
              { value: 40, suffix: '+', label: 'tree species' },
              { value: 30, suffix: '+', label: 'achievements' },
              { value: 5, suffix: '', label: 'notebook types' },
              { value: 100, suffix: '%', label: 'free to use' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.7, delay: i * 0.12, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ textAlign: 'center' }}
              >
                <div style={{ fontFamily: serif, fontSize: '2.4rem', fontWeight: 400, color: '#0f0f10', lineHeight: 1, letterSpacing: '-0.03em' }}>
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} delay={i * 200} />
                </div>
                <span style={{ fontFamily: mono, fontSize: '0.62rem', letterSpacing: '0.15em', color: '#bdb9b2', textTransform: 'lowercase', marginTop: 6, display: 'block' }}>
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Why not docs */}
        <section style={{ borderTop: '1px solid rgba(15,15,16,0.08)', padding: '80px 80px 40px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80 }}>
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <span style={{ fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.28em', color: accent, textTransform: 'lowercase', display: 'block', marginBottom: 16 }}>
                -- why pulp
              </span>
              <h2 style={{ fontFamily: serif, fontSize: '1.8rem', fontWeight: 400, color: '#0f0f10', textTransform: 'lowercase', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
                docs wasn't built for this.
              </h2>
              <p style={{ fontFamily: serif, fontSize: '0.95rem', lineHeight: 1.7, color: '#6b6864', textTransform: 'lowercase', margin: 0 }}>
                google docs is a word processor pretending to be a notebook. it's slow, cluttered, and built for collaboration. not for you sitting in lecture trying to keep up.
                pulp is different. it loads instantly, stays out of your way, and rewards you for staying focused. no toolbar maze, no 2-second load times, no distractions.
              </p>
            </motion.div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, padding: '0 12px' }}>
                <span style={{ fontFamily: mono, fontSize: '0.62rem', letterSpacing: '0.15em', color: '#bdb9b2', textTransform: 'lowercase' }}>others</span>
                <span style={{ fontFamily: mono, fontSize: '0.62rem', letterSpacing: '0.15em', color: accent, textTransform: 'lowercase' }}>pulp</span>
              </div>
              {[
                ['no focus tools', 'focus timer + site blocker'],
                ['no consequences', 'real stakes — quit = lose progress'],
                ['clunky ui', 'shortcut-driven workflow'],
                ['just a doc', 'an orchard that grows as you write'],
              ].map(([l, r], i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: [0.2, 0.8, 0.2, 1] }}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 12px', borderRadius: 8,
                    background: i % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent',
                  }}
                >
                  <span style={{ fontFamily: serif, fontSize: '0.85rem', color: '#bdb9b2', textTransform: 'lowercase', textDecoration: 'line-through', textDecorationColor: 'rgba(15,15,16,0.15)' }}>{l}</span>
                  <span style={{ fontFamily: serif, fontSize: '0.85rem', color: '#0f0f10', textTransform: 'lowercase', fontWeight: 400 }}>{r}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" ref={featuresRef} style={{ padding: '48px 80px 100px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <motion.span
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              style={{ fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.28em', color: accent, textTransform: 'lowercase', display: 'block', marginBottom: 48 }}
            >
              -- features
            </motion.span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '48px 48px' }}>
              {FEATURES.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 60, scale: 0.92, rotateX: 8 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.7, delay: i * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
                  style={{
                    padding: '24px 20px', borderRadius: 12,
                    border: '1px solid rgba(15,15,16,0.06)',
                    background: 'rgba(0,0,0,0.015)',
                    transformOrigin: 'center bottom',
                  }}
                >
                  <span style={{ fontSize: '1.6rem', display: 'block', marginBottom: 12 }}>{f.icon}</span>
                  <h3 style={{ fontFamily: serif, fontSize: '1.1rem', fontWeight: 400, color: '#0f0f10', textTransform: 'lowercase', margin: '0 0 8px 0' }}>
                    {f.label}
                  </h3>
                  <p style={{ fontFamily: serif, fontSize: '0.88rem', lineHeight: 1.65, color: '#6b6864', textTransform: 'lowercase', margin: 0 }}>
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '120px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(217,119,6,0.04) 0%, transparent 70%)',
          }} />
          <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <h2 style={{ fontFamily: serif, fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 400, color: '#0f0f10', textTransform: 'lowercase', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
                your orchard is waiting.
              </h2>
              <p style={{ fontFamily: serif, fontSize: '1rem', color: '#6b6864', textTransform: 'lowercase', margin: '0 0 40px 0' }}>
                start writing, stay focused, and grow something beautiful.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                <a href="/login" style={{
                  fontFamily: mono, fontSize: '0.76rem', letterSpacing: '0.06em',
                  padding: '12px 32px', borderRadius: 8, textDecoration: 'none', textTransform: 'lowercase',
                  background: accent, color: '#fff',
                  boxShadow: '0 4px 20px -4px rgba(234,88,12,0.3)',
                }}>
                  start growing — free
                </a>
                <a href="/app" style={{
                  fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.06em',
                  padding: '11px 24px', borderRadius: 8, textDecoration: 'none', textTransform: 'lowercase',
                  background: 'transparent', color: '#6b6864',
                  border: '1px solid rgba(15,15,16,0.12)',
                }}>
                  try without account
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          borderTop: '1px solid rgba(15,15,16,0.08)',
          padding: '80px 80px 40px',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{
              fontFamily: serif, fontSize: 'clamp(4rem, 10vw, 8rem)', fontWeight: 400,
              textTransform: 'lowercase', letterSpacing: '-0.04em', margin: '0 0 32px 0', lineHeight: 1.1,
              padding: '0 8px',
              background: 'linear-gradient(135deg, #f5c876 0%, #d97706 40%, #92400e 100%)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
              overflow: 'visible',
            }}>
              pulp
            </h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 24 }}>
              {[
                { label: 'contact', href: 'https://www.cesarvillegas.me' },
                { label: 'privacy', href: '/privacy' },
                { label: 'terms', href: '/terms' },
              ].map(link => (
                <a key={link.label} href={link.href} style={{
                  fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.06em',
                  color: '#6b6864', textDecoration: 'none', textTransform: 'lowercase',
                }}>{link.label}</a>
              ))}
            </div>
            <p style={{
              fontFamily: serif, fontSize: '0.8rem', color: '#bdb9b2', textTransform: 'lowercase', margin: 0,
            }}>
              © 2026 pulp.
            </p>
          </div>
        </footer>
      </div>

      {modalType && <ReachOutModal type={modalType} onClose={() => setModalType(null)} />}
    </div>
  )
}
