"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"
import { PlantIcon } from "./components/PlantIcon"
import { LandingTerrain } from "./components/LandingTerrain"


const FEATURES = [
  { label: 'focus timer', desc: 'pomodoro sessions that grow trees as you write. stay focused, watch your orchard grow.', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { label: 'living orchard', desc: 'every notebook grows its own orchard. see where your time goes — and what you have to show for it.', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 20V14"/><path d="M14 14c0-2 1.5-3.5 3-4.5 1.5 1 3 2.5 3 4.5a3 3 0 0 1-6 0z"/><path d="M7 20V10"/><path d="M4 10c0-2.5 1.5-4.5 3-5.5 1.5 1 3 3 3 5.5a3 3 0 0 1-6 0z"/><path d="M2 22h20"/></svg> },
  { label: 'inline ai', desc: 'ai that understands your entire notebook. edit, rewrite, and expand — right where you write.', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93"/><path d="M8.24 2.69A4 4 0 0 0 8 6c0 1.95 1.4 3.58 3.25 3.93"/><path d="M12 10v12"/><path d="M8 16h8"/><path d="M6 20h12"/></svg> },
  { label: 'seed shop', desc: 'spend sap on seeds. grow fruit trees, lumber trees, and rare gem-producing trees.', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></svg> },
  { label: 'leaderboards', desc: 'compete with other players. climb the ranks, win exclusive trees, and prove your focus.', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg> },
  { label: 'stats', desc: 'track focus, streaks, and growth on a customizable dashboard. see your daily rhythm at a glance.', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="20" x2="6" y2="14"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="18" y1="20" x2="18" y2="10"/></svg> },
]

// Per-feature screenshots. Drop real images at these paths in /public; until then a placeholder shows.
const FEATURE_IMAGES = [
  '/feature-timer.png',
  '/feature-orchard.png',
  '/feature-ai.png',
  '/feature-shop.png',
  '/feature-leaderboard.png',
  '/feature-stats.png',
]

function FeatureShot({ src, label }: { src: string, label: string }) {
  const [ok, setOk] = useState(true)
  const card: React.CSSProperties = {
    width: '100%', aspectRatio: '4 / 3', borderRadius: 16,
    border: '1px solid rgba(15,15,16,0.08)',
    boxShadow: '0 12px 30px -18px rgba(0,0,0,0.25)',
    overflow: 'hidden', display: 'block', background: '#fff',
  }
  if (!ok) {
    return (
      <div style={{
        ...card,
        background: 'repeating-linear-gradient(135deg, rgba(0,0,0,0.018) 0 14px, rgba(0,0,0,0.04) 14px 28px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#a8a29a',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.5-3.5a2 2 0 0 0-2.8 0L5 21"/></svg>
        <span style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'lowercase' }}>coming soon</span>
      </div>
    )
  }
  return (
    <div style={card}>
      <img src={src} alt={label} onError={() => setOk(false)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
    </div>
  )
}

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

  return <span ref={ref}>{target < 0 ? '' : count.toLocaleString()}{suffix}</span>
}


function TypewriterHeadline({ serif, onComplete, settled }: { serif: string, onComplete?: () => void, settled: boolean }) {
  const line1 = "Notes don't have"
  const line2 = "to be boring."
  const text = line1 + '\n' + line2
  const [charIdx, setCharIdx] = useState(0)
  const [showCursor, setShowCursor] = useState(true)
  const [cursorFading, setCursorFading] = useState(false)
  const [typingDone, setTypingDone] = useState(false)

  useEffect(() => {
    if (charIdx >= text.length) {
      setCursorFading(true)
      const t = setTimeout(() => { setShowCursor(false); setTypingDone(true); onComplete?.() }, 600)
      return () => clearTimeout(t)
    }
    const ch = text[charIdx]
    const prev = charIdx > 0 ? text[charIdx - 1] : ''
    let delay = 34 + Math.random() * 25
    if (ch === '\n') delay = 51
    else if (ch === ' ') delay = 59 + Math.random() * 34
    else if (prev === ' ' || prev === '\n' || charIdx === 0) delay = 68 + Math.random() * 25
    else if ("'.,".includes(ch)) delay = 77 + Math.random() * 25
    const t = setTimeout(() => setCharIdx(i => i + 1), delay)
    return () => clearTimeout(t)
  }, [charIdx, text.length])

  const cursorEl = showCursor ? (
    <span style={{ display: 'inline-block', width: 3, height: '0.75em', background: '#d97706', marginLeft: 2, verticalAlign: 'baseline', animation: cursorFading ? 'cursorFadeOut 0.4s ease-out forwards' : 'cursorBlink 1s ease-in-out infinite' }} />
  ) : null

  const displayed = text.slice(0, charIdx)
  const parts = displayed.split('\n')

  const settledScale = 0.7
  return (
    <h1 style={{
      fontFamily: 'var(--font-fraunces), serif', fontWeight: 400,
      lineHeight: 1.1, letterSpacing: '-0.03em',
      color: '#0f0f10', margin: '0 0 0 0',
      fontSize: 'clamp(3rem, 7vw, 5.5rem)',
      textAlign: 'left',
      whiteSpace: 'nowrap',
      transform: settled ? `scale(${settledScale})` : 'scale(1)',
      transformOrigin: 'top left',
      transition: typingDone ? 'transform 0.9s cubic-bezier(0.2,0.8,0.2,1), transform-origin 0.9s cubic-bezier(0.2,0.8,0.2,1)' : 'none',
      willChange: 'transform',
    }}>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {i === 1 && p.endsWith('boring.') ? (
            <>
              {p.slice(0, -7)}
              <span style={{ position: 'relative', display: 'inline-block' }}>
                boring.
                <svg
                  width="100%" height="8" viewBox="0 0 120 8" preserveAspectRatio="none"
                  style={{
                    position: 'absolute', left: 0, bottom: '-10px', width: '100%',
                    overflow: 'visible', pointerEvents: 'none',
                  }}
                >
                  <path
                    d="M2,5 Q12,2 22,5 Q32,8 42,5 Q52,2 62,5 Q72,8 82,5 Q92,2 102,5 Q112,8 118,5"
                    fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round"
                    strokeDasharray="140"
                    strokeDashoffset={settled ? '0' : '140'}
                    style={{ transition: settled ? 'stroke-dashoffset 0.6s ease 1.5s' : 'none' }}
                  />
                </svg>
              </span>
            </>
          ) : p}
        </span>
      ))}
      {cursorEl}
      <style>{`@keyframes cursorBlink { 0%, 100% { opacity: 1 } 50% { opacity: 0.15 } } @keyframes cursorFadeOut { from { opacity: 1 } to { opacity: 0 } }`}</style>
    </h1>
  )
}

const DEMO_TREES = [
  'tangerine', 'lemon', 'plum', 'pineapple', 'passionfruit', 'coconut',
  'sunflower', 'grape', 'pear', 'melon', 'mushroom', 'cactus', 'sage', 'lychee', 'papaya',
  'coral', 'bloom', 'lotus', 'birch', 'pine', 'ivy', 'oak', 'sakura', 'cattail', 'cypress',
  'bamboo', 'mangrove', 'bonsai', 'juniper', 'cedarwood', 'baobab', 'winterveil', 'agave',
  'abyss', 'starweaver', 'leviathan', 'prismatic',
] as const

function DemoTimer({ serif, dark = false }: { serif: string, dark?: boolean }) {
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
    }, 70)
    return () => clearInterval(iv)
  }, [started, paused, total])

  const progress = elapsed / total
  const remaining = total - elapsed
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  const treeIdx = Math.floor(elapsed / treeChangeInterval) % DEMO_TREES.length
  const shuffleType = DEMO_TREES[treeIdx]
  const stage = !started ? -1 : progress < 0.08 ? 0 : progress < 0.25 ? 1 : progress < 0.5 ? 2 : progress < 0.8 ? 3 : 4
  const plantSize = !started ? 130 : stage === 0 ? 65 : 90 + stage * 15
  const done = elapsed >= total

  const mainColor = "#d97706"
  const subtleColor = dark ? "#8a8680" : "#71717a"
  const faintStroke = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"
  const innerBg = dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"

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
          fill="none" stroke={faintStroke} strokeWidth="1" />
        <rect x="0" y="0" width={boxW} height={boxH} rx="4" ry="4"
          fill="none" stroke={mainColor} strokeWidth="2"
          strokeDasharray={perim} strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.3s linear' }} />
      </svg>

      <div style={{
        background: innerBg, borderRadius: 4, overflow: 'hidden',
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
            <div style={{ position: 'absolute', bottom: -12, left: 0, width: '100%', zIndex: 0 }}>
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
              bottom: stage === 0 ? 2 : 14, zIndex: 10,
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
        </div>
      </div>
    </div>
  )
}

const MODAL_CONFIG: Record<string, { subtitle: string, hasSubject: boolean, subjectPlaceholder: string, bodyPlaceholder: string, bodyLabel: string }> = {
  'report a bug': { subtitle: 'help me squash it.', hasSubject: true, subjectPlaceholder: "what's broken?", bodyPlaceholder: 'steps to reproduce, what you expected, etc.', bodyLabel: 'details (optional)' },
  'request a feature': { subtitle: "i want to hear it. i'll let you know if i add it.", hasSubject: true, subjectPlaceholder: "what's the feature?", bodyPlaceholder: 'why would this be useful? any details help.', bodyLabel: 'description (optional)' },
  'feedback': { subtitle: 'i read everything.', hasSubject: false, subjectPlaceholder: '', bodyPlaceholder: "whats up? drop your email if you want a reply.", bodyLabel: '' },
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
  const [pastHero, setPastHero] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual')
  // Upgrade stays on the site: signed in -> straight to Stripe Checkout; signed out ->
  // sign in, then back here (?checkout=plan) which opens checkout. Never via the app.
  const [checkoutBusy, setCheckoutBusy] = useState<'button' | 'auto' | null>(null)
  const [checkoutError, setCheckoutError] = useState('')
  const goCheckout = useCallback(async (plan: 'plus_monthly' | 'plus_yearly', how: 'button' | 'auto' = 'button') => {
    setCheckoutError('')
    setCheckoutBusy(how)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = `/login?checkout=${plan}`; return }
      window.location.href = `/checkout?plan=${plan}&from=site`
      return
    } catch { setCheckoutError("couldn't open checkout — try again") }
    setCheckoutBusy(null)
  }, [])
  useEffect(() => {
    const plan = new URLSearchParams(window.location.search).get('checkout')
    if (plan !== 'plus_monthly' && plan !== 'plus_yearly') return
    window.history.replaceState(null, '', window.location.pathname + window.location.hash)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot: resume an upgrade after sign-in
    goCheckout(plan, 'auto')
  }, [goCheckout])
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
        setPastHero(window.scrollY > window.innerHeight * 0.7)
        const el = orchardSectionRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const scrollable = el.offsetHeight - window.innerHeight
        if (scrollable <= 0) return
        const raw = -(rect.top - window.innerHeight * 0.3) / (el.offsetHeight - window.innerHeight)
        const pastOrchard = rect.bottom < 0
        setOrchardProgress(pastOrchard ? 0 : Math.max(0, Math.min(1, raw)))
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
        opacity: inOrchard ? 0 : 1,
        transform: inOrchard ? 'translateY(-8px)' : 'translateY(0)',
        pointerEvents: inOrchard ? 'none' : 'auto',
        transition: 'opacity 0.4s, transform 0.4s, background 0.4s, border-bottom 0.4s, backdrop-filter 0.4s',
        background: inOrchard ? 'transparent' : scrolled ? 'rgba(255,255,255,0.35)' : 'transparent',
        backdropFilter: inOrchard || !scrolled ? 'none' : 'blur(16px)',
        WebkitBackdropFilter: inOrchard || !scrolled ? 'none' : 'blur(16px)',
        borderBottom: inOrchard ? '1px solid transparent' : scrolled ? '1px solid rgba(15,15,16,0.06)' : '1px solid transparent',
      }}>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 18, fontWeight: 400, color: inOrchard ? 'rgba(255,255,255,0.9)' : accent, letterSpacing: '-0.02em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', transition: 'color 0.4s' }}
        >
          <img src="/pulp_logo.svg" alt="pulp" style={{ width: 22, height: 22 }} />
          <span style={{ transform: 'translateY(-2px)' }}>pulp</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginLeft: 48 }}>
          <div style={{ position: 'relative' }}>
            <a
              onClick={(e) => { e.stopPropagation(); setReachOutOpen(o => !o) }}
              style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '0.85rem', color: inOrchard ? 'rgba(255,255,255,0.8)' : '#6b6864', textDecoration: 'none', cursor: 'pointer', userSelect: 'none', transition: 'color 0.4s' }}
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
          <a href="#features" style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '0.85rem', color: inOrchard ? 'rgba(255,255,255,0.8)' : '#6b6864', textDecoration: 'none', transition: 'color 0.4s' }}>features</a>
          <a href="#pricing" style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '0.85rem', color: inOrchard ? 'rgba(255,255,255,0.8)' : '#6b6864', textDecoration: 'none', transition: 'color 0.4s' }}>pricing</a>
        </div>
        <a href="/app" style={{
          marginLeft: 'auto',
          fontFamily: 'var(--font-fraunces), serif', fontSize: '0.8rem',
          padding: '7px 18px', borderRadius: 999, textDecoration: 'none',
          background: 'linear-gradient(to bottom, #e8a020, #d97706)', color: '#fff',
          boxShadow: '0 2px 0 rgba(0,0,0,0.2)',
          opacity: pastHero && !inOrchard ? 1 : 0,
          transform: pastHero && !inOrchard ? 'translateY(0)' : 'translateY(-4px)',
          transition: 'opacity 0.3s, transform 0.3s',
          pointerEvents: pastHero && !inOrchard ? 'auto' : 'none',
        }}>get started</a>
      </nav>

      {/* Subtle dot texture — fixed behind hero */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1,
        backgroundImage: 'url(/paper-texture.png)',
        backgroundSize: '512px 512px',
        backgroundRepeat: 'repeat',
        opacity: inOrchard ? 0 : 0.4,
        transition: 'opacity 0.5s',
      }} />


      {/* ===== Hero ===== */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', zIndex: 2 }}>
        {/* Gradient background */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(125% 125% at 50% 10%, #E8E0D0 45%, rgba(217,119,6,0.25) 100%)',
        }} />
        {/* Paper speckle texture */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/paper-texture.png)',
          backgroundSize: '512px 512px',
          backgroundRepeat: 'repeat',
          opacity: 0.4,
        }} />
        {/* Bottom fade for smooth transition */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: 160,
          background: 'linear-gradient(to bottom, transparent, #E8E0D0)',
          zIndex: 2, pointerEvents: 'none',
        }} />

        <div
          style={{
            position: 'relative', width: '100%', maxWidth: 1240, margin: '0 auto',
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
              width: heroSettled ? (isMobile ? '100%' : '44%') : '100%',
              position: 'relative',
              paddingLeft: heroSettled && !isMobile ? 36 : 0,
              textAlign: 'left' as const,
              display: 'flex', flexDirection: 'column',
              alignItems: isMobile ? 'center' : 'flex-start',
              justifyContent: 'center',
              transition: 'width 0.9s cubic-bezier(0.2,0.8,0.2,1), padding-left 0.9s cubic-bezier(0.2,0.8,0.2,1)',
            }}
          >
            {/* Hand-drawn orange vertical line */}
            {!isMobile && (
              <div style={{
                position: 'absolute', left: -10, top: -40, bottom: -40, width: 24, pointerEvents: 'none',
                opacity: heroSettled ? 0.35 : 0,
                transition: 'opacity 0.8s cubic-bezier(0.2,0.8,0.2,1) 0.3s',
              }}>
                <svg width="24" height="100%" preserveAspectRatio="none" viewBox="0 0 24 100" style={{ width: '100%', height: '100%' }}>
                  <path d="M12,0 Q14,10 12.5,20 Q11,30 13,40 Q14.5,50 12.5,60 Q11,70 13,80 Q14.5,90 12.5,100" fill="none" stroke="#d97706" strokeWidth="3.5" strokeLinecap="round" />
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
              <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '2.8rem', float: 'left', lineHeight: 0.8, marginRight: 6, marginTop: 4, color: '#d97706', fontWeight: 400 }}>P</span>ulp is a cozy notes app that makes writing stuff down feel like a game. focus timer, growing orchards, 40+ species to collect.
            </p>

            <div style={{
              marginTop: 32,
              opacity: heroSettled ? 1 : 0,
              transform: heroSettled ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.8s cubic-bezier(0.2,0.8,0.2,1) 0.6s, transform 0.8s cubic-bezier(0.2,0.8,0.2,1) 0.6s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <a href="/app" className="btn-pop" style={{
                  fontFamily: 'var(--font-fraunces), serif', fontSize: '0.9rem',
                  padding: '14px 28px', borderRadius: 999, textDecoration: 'none',
                  background: 'linear-gradient(to bottom, #e8a020, #d97706)', color: '#fff',
                  boxShadow: '0 2px 0 rgba(0,0,0,0.2), 0 4px 12px -2px rgba(234,88,12,0.35)',
                  display: 'inline-flex', alignItems: 'center',
                }}>Go to pulp</a>
                <a href="/app" style={{
                  fontFamily: 'var(--font-fraunces), serif', fontSize: '0.85rem',
                  color: '#9a958e', textDecoration: 'underline', textUnderlineOffset: 3,
                }}>log in</a>
              </div>
            </div>
          </div>

          {/* Right: Conveyor belt cards */}
          <style>{`@keyframes cvSwTwk { 0%, 100% { opacity: 0.9 } 50% { opacity: 0.1 } } @keyframes cvSacredGlow { 0% { background-position: 0% 50% } 50% { background-position: 100% 50% } 100% { background-position: 0% 50% } }`}</style>
          {!isMobile && (() => {
            const cardW = 240
            const cardH = 220
            const timerH = 440
            const gap = 20
            const tallH = 320
            const leftCards = [
              { label: 'starweaver', content: (
                <div style={{ width: '100%', height: '100%', background: '#E0D7C1', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  <svg viewBox="0 0 48 52" width="160" height="173">
                    <ellipse cx="24" cy="49" rx="14" ry="3.5" fill="#c8bfa8" />
                    <ellipse cx="24" cy="48" rx="12" ry="3" fill="#b8af98" />
                    <path d="M24 46 Q22.8 40 24.5 34 Q23.5 28 24.2 22 Q24 18 24 14" stroke="#3e3570" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                    <path d="M24 36 Q20 33 15 30 Q12 29 10 28.5" stroke="#3e3570" strokeWidth="0.55" strokeLinecap="round" fill="none" />
                    <path d="M24 36 Q28 32 33 30 Q36 29.5 38 30" stroke="#3e3570" strokeWidth="0.55" strokeLinecap="round" fill="none" />
                    <path d="M24 30 Q19 25 14 21 Q11 19.5 9 20" stroke="#3e3570" strokeWidth="0.5" strokeLinecap="round" fill="none" />
                    <path d="M24 30 Q29 24 35 20 Q38 18 40 17.5" stroke="#3e3570" strokeWidth="0.5" strokeLinecap="round" fill="none" />
                    <path d="M24 24 Q18 18 12 14 Q9 12.5 7 13" stroke="#3e3570" strokeWidth="0.4" strokeLinecap="round" fill="none" />
                    <path d="M24 24 Q30 17 36 13 Q39 11 42 11.5" stroke="#3e3570" strokeWidth="0.4" strokeLinecap="round" fill="none" />
                    <path d="M24 19 Q21 15 18 12 Q16 10.5 15 8" stroke="#3e3570" strokeWidth="0.3" strokeLinecap="round" fill="none" />
                    <path d="M24 19 Q27 14 31 11 Q33 9.5 34 8" stroke="#3e3570" strokeWidth="0.3" strokeLinecap="round" fill="none" />
                    <path d="M10 28.5 Q17 29 24 27 Q31 29 38 30" stroke="#7986cb" strokeWidth="0.3" opacity="0.22" fill="none" />
                    <path d="M9 20 Q16 20.5 24 18.5 Q32 20.5 40 17.5" stroke="#c5cae9" strokeWidth="0.25" opacity="0.18" fill="none" />
                    <path d="M7 13 Q15 14 24 12 Q33 14 42 11.5" stroke="#7986cb" strokeWidth="0.2" opacity="0.14" fill="none" />
                    <path d="M24 27 L24.7 25.8 L24 24.6 L23.3 25.8Z" fill="#fff" style={{ animation: 'cvSwTwk 2s ease-in-out infinite' }} />
                    <path d="M17 24 L17.5 23.2 L17 22.4 L16.5 23.2Z" fill="#e8eaf6" style={{ animation: 'cvSwTwk 2.4s ease-in-out infinite 0.3s' }} />
                    <path d="M31 24 L31.5 23.2 L31 22.4 L30.5 23.2Z" fill="#e8eaf6" style={{ animation: 'cvSwTwk 2.2s ease-in-out infinite 0.7s' }} />
                    <path d="M24 18.5 L24.6 17.3 L24 16.1 L23.4 17.3Z" fill="#fff" style={{ animation: 'cvSwTwk 1.8s ease-in-out infinite 1s' }} />
                    <path d="M15 19 L15.4 18.3 L15 17.6 L14.6 18.3Z" fill="#c5cae9" style={{ animation: 'cvSwTwk 2.6s ease-in-out infinite 0.5s' }} />
                    <path d="M33 19 L33.4 18.3 L33 17.6 L32.6 18.3Z" fill="#c5cae9" style={{ animation: 'cvSwTwk 2.8s ease-in-out infinite 1.3s' }} />
                    <path d="M19 14 L19.4 13.2 L19 12.4 L18.6 13.2Z" fill="#e8eaf6" style={{ animation: 'cvSwTwk 2.1s ease-in-out infinite 1.6s' }} />
                    <path d="M29 14 L29.4 13.2 L29 12.4 L28.6 13.2Z" fill="#fff" style={{ animation: 'cvSwTwk 2.5s ease-in-out infinite 0.9s' }} />
                    <path d="M24 12 L24.7 10.6 L24 9.2 L23.3 10.6Z" fill="#fff" style={{ animation: 'cvSwTwk 1.9s ease-in-out infinite 0.2s' }} />
                  </svg>
                  <div style={{ position: 'absolute', top: 8, right: 10, textAlign: 'right' }}>
                    <div style={{ fontSize: 9, fontFamily: 'system-ui', background: 'linear-gradient(90deg, #7c3aed, #c084fc, #7c3aed)', backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'cvSacredGlow 3s ease-in-out infinite' }}>sacred</div>
                    <div style={{ fontSize: 7, fontFamily: 'system-ui', color: '#7c3aed', opacity: 0.4 }}>0.8%</div>
                  </div>
                </div>
              ), bg: '#E0D7C1', h: cardH, rot: -1.2, br: '18px 14px 20px 12px' },
              { label: 'tangerine', content: (
                <div style={{ width: '100%', height: '100%', background: '#E0D7C1', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  <svg viewBox="0 0 48 52" width="155" height="168">
                    <ellipse cx="24" cy="49" rx="15" ry="4" fill="#c8bfa8" />
                    <ellipse cx="24" cy="48" rx="13" ry="3.5" fill="#b8af98" />
                    {/* Trunk with bark texture */}
                    <path d="M22 46 C21.5 42 22 38 23 34 C23.5 32 24 31 24 30" fill="none" stroke="#5a4020" strokeWidth="4" strokeLinecap="round" />
                    <path d="M22 46 C21.5 42 22 38 23 34 C23.5 32 24 31 24 30" fill="none" stroke="#3a2810" strokeWidth="1.5" opacity="0.12" strokeLinecap="round" />
                    <path d="M22.5 36 C20 34.5 18 35 17 36" stroke="#5a4020" strokeWidth="1" fill="none" strokeLinecap="round" />
                    {/* Knot hole */}
                    <ellipse cx="22" cy="39" rx="1.5" ry="2" fill="#3a2810" />
                    <ellipse cx="22" cy="39" rx="0.9" ry="1.3" fill="#1a1008" />
                    {/* Main branches */}
                    <path d="M24 30 C20 28 16 28 12 30" stroke="#5a4020" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <path d="M24 30 C28 28 32 28 36 30" stroke="#5a4020" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <path d="M14 30 C12 28 10 24 8 22" stroke="#5a4020" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    <path d="M34 30 C36 28 38 24 40 22" stroke="#5a4020" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    <path d="M24 30 C24 26 24 22 24 18" stroke="#5a4020" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    {/* Canopy */}
                    <path d="M7 22 C6 14 12 7 18 6 Q21 5 24 6 Q27 5 30 6 C36 7 42 14 41 22 C42 28 38 33 32 34 Q28 35 24 34 Q20 35 16 34 C10 33 6 28 7 22 Z" fill="#4a8c3a" />
                    {/* Canopy shading */}
                    <path d="M10 28 C14 33 20 35 24 34 Q28 35 34 33 C38 30 40 26 41 22" fill="#3a7a2a" opacity="0.2" />
                    <path d="M14 12 C18 8 22 7 24 6 Q27 5 30 6 C34 8 38 12 40 18" fill="#56a046" opacity="0.15" />
                    {/* Leaf bumps */}
                    <path d="M9 14 Q7 12 9 10 Q10.5 12 9 14" fill="#4a8c3a" />
                    <path d="M38 12 Q40 10 39.5 8.5 Q38 10 38 12" fill="#4a8c3a" />
                    <path d="M6.5 25 Q5 23.5 6 22 Q7.5 23.5 6.5 25" fill="#4a8c3a" />
                    <path d="M41.5 24 Q43 22 42 20 Q41 22 41.5 24" fill="#4a8c3a" />
                    <path d="M15 34 Q13 34.5 14 33 Q15.5 33.5 15 34" fill="#4a8c3a" />
                    <path d="M33 34 Q35 34.5 34 33 Q32.5 33.5 33 34" fill="#4a8c3a" />
                    {/* Leaf vein highlights */}
                    <circle cx="14" cy="12" r="0.6" fill="#6aac5a" opacity="0.3" />
                    <circle cx="20" cy="10" r="0.5" fill="#6aac5a" opacity="0.3" />
                    <circle cx="34" cy="14" r="0.5" fill="#6aac5a" opacity="0.25" />
                    <circle cx="24" cy="16" r="0.5" fill="#6aac5a" opacity="0.25" />
                    {/* Oranges with highlights */}
                    <circle cx="11" cy="28" r="1.8" fill="#d97706" />
                    <circle cx="11.3" cy="27.5" r="0.6" fill="#f59e0b" opacity="0.4" />
                    <circle cx="14" cy="30" r="1.6" fill="#d97706" />
                    <circle cx="35" cy="28" r="1.8" fill="#d97706" />
                    <circle cx="35.3" cy="27.5" r="0.6" fill="#f59e0b" opacity="0.4" />
                    <circle cx="32" cy="30" r="1.6" fill="#d97706" />
                    <circle cx="18" cy="27" r="1.5" fill="#d97706" opacity="0.85" />
                    <circle cx="26" cy="28" r="1.5" fill="#d97706" opacity="0.85" />
                    <circle cx="24" cy="32" r="1.4" fill="#d97706" opacity="0.75" />
                    <circle cx="30" cy="22" r="1.2" fill="#e8a030" opacity="0.6" />
                    <circle cx="16" cy="18" r="1.1" fill="#e8a030" opacity="0.5" />
                    {/* Roots */}
                    <path d="M21 46 C19 45 17 45 15 46" stroke="#5a4020" strokeWidth="0.9" fill="none" opacity="0.3" />
                    <path d="M25 46 C27 45 29 45 31 46" stroke="#5a4020" strokeWidth="0.8" fill="none" opacity="0.25" />
                  </svg>
                  <div style={{ position: 'absolute', top: 8, right: 10, textAlign: 'right' }}>
                    <div style={{ fontSize: 9, fontFamily: 'system-ui', color: '#78716c', opacity: 0.7 }}>common</div>
                    <div style={{ fontSize: 7, fontFamily: 'system-ui', color: '#78716c', opacity: 0.4 }}>free</div>
                  </div>
                </div>
              ), bg: '#E0D7C1', h: tallH, rot: 0.8, br: '14px 18px 12px 20px' },
              { label: 'bamboo', content: (
                <div style={{ width: '100%', height: '100%', background: '#E0D7C1', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  <svg viewBox="0 0 48 60" width="135" height="155">
                    <ellipse cx="24" cy="57" rx="15" ry="4" fill="#c8bfa8" />
                    <ellipse cx="24" cy="56" rx="13" ry="3.5" fill="#b8af98" />
                    <path d="M16 54 L16 14" stroke="#1a3a0a" strokeWidth="1.7" strokeLinecap="round" opacity="0.8" />
                    <path d="M14.5 30 L17.5 30" stroke="#1a3a0a" strokeWidth="0.4" opacity="0.35" />
                    <path d="M24 54 L24 8" stroke="#4d7c0f" strokeWidth="2.3" strokeLinecap="round" />
                    <path d="M24 54 L24 8" stroke="#1a3a0a" strokeWidth="0.7" opacity="0.1" />
                    <path d="M22 41 L26 41" stroke="#1a3a0a" strokeWidth="0.65" opacity="0.4" />
                    <path d="M22 33 L26 33" stroke="#1a3a0a" strokeWidth="0.65" opacity="0.4" />
                    <path d="M22.5 25 L25.5 25" stroke="#1a3a0a" strokeWidth="0.5" opacity="0.35" />
                    <path d="M23 10 L25 10" stroke="#1a3a0a" strokeWidth="0.4" opacity="0.3" />
                    <path d="M24 32 C18 30 10 28 6 24 C10 24 18 28 24 31" fill="#4d7c0f" opacity="0.6" />
                    <path d="M24 24 C30 22 38 18 44 16 C38 18 30 21 24 23" fill="#4d7c0f" opacity="0.55" />
                    <path d="M24 16 C18 14 10 10 4 8 C10 9 18 12 24 15" fill="#4d7c0f" opacity="0.5" />
                    <path d="M24 8 C20 6 14 4 10 4 C14 3 20 5 24 7" fill="#4d7c0f" opacity="0.4" />
                    <path d="M24 8 C28 6 34 6 38 6 C34 7 28 7 24 7" fill="#4d7c0f" opacity="0.3" />
                    <path d="M32 54 L32 20" stroke="#4d7c0f" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                    <path d="M30.5 36 L33.5 36" stroke="#1a3a0a" strokeWidth="0.4" opacity="0.3" />
                    <path d="M32 30 C36 28 40 26 44 26 C40 27 36 28 32 29" fill="#4d7c0f" opacity="0.35" />
                    <path d="M16 22 C12 20 8 18 6 18 C8 17 12 19 16 21" fill="#4d7c0f" opacity="0.35" />
                  </svg>
                  <div style={{ position: 'absolute', top: 8, right: 10, textAlign: 'right' }}>
                    <div style={{ fontSize: 9, fontFamily: 'system-ui', color: '#2563eb', opacity: 0.7 }}>rare</div>
                    <div style={{ fontSize: 7, fontFamily: 'system-ui', color: '#2563eb', opacity: 0.4 }}>4%</div>
                  </div>
                </div>
              ), bg: '#E0D7C1', h: cardH, rot: -0.7, br: '20px 12px 16px 18px' },
              { label: 'cattail', content: (
                <div style={{ width: '100%', height: '100%', background: '#E0D7C1', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  <svg viewBox="0 0 48 52" width="170" height="195">
                    <ellipse cx="24" cy="49" rx="14" ry="4" fill="#c8bfa8" />
                    <ellipse cx="24" cy="48" rx="12" ry="3.5" fill="#b8af98" />
                    <line x1="24" y1="46" x2="24" y2="14" stroke="#7a9a6a" strokeWidth="1.2" />
                    <line x1="19" y1="46" x2="19" y2="22" stroke="#7a9a6a" strokeWidth="1" />
                    <line x1="29" y1="46" x2="29" y2="24" stroke="#7a9a6a" strokeWidth="1" />
                    <path d="M23 14 Q22.5 18 23 24 Q24 24.5 25 24 Q25.5 18 25 14 Q24 13 23 14" fill="#6d4c41" />
                    <circle cx="24" cy="16.5" r="0.35" fill="#8d6c51" opacity="0.5" />
                    <circle cx="23.5" cy="19" r="0.3" fill="#8d6c51" opacity="0.45" />
                    <circle cx="24.2" cy="22" r="0.3" fill="#8d6c51" opacity="0.4" />
                    <path d="M18.2 22 Q17.8 25 18.2 30 Q19 30.3 19.8 30 Q20.2 25 19.8 22 Q19 21.5 18.2 22" fill="#5a3c31" />
                    <circle cx="19" cy="24" r="0.3" fill="#8d6c51" opacity="0.45" />
                    <circle cx="18.8" cy="27.5" r="0.3" fill="#8d6c51" opacity="0.4" />
                    <path d="M28.2 24 Q27.8 27 28.2 32 Q29 32.3 29.8 32 Q30.2 27 29.8 24 Q29 23.5 28.2 24" fill="#5a3c31" />
                    <circle cx="29" cy="26" r="0.3" fill="#8d6c51" opacity="0.45" />
                    <circle cx="29.2" cy="29.5" r="0.3" fill="#8d6c51" opacity="0.4" />
                    <path d="M24 46 Q18 36 14 26 Q16 29 24 46" fill="#7a9a6a" opacity="0.8" />
                    <path d="M24 46 Q30 38 34 30 Q32 33 24 46" fill="#6a8a5a" opacity="0.8" />
                    <path d="M19 46 Q15 38 12 30 Q14 33 19 46" fill="#7a9a6a" opacity="0.8" />
                    <path d="M29 46 Q33 40 36 34 Q34 37 29 46" fill="#6a8a5a" opacity="0.8" />
                  </svg>
                  <div style={{ position: 'absolute', top: 8, right: 10, textAlign: 'right' }}>
                    <div style={{ fontSize: 9, fontFamily: 'system-ui', color: '#16a34a', opacity: 0.7 }}>uncommon</div>
                    <div style={{ fontSize: 7, fontFamily: 'system-ui', color: '#16a34a', opacity: 0.4 }}>12%</div>
                  </div>
                </div>
              ), bg: '#E0D7C1', h: cardH, rot: 0.5, br: '16px 14px 18px 12px' },
            ]
            const rightCards = [
              { label: 'inline ai', content: (
                <div style={{ width: '100%', height: '100%', padding: '10px 11px', fontFamily: 'Georgia, serif', fontSize: 6.5, color: '#4a4540', lineHeight: 1.7, overflow: 'hidden' }}>
                  <style>{`
                    @keyframes cvStrike { 0%,15% { width: 0 } 35% { width: 100% } 100% { width: 100% } }
                    @keyframes cvReplace { 0%,40% { opacity: 0; transform: translateY(4px) } 60%,100% { opacity: 1; transform: translateY(0) } }
                    @keyframes cvSpark { 0%,100% { opacity: 0.5 } 50% { opacity: 1 } }
                    @keyframes cvCursor { 0%,49% { opacity: 1 } 50%,100% { opacity: 0 } }
                  `}</style>
                  <div style={{ color: '#6b6560' }}>photosynthesis converts</div>
                  <div style={{ color: '#6b6560' }}>sunlight into energy. plants</div>
                  <div style={{ color: '#6b6560' }}>absorb CO₂ and release O₂.</div>
                  <div style={{ margin: '5px 0 3px', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="#d97706" style={{ animation: 'cvSpark 2s ease-in-out infinite', flexShrink: 0 }}>
                      <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
                    </svg>
                    <span style={{ fontSize: 5, color: '#d97706', fontWeight: 600 }}>rewriting...</span>
                  </div>
                  <div style={{ position: 'relative', margin: '0 0 3px' }}>
                    <span style={{ color: '#a09888', fontSize: 6 }}>this happens in the leaves</span>
                    <div style={{ position: 'absolute', top: '50%', left: 0, height: 0.8, background: '#d97706', opacity: 0.7, animation: 'cvStrike 5s ease-out infinite' }} />
                  </div>
                  <div style={{ padding: '3px 5px', borderRadius: 3, background: 'rgba(217,119,6,0.06)', borderLeft: '1.5px solid #d97706', animation: 'cvReplace 5s ease-out infinite' }}>
                    <span style={{ color: '#d97706', fontSize: 6 }}>the light-dependent reactions occur in the thylakoid membranes of chloroplasts</span>
                    <span style={{ display: 'inline-block', width: 1, height: 8, background: '#d97706', marginLeft: 1, verticalAlign: 'middle', animation: 'cvCursor 1s step-end infinite' }} />
                  </div>
                  <div style={{ color: '#6b6560', marginTop: 3 }}>the calvin cycle then fixes</div>
                  <div style={{ color: '#6b6560' }}>carbon into glucose.</div>
                </div>
              ), bg: '#cfc5b0', h: cardH, rot: 1, br: '20px 16px 14px 18px' },
              { label: 'focus timer', timer: true, bg: '#ccc3af', h: timerH, rot: -0.6, br: '16px 20px 18px 12px' },
              { label: 'stats', content: (
                <svg viewBox="0 0 130 130" width="140" height="140">
                  <defs>
                    <linearGradient id="cv-mult" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#fcd34d" />
                    </linearGradient>
                  </defs>
                  {[
                    { r: 58, color: '#c9a06c', pct: 0.92, sw: 5 },
                    { r: 47, color: '#d97706', pct: 0.93, sw: 5 },
                    { r: 36, color: '#78350f', pct: 1, sw: 5 },
                  ].map((ring, i) => {
                    const circ = 2 * Math.PI * ring.r
                    const gap = circ * 0.04
                    const track = circ - gap
                    const fill = track * ring.pct
                    return (
                      <g key={i}>
                        <circle cx="65" cy="65" r={ring.r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={ring.sw} strokeLinecap="round" strokeDasharray={`${track} ${gap}`} strokeDashoffset={-gap / 2} transform="rotate(-90 65 65)" />
                        <circle cx="65" cy="65" r={ring.r} fill="none" stroke={ring.color} strokeWidth={ring.sw} strokeLinecap="round" strokeDasharray={`${fill} ${circ - fill}`} transform={`rotate(${-90 + (gap / circ) * 180} 65 65)`} />
                      </g>
                    )
                  })}
                  <text x="65" y="63" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.03em', fill: 'url(#cv-mult)' }}>4.5x</text>
                  <text x="65" y="80" textAnchor="middle" style={{ fontSize: 8, fontFamily: 'Inter, system-ui, sans-serif', fill: '#a09888' }}>28d streak</text>
                </svg>
              ), bg: '#d9d0be', h: tallH, rot: 1.3, br: '14px 18px 20px 16px' },
            ]

            const leftTotal = leftCards.reduce((s, c) => s + c.h + gap, 0)
            const rightTotal = rightCards.reduce((s, c) => s + c.h + gap, 0)

            const renderCard = (card: { label: string; icon?: React.ReactNode; content?: React.ReactNode; bg: string; h: number; rot: number; br: string; timer?: boolean }, idx: number) => (
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
                ) : card.content ? (
                  card.content
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
                width: cardW * 2 + 60,
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
                  animation: `beltDown ${leftCards.length * 8}s linear infinite`,
                }}>
                  {leftCards.map((c, i) => renderCard(c, i))}
                  {leftCards.map((c, i) => renderCard(c, i + leftCards.length))}
                  {leftCards.map((c, i) => renderCard(c, i + leftCards.length * 2))}
                </div>

                {/* Right belt — scrolls UP */}
                <div style={{
                  position: 'absolute', right: 0, top: 0, width: cardW,
                  animation: `beltUp ${rightCards.length * 8}s linear infinite`,
                }}>
                  {rightCards.map((c, i) => renderCard(c, i))}
                  {rightCards.map((c, i) => renderCard(c, i + rightCards.length))}
                  {rightCards.map((c, i) => renderCard(c, i + rightCards.length * 2))}
                </div>
              </div>
            )
          })()}
        </div>

        {/* Cart of oranges — bottom left */}
        <div style={{
          position: 'absolute', bottom: -144, left: -110, pointerEvents: 'none',
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
            <circle cx="42" cy="34" r="7.5" fill="#e8940a" /><circle cx="42" cy="34" r="7.5" stroke="#c67e08" strokeWidth="0.8" fill="none" />
            <circle cx="56" cy="30" r="8.2" fill="#d97706" /><circle cx="56" cy="30" r="8.2" stroke="#b56a06" strokeWidth="0.8" fill="none" />
            <circle cx="69" cy="28" r="7" fill="#e8940a" /><circle cx="69" cy="28" r="7" stroke="#c67e08" strokeWidth="0.8" fill="none" />
            <circle cx="82" cy="27" r="8.5" fill="#d97706" /><circle cx="82" cy="27" r="8.5" stroke="#b56a06" strokeWidth="0.8" fill="none" />
            <circle cx="95" cy="28" r="7.2" fill="#e8940a" /><circle cx="95" cy="28" r="7.2" stroke="#c67e08" strokeWidth="0.8" fill="none" />
            <circle cx="106" cy="30" r="6.8" fill="#d97706" /><circle cx="106" cy="30" r="6.8" stroke="#b56a06" strokeWidth="0.8" fill="none" />
            <circle cx="48" cy="40" r="8" fill="#f0a020" /><circle cx="48" cy="40" r="8" stroke="#c67e08" strokeWidth="0.8" fill="none" />
            <circle cx="62" cy="37" r="7.3" fill="#e8940a" /><circle cx="62" cy="37" r="7.3" stroke="#c67e08" strokeWidth="0.8" fill="none" />
            <circle cx="76" cy="35" r="8.4" fill="#f0a020" /><circle cx="76" cy="35" r="8.4" stroke="#c67e08" strokeWidth="0.8" fill="none" />
            <circle cx="90" cy="36" r="6.8" fill="#e8940a" /><circle cx="90" cy="36" r="6.8" stroke="#c67e08" strokeWidth="0.8" fill="none" />
            <circle cx="102" cy="38" r="7.6" fill="#f0a020" /><circle cx="102" cy="38" r="7.6" stroke="#c67e08" strokeWidth="0.8" fill="none" />
            <circle cx="55" cy="44" r="7.2" fill="#d97706" /><circle cx="55" cy="44" r="7.2" stroke="#b56a06" strokeWidth="0.8" fill="none" />
            <circle cx="68" cy="42" r="6.5" fill="#e8940a" /><circle cx="68" cy="42" r="6.5" stroke="#c67e08" strokeWidth="0.8" fill="none" />
            <circle cx="83" cy="42" r="7.8" fill="#d97706" /><circle cx="83" cy="42" r="7.8" stroke="#b56a06" strokeWidth="0.8" fill="none" />
            <circle cx="96" cy="43" r="6.6" fill="#e8940a" /><circle cx="96" cy="43" r="6.6" stroke="#c67e08" strokeWidth="0.8" fill="none" />
            {/* Stems — varied but subtle */}
            <path d="M42 26 L42.5 24.5" stroke="#5a6b30" strokeWidth="0.7" strokeLinecap="round" />
            <path d="M42.5 24.5 Q45 24 44.5 26" fill="#6b7a3a" />
            <path d="M69 20 L68.5 19" stroke="#5a6b30" strokeWidth="0.6" strokeLinecap="round" />
            <path d="M68.5 19 Q66.5 18.5 67 20" fill="#6b7a3a" />
            <path d="M95 20 L95.5 18.5" stroke="#5a6b30" strokeWidth="0.7" strokeLinecap="round" />
            <path d="M95.5 18.5 Q97.5 18 97 19.5" fill="#7a8a44" />
            <path d="M56 23 L55.5 22" stroke="#5a6b30" strokeWidth="0.5" strokeLinecap="round" />
            <path d="M82 19.5 L82.5 18.5" stroke="#5a6b30" strokeWidth="0.6" strokeLinecap="round" />
            <path d="M82.5 18.5 Q84.5 18 84 19.5" fill="#6b7a3a" />
            <path d="M106 23 L106.5 22" stroke="#5a6b30" strokeWidth="0.5" strokeLinecap="round" />
            <path d="M106.5 22 Q108 21.5 107.5 23" fill="#7a8a44" />
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

            {/* Sleepy orange eyes easter egg — rightmost orange */}
            <style>{`
              @keyframes orangeEyes {
                0%, 70% { opacity: 0 }
                72% { opacity: 1 }
                74% { opacity: 1 }
                76% { opacity: 0.3 }
                78% { opacity: 1 }
                88% { opacity: 1 }
                90% { opacity: 0 }
                100% { opacity: 0 }
              }
              @keyframes orangeLookLeft {
                0%, 70% { transform: translateX(0) }
                80% { transform: translateX(-0.8px) }
                84% { transform: translateX(0.6px) }
                87% { transform: translateX(0) }
                100% { transform: translateX(0) }
              }
              @keyframes orangeLidTop {
                0%, 70% { transform: scaleY(0) }
                72% { transform: scaleY(0.3) }
                74% { transform: scaleY(1) }
                76% { transform: scaleY(0.5) }
                78% { transform: scaleY(1) }
                88% { transform: scaleY(1) }
                89% { transform: scaleY(0.4) }
                90% { transform: scaleY(0) }
                100% { transform: scaleY(0) }
              }
            `}</style>
            <g style={{ opacity: 0, animation: 'orangeEyes 12s ease 7s infinite, orangeLookLeft 12s ease 7s infinite', animationFillMode: 'backwards' }}>
              <ellipse cx="103.5" cy="29" rx="1" ry="1.3" fill="#3d2b1a" style={{ animation: 'orangeLidTop 12s ease 7s infinite', animationFillMode: 'backwards', transformOrigin: '103.5px 29px' }} />
              <ellipse cx="108.5" cy="29" rx="1" ry="1.3" fill="#3d2b1a" style={{ animation: 'orangeLidTop 12s ease 7s infinite', animationFillMode: 'backwards', transformOrigin: '108.5px 29px' }} />
            </g>
          </svg>
        </div>

        <style>{`@keyframes fadeIn { to { opacity: 1 } }
.cta-chevron { width: 32px; aspect-ratio: 1; transition: width 0.5s cubic-bezier(0.2,0.8,0.2,1) }
.cta-btn:hover .cta-label { opacity: 0 }
.cta-btn:hover .cta-chevron { width: calc(100% - 8px) }
.cta-btn:active .cta-chevron { transform: scale(0.95) }
.btn-pop { transition: transform 0.2s ease, box-shadow 0.2s ease }
.btn-pop:hover { transform: translateY(-1px); box-shadow: 0 3px 0 rgba(0,0,0,0.15), 0 6px 16px -2px rgba(234,88,12,0.3) }
.btn-pop:active { transform: translateY(1px); box-shadow: 0 1px 0 rgba(0,0,0,0.15) }`}</style>
      </section>

      {/* ===== Orchard expansion zone — overlaps hero bottom for seamless transition ===== */}
      <div ref={orchardSectionRef} style={{ height: '300vh', position: 'relative', marginTop: '-40vh' }}>
        <div style={{
          position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', userSelect: 'none',
        }}>
          {/* Fullscreen orchard terrain — fades in as user scrolls */}
          <div style={{
            position: 'relative', width: '100%', height: '100%',
            overflow: 'hidden',
            opacity: Math.min(1, Math.max(0, orchardProgress * 3)),
            transition: 'opacity 0.05s',
          }}>
            <LandingTerrain progress={orchardProgress} />

          {/* Overlay text — appears after all tree rows have scrolled in */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: '30vh',
            pointerEvents: 'none', zIndex: 100,
            opacity: orchardProgress > 0.05 ? Math.min(1, (orchardProgress - 0.05) * 4) : 0,
          }}>
            <div style={{
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(8px)',
              borderRadius: 12,
              padding: '36px 56px',
              border: '1px solid rgba(255,255,255,0.08)',
              textAlign: 'center', maxWidth: 560,
              transform: `translateY(${(1 - Math.min(1, orchardProgress > 0.05 ? (orchardProgress - 0.05) * 4 : 0)) * 30}px)`,
            }}>
              <h2 style={{
                fontFamily: serif, fontSize: 'clamp(2rem, 5vw, 3.6rem)', fontWeight: 400,
                color: '#fff', textTransform: 'lowercase', letterSpacing: '-0.03em',
                margin: '0 0 24px 0',
              }}>
                worth a thousand words.
              </h2>
              <p style={{
                fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.7)', textTransform: 'lowercase',
                margin: 0, lineHeight: 1.9,
              }}>
                every focus session plants a tree. give up and they die. also, each notebook has its own orchard — so you can see exactly where your time went.
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
              { value: 40, suffix: '+', label: 'species to grow' },
              { value: 0, suffix: '', label: 'ads, ever' },
              { value: -1, suffix: '∞', label: 'pages per notebook' },
              { value: 7, suffix: '', label: 'rarity tiers' },
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
                <span style={{ fontFamily: mono, fontSize: '0.75rem', letterSpacing: '0.12em', color: '#8a857e', textTransform: 'lowercase', marginTop: 8, display: 'block' }}>
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
                ['no focus tools', 'focus timer + growing orchards'],
                ['no consequences', 'real stakes — stay consistent or lose progress'],
                ['basic autocomplete', 'ai that knows your whole notebook'],
                ['stare at a boring page', 'leaderboards, rare trees, competitions'],
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
        <section id="features" ref={featuresRef} style={{ padding: '48px 80px 72px', scrollMarginTop: 80 }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28 }}>
              {FEATURES.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.06, ease: [0.2, 0.8, 0.2, 1] }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                >
                  {f.label === 'focus timer' ? (
                    <div style={{
                      width: '100%', aspectRatio: '4 / 3', borderRadius: 16,
                      border: '1px solid rgba(15,15,16,0.08)',
                      boxShadow: '0 12px 30px -18px rgba(0,0,0,0.25)',
                      overflow: 'hidden', background: 'linear-gradient(180deg, #1a1c22 0%, #141310 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ transform: 'scale(0.58)', transformOrigin: 'center' }}>
                        <DemoTimer serif={serif} dark />
                      </div>
                    </div>
                  ) : (
                    <FeatureShot src={FEATURE_IMAGES[i]} label={f.label} />
                  )}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ display: 'inline-flex', transform: 'scale(0.72)', transformOrigin: 'left center' }}>{f.icon}</span>
                      <h3 style={{ fontFamily: serif, fontSize: '1.15rem', fontWeight: 400, color: '#0f0f10', textTransform: 'lowercase', margin: 0, letterSpacing: '-0.02em' }}>
                        {f.label}
                      </h3>
                    </div>
                    <p style={{ fontFamily: serif, fontSize: '0.85rem', lineHeight: 1.55, color: '#6b6864', textTransform: 'lowercase', margin: 0 }}>
                      {f.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        {checkoutBusy === 'auto' && (
          <div role="status" aria-live="polite" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245,240,230,0.85)', backdropFilter: 'blur(4px)', fontFamily: 'var(--font-fraunces), serif', fontSize: '1.1rem', color: '#2a2620' }}>
            opening secure checkout…
          </div>
        )}
        <section id="pricing" style={{ padding: '48px 80px 64px', scrollMarginTop: 80 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 400, color: '#0f0f10', textAlign: 'center', margin: '0 0 12px 0', letterSpacing: '-0.02em' }}
            >
              simple pricing
            </motion.h2>
            <p style={{ fontFamily: serif, fontSize: '1rem', color: '#6b6864', textAlign: 'center', margin: '0 0 32px 0' }}>
              the whole orchard is free. plus makes the ai unlimited.
            </p>

            {/* Billing toggle */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 40px 0' }}>
              <div style={{
                display: 'flex', background: 'rgba(255,255,255,0.5)', borderRadius: 999,
                padding: 3, border: '1px solid rgba(0,0,0,0.06)',
              }}>
                {(['monthly', 'annual'] as const).map(period => (
                  <button
                    key={period}
                    onClick={() => setBillingPeriod(period)}
                    style={{
                      fontFamily: serif, fontSize: '0.85rem', padding: '7px 20px',
                      borderRadius: 999, border: 'none', cursor: 'pointer',
                      background: billingPeriod === period ? accent : 'transparent',
                      color: billingPeriod === period ? '#fff' : '#6b6864',
                      transition: 'all 0.25s ease',
                      position: 'relative',
                    }}
                  >
                    {period}
                    {period === 'annual' && <span style={{ fontSize: '0.65rem', color: billingPeriod === 'annual' ? '#a3e635' : '#16a34a', marginLeft: 4, fontWeight: 600 }}>save 29%</span>}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
              {/* Free tier */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                style={{
                  width: 320, padding: '36px 32px', borderRadius: 16,
                  background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.06)',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                <h3 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '1.4rem', fontWeight: 400, color: '#0f0f10', margin: '0 0 4px 0' }}>free</h3>
                <div style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '2.4rem', color: '#0f0f10', margin: '8px 0 4px 0' }}>
                  $0
                </div>
                <p style={{ fontFamily: serif, fontSize: '0.85rem', color: '#9a958e', margin: '0 0 24px 0' }}>forever</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {['unlimited notebooks + sync', 'focus timer, trees + the grove', 'every seed, achievement + party', 'recall practice', 'a daily taste of ai cards'].map(item => (
                    <li key={item} style={{ fontFamily: serif, fontSize: '0.9rem', color: '#6b6864', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Pro tier */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.25 }}
                style={{
                  width: 320, padding: '36px 32px', borderRadius: 16,
                  background: accent, border: `1px solid ${accent}`,
                  position: 'relative', overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  fontFamily: mono, fontSize: '0.6rem', letterSpacing: '0.1em',
                  padding: '3px 10px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.2)', color: '#fff',
}}>popular</div>
                <h3 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '1.4rem', fontWeight: 400, color: '#fff', margin: '0 0 4px 0' }}>plus</h3>
                <div style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '2.4rem', color: '#fff', margin: '8px 0 4px 0' }}>
                  {billingPeriod === 'monthly' && <>$7<span style={{ fontSize: '1rem', opacity: 0.7 }}>/mo</span></>}
                  {billingPeriod === 'annual' && <><span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.45)', fontSize: '1.4rem', marginRight: 8 }}>$84</span>$60<span style={{ fontSize: '1rem', opacity: 0.7 }}>/yr</span></>}
                </div>
                <p style={{ fontFamily: serif, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', margin: '0 0 8px 0' }}>
                  {billingPeriod === 'monthly' && 'billed monthly'}
                  {billingPeriod === 'annual' && <>$5/mo, billed yearly</>}
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {['everything in free', 'ai cards from every session', 'ai-graded answers', 'unlimited imports (docs, notion…)', 'unlimited writing ai'].map(item => (
                    <li key={item} style={{ fontFamily: serif, fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={() => goCheckout(billingPeriod === 'annual' ? 'plus_yearly' : 'plus_monthly')} disabled={!!checkoutBusy} style={{
                  fontFamily: 'var(--font-fraunces), serif', fontSize: '0.85rem',
                  padding: '10px 24px', borderRadius: 999, textDecoration: 'none', border: 'none', cursor: checkoutBusy ? 'default' : 'pointer',
                  background: 'linear-gradient(to bottom, #fff, #f0f0f0)', color: accent,
                  display: 'block', width: '100%', textAlign: 'center',
                  marginTop: 'auto', opacity: checkoutBusy ? 0.75 : 1,
                  boxShadow: '0 2px 0 rgba(0,0,0,0.15), 0 4px 8px -2px rgba(0,0,0,0.1)',
                }} className="btn-pop">{checkoutBusy ? 'opening checkout…' : 'upgrade now'}</button>
                {checkoutError && <p role="alert" style={{ fontFamily: serif, fontSize: '0.8rem', color: '#fff', margin: '8px 0 0', textAlign: 'center', opacity: 0.9 }}>{checkoutError}</p>}
              </motion.div>

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
                <a href="/app" style={{
                  fontFamily: mono, fontSize: '0.76rem', letterSpacing: '0.06em',
                  padding: '12px 32px', borderRadius: 8, textDecoration: 'none', textTransform: 'lowercase',
                  background: 'linear-gradient(to bottom, #e8a020, #d97706)', color: '#fff',
                  boxShadow: '0 2px 0 rgba(0,0,0,0.2), 0 4px 12px -2px rgba(234,88,12,0.35)',
                }} className="btn-pop">
                  try it — it's free
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
          padding: '80px 80px 140px',
          textAlign: 'center',
          background: 'rgba(0,0,0,0.03)',
          position: 'relative', overflow: 'hidden',
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
                { label: 'contact', href: 'mailto:pulpsupport@gmail.com' },
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
              fontFamily: serif, fontSize: '0.8rem', color: '#bdb9b2', textTransform: 'lowercase', margin: '0 0 40px 0',
            }}>
              © 2026 pulp.
            </p>
          </div>
          {/* Rolling hills */}
          <svg width="100%" height="120" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ display: 'block', position: 'absolute', bottom: 20, left: 0, right: 0 }}>
            <defs>
              <linearGradient id="fh1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3a5a28" />
                <stop offset="100%" stopColor="#2a4018" />
              </linearGradient>
              <linearGradient id="fh2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4a6a35" />
                <stop offset="100%" stopColor="#3a5525" />
              </linearGradient>
              <linearGradient id="fh3" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2d4a1e" />
                <stop offset="100%" stopColor="#1e3512" />
              </linearGradient>
            </defs>
            <path d="M0 90 Q150 40 300 70 Q450 95 600 55 Q750 25 900 65 Q1050 90 1200 50 L1200 120 L0 120Z" fill="url(#fh3)" opacity="0.4" />
            <path d="M0 80 Q200 50 400 75 Q550 90 700 60 Q850 35 1000 70 Q1100 85 1200 65 L1200 120 L0 120Z" fill="url(#fh1)" opacity="0.6" />
            <path d="M0 95 Q100 70 250 85 Q400 100 550 75 Q700 55 850 80 Q1000 95 1200 70 L1200 120 L0 120Z" fill="url(#fh2)" />
          </svg>
        </footer>
      </div>

      {modalType && <ReachOutModal type={modalType} onClose={() => setModalType(null)} />}
    </div>
  )
}
