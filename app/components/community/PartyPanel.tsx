"use client"
import { useState, useEffect, useCallback, memo } from "react"
import { getParty, createParty, joinParty, leaveParty, standings, hasJoinedBefore, PARTY_CAP, type Party } from "@/lib/party"
import { getFriends, addFriend, removeFriend, isOnline, type Friend } from "@/lib/friends"
import { PlantIcon } from "@/app/components/PlantIcon"

const accent = '#d97706'
const MEDALS = ['🥇', '🥈', '🥉']

function Dot({ on }: { on: boolean }) {
  return <span title={on ? 'online' : 'offline'} style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
    background: on ? '#22c55e' : '#71717a55', boxShadow: on ? '0 0 5px rgba(34,197,94,0.6)' : 'none' }} />
}

// ── Grove scene ───────────────────────────────────────────────────
// Each member is a tree that grows with this week's focus minutes.
const GROVE_SPECIES = ['oak', 'pine', 'sakura', 'birch', 'cypress', 'juniper', 'cedarwood', 'bonsai', 'plum', 'tangerine']
const speciesFor = (name: string) => {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return GROVE_SPECIES[h % GROVE_SPECIES.length]
}
const stageFor = (min: number) => (min <= 0 ? 0 : min < 25 ? 1 : min < 90 ? 2 : 3)
// Slot order fills from the middle out, so the leader stands center stage.
const centerOut = (n: number) => {
  const mid = Math.floor((n - 1) / 2)
  return Array.from({ length: n }, (_, i) => mid + (i % 2 ? -(i + 1) / 2 : i / 2))
}

const SCENE_CSS = `
@keyframes groveFirefly { 0%,100% { transform: translate(0,0); opacity: 0 } 20% { opacity: .9 } 50% { transform: translate(var(--dx), var(--dy)); opacity: .6 } 80% { opacity: .9 } }
@keyframes groveTwinkle { 0%,100% { opacity: .25 } 50% { opacity: .9 } }
@keyframes groveMist { 0% { transform: translateX(-6%) } 100% { transform: translateX(6%) } }
@keyframes groveRise { from { transform: translateY(10px) scale(.92); opacity: 0 } to { transform: none; opacity: 1 } }
@keyframes groveGlow { 0%,100% { opacity: .55 } 50% { opacity: .9 } }
@media (prefers-reduced-motion: reduce) { .grove-anim { animation: none !important } }
`

function GroveBackdrop({ isDark, height }: { isDark: boolean; height: number }) {
  const sky = isDark
    ? 'linear-gradient(180deg, #0b1a1a 0%, #10241f 45%, #16301f 100%)'
    : 'linear-gradient(180deg, #fde9c8 0%, #f3ecd2 40%, #dfe9cf 100%)'
  const hills = isDark ? ['#183a2a', '#12301f', '#0c2416'] : ['#c5dbb0', '#a9cc92', '#8fbd78']
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: sky }} />
      {/* Moon / sun */}
      <div style={{ position: 'absolute', top: 16, right: 28, width: 26, height: 26, borderRadius: '50%',
        background: isDark ? 'radial-gradient(circle at 35% 35%, #fff8e1, #f5deb3 70%)' : 'radial-gradient(circle, #fff4d6, #fbbf24 75%)',
        boxShadow: isDark ? '0 0 24px 6px rgba(253,230,138,0.18)' : '0 0 36px 12px rgba(251,191,36,0.35)' }} />
      {isDark && [[12, 18], [30, 10], [48, 24], [64, 12], [80, 30], [22, 34], [56, 6], [90, 16]].map(([x, y], i) => (
        <span key={i} className="grove-anim" style={{ position: 'absolute', left: `${x}%`, top: y, width: 2, height: 2, borderRadius: 1,
          background: '#fef3c7', animation: `groveTwinkle ${2.4 + (i % 3)}s ease-in-out ${i * 0.4}s infinite` }} />
      ))}
      <svg viewBox="0 0 400 120" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: height * 0.62 }}>
        <path d="M0 60 Q60 20 130 48 T260 40 T400 52 V120 H0Z" fill={hills[0]} />
        {/* distant pines */}
        {[18, 44, 70, 300, 332, 360, 384].map((x, i) => (
          <path key={i} d={`M${x} ${46 - (i % 3) * 4} l-7 18 h14z`} fill={hills[1]} opacity={0.9} />
        ))}
        <path d="M0 78 Q90 52 190 74 T400 70 V120 H0Z" fill={hills[1]} />
        <path d="M0 98 Q120 84 220 96 T400 92 V120 H0Z" fill={hills[2]} />
      </svg>
      <div className="grove-anim" style={{ position: 'absolute', left: '-10%', right: '-10%', bottom: height * 0.22, height: 34,
        background: isDark ? 'linear-gradient(90deg, transparent, rgba(167,243,208,0.07), transparent)' : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
        filter: 'blur(6px)', animation: 'groveMist 9s ease-in-out infinite alternate' }} />
      {isDark && Array.from({ length: 7 }, (_, i) => (
        <span key={i} className="grove-anim" style={{ position: 'absolute', left: `${8 + i * 13}%`, bottom: 26 + (i * 17) % 60, width: 3, height: 3, borderRadius: '50%',
          background: '#fde68a', boxShadow: '0 0 6px 2px rgba(253,230,138,0.6)',
          ['--dx' as string]: `${(i % 2 ? 1 : -1) * (8 + i * 2)}px`, ['--dy' as string]: `${-10 - (i % 3) * 6}px`,
          animation: `groveFirefly ${5 + (i % 3)}s ease-in-out ${i * 0.7}s infinite` } as React.CSSProperties} />
      ))}
    </>
  )
}

type GroveMember = { id: string; username: string; weeklyMinutes: number; rank: number; isYou?: boolean }
function PartyGrove({ members, cap, isDark }: { members: GroveMember[]; cap: number; isDark: boolean }) {
  const H = 210
  const slots = centerOut(cap)
  const label = isDark ? '#e7e5e4' : '#3f3a33'
  return (
    <div style={{ position: 'relative', height: H, borderRadius: 16, overflow: 'hidden', marginTop: 14,
      border: `1px solid ${isDark ? 'rgba(167,243,208,0.10)' : 'rgba(120,140,90,0.25)'}`,
      boxShadow: isDark ? 'inset 0 -30px 60px rgba(0,0,0,0.35), 0 10px 30px -12px rgba(0,0,0,0.6)' : 'inset 0 -20px 40px rgba(60,90,40,0.12), 0 10px 30px -14px rgba(80,60,20,0.35)' }}>
      <style>{SCENE_CSS}</style>
      <GroveBackdrop isDark={isDark} height={H} />
      {Array.from({ length: cap }, (_, i) => {
        const m = members[i]
        const left = `${((slots[i] + 0.5) / cap) * 100}%`
        if (!m) {
          return (
            <div key={`empty-${i}`} title="open plot — share the invite code" style={{ position: 'absolute', left, bottom: 26, transform: 'translateX(-50%)', textAlign: 'center' }}>
              <div style={{ width: 30, height: 9, borderRadius: '50%', margin: '0 auto',
                background: isDark ? 'rgba(120,83,48,0.55)' : 'rgba(120,83,48,0.35)', border: `1px dashed ${isDark ? 'rgba(253,230,138,0.25)' : 'rgba(120,83,48,0.45)'}` }} />
              <div style={{ fontSize: 10, color: isDark ? 'rgba(231,229,228,0.35)' : 'rgba(63,58,51,0.45)', marginTop: 4, letterSpacing: '0.06em' }}>open</div>
            </div>
          )
        }
        const stage = stageFor(m.weeklyMinutes)
        const size = 46 + stage * 13
        const lead = m.rank === 1 && m.weeklyMinutes > 0
        return (
          <div key={m.id} className="grove-anim" title={`@${m.username} · ${m.weeklyMinutes} min this week`}
            style={{ position: 'absolute', left, bottom: 18, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center',
              animation: `groveRise .7s cubic-bezier(.2,.8,.2,1) ${i * 0.08}s both` }}>
            <div style={{ position: 'relative' }}>
              {lead && <div className="grove-anim" style={{ position: 'absolute', inset: -10, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(253,230,138,0.45), transparent 65%)', animation: 'groveGlow 3s ease-in-out infinite' }} />}
              <PlantIcon type={speciesFor(m.username)} size={size} stage={stage} hideGround />
            </div>
            <div style={{ width: size * 0.55, height: 6, borderRadius: '50%', marginTop: -3, background: 'rgba(0,0,0,0.25)', filter: 'blur(2px)' }} />
            <div style={{ marginTop: 3, fontSize: 11, color: m.isYou ? accent : label, fontWeight: m.isYou ? 600 : 400, whiteSpace: 'nowrap',
              textShadow: isDark ? '0 1px 2px rgba(0,0,0,0.6)' : '0 1px 0 rgba(255,255,255,0.6)' }}>
              {lead ? '👑 ' : ''}{m.isYou ? 'you' : `@${m.username}`}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export const PartyPanel = memo(function PartyPanel({ theme }: { theme: "light" | "dark" }) {
  const isDark = theme === 'dark'
  const text = isDark ? '#fafafa' : '#0f0f10'
  const sub = '#8a857e'
  const rowBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'

  const [tab, setTab] = useState<'party' | 'friends'>('party')
  const [party, setParty] = useState<Party | null>(null)
  const [friends, setFriends] = useState<Friend[]>([])
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [friendInput, setFriendInput] = useState("")
  const [msg, setMsg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [, tick] = useState(0)

  const refresh = useCallback(() => { setParty(getParty()); setFriends(getFriends()) }, [])
  useEffect(() => {
    refresh()
    window.addEventListener('pulp-party-change', refresh)
    window.addEventListener('pulp-friends-change', refresh)
    // Re-render every 30s so online dots stay fresh.
    const t = setInterval(() => tick(n => n + 1), 30000)
    return () => { window.removeEventListener('pulp-party-change', refresh); window.removeEventListener('pulp-friends-change', refresh); clearInterval(t) }
  }, [refresh])

  const field = { padding: '9px 12px', borderRadius: 10, outline: 'none', fontFamily: 'Crimson Pro, serif', fontSize: 14,
    border: `1px solid ${isDark ? '#3f3f46' : '#e0dacb'}`, background: isDark ? '#0e0c09' : '#fff', color: text } as const
  const btn = (enabled = true) => ({ padding: '10px 16px', borderRadius: 10, border: 'none', cursor: enabled ? 'pointer' : 'default',
    background: accent, color: '#fff', fontFamily: 'Crimson Pro, serif', fontSize: 14, opacity: enabled ? 1 : 0.5 } as const)

  const Tabs = (
    <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
      {(['party', 'friends'] as const).map(t => (
        <button key={t} onClick={() => { setTab(t); setMsg(null) }}
          style={{ padding: '5px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', textTransform: 'capitalize', fontFamily: 'Crimson Pro, serif', fontSize: 14,
            background: tab === t ? accent : 'transparent', color: tab === t ? '#fff' : sub }}>{t}</button>
      ))}
    </div>
  )

  // ── FRIENDS TAB ───────────────────────────────────────────────────
  if (tab === 'friends') {
    const add = () => { const r = addFriend(friendInput); setMsg(r.ok ? null : r.error); if (r.ok) setFriendInput("") }
    const onlineCount = friends.filter(f => isOnline(f.username)).length

    return (
      <div style={{ padding: 24, fontFamily: 'Crimson Pro, serif' }}>
        {Tabs}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <h2 style={{ color: text, fontSize: 20, margin: 0 }}>Friends</h2>
          <span style={{ color: sub, fontSize: 13 }}>{onlineCount} online</span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <input value={friendInput} onChange={e => setFriendInput(e.target.value)} placeholder="@username"
            style={{ ...field, flex: 1 }} onKeyDown={e => { if (e.key === 'Enter') add() }} />
          <button onClick={add} disabled={!friendInput.trim()} style={btn(!!friendInput.trim())}>Add</button>
        </div>
        {msg && <p style={{ color: '#ef4444', fontSize: 13, margin: '8px 2px 0' }}>{msg}</p>}

        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {friends.length === 0 && <p style={{ color: sub, fontSize: 14 }}>No friends yet — add someone by @username.</p>}
          {friends.map(f => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: rowBg, color: text }}>
              <Dot on={isOnline(f.username)} />
              <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: f.color,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                {f.username[0]?.toUpperCase()}
              </span>
              <span style={{ fontSize: 15 }}>@{f.username}</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: isOnline(f.username) ? '#22c55e' : sub }}>{isOnline(f.username) ? 'online' : 'offline'}</span>
              <button onClick={() => removeFriend(f.id)} title="remove" style={{ border: 'none', background: 'none', cursor: 'pointer', color: sub, fontSize: 16, lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── PARTY TAB: empty state ────────────────────────────────────────
  if (!party) {
    const firstTime = !hasJoinedBefore()
    return (
      <div style={{ padding: 24, fontFamily: 'Crimson Pro, serif' }}>
        {Tabs}

        {firstTime && (
          <div style={{ marginBottom: 20, padding: '16px 18px', borderRadius: 14, textAlign: 'center',
            background: isDark ? 'rgba(217,119,6,0.10)' : 'rgba(217,119,6,0.08)',
            border: `1px solid ${isDark ? 'rgba(217,119,6,0.22)' : 'rgba(217,119,6,0.18)'}` }}>
            <div style={{ position: 'relative', height: 110, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
              <style>{SCENE_CSS}</style>
              <GroveBackdrop isDark={isDark} height={110} />
              {[['sakura', 1, 30], ['oak', 3, 50], ['pine', 2, 70]].map(([type, stage, x], i) => (
                <div key={i} className="grove-anim" style={{ position: 'absolute', left: `${x}%`, bottom: 8, transform: 'translateX(-50%)',
                  animation: `groveRise .8s cubic-bezier(.2,.8,.2,1) ${i * 0.15}s both` }}>
                  <PlantIcon type={type as string} size={40 + (stage as number) * 10} stage={stage as number} hideGround />
                </div>
              ))}
            </div>
            <h2 style={{ color: text, fontSize: 19, margin: '0 0 6px' }}>Grow together 🌳</h2>
            <p style={{ color: sub, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
              A party is you + up to {PARTY_CAP} friends racing on <b style={{ color: accent }}>focus minutes</b> each week.
              Study more, climb the list, bragging rights reset every Monday.
            </p>
          </div>
        )}

        <h2 style={{ color: text, fontSize: 20, margin: '0 0 4px' }}>{firstTime ? 'Make your first party' : 'Start a party'}</h2>
        <p style={{ color: sub, fontSize: 14, margin: '0 0 20px' }}>Race friends on focus minutes this week. Up to {PARTY_CAP} players.</p>

        <h3 style={{ color: text, fontSize: 14, margin: '0 0 8px' }}>Create</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="party name" maxLength={24}
            style={{ ...field, flex: 1 }} onKeyDown={e => { if (e.key === 'Enter' && name.trim().length >= 2) createParty(name) }} />
          <button onClick={() => createParty(name)} disabled={name.trim().length < 2} style={btn(name.trim().length >= 2)}>Create</button>
        </div>

        <h3 style={{ color: text, fontSize: 14, margin: '0 0 8px' }}>Join by code</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="invite code" maxLength={8}
            style={{ ...field, flex: 1, textTransform: 'uppercase' }} onKeyDown={e => { if (e.key === 'Enter' && code.trim()) joinParty(code) }} />
          <button onClick={() => joinParty(code)} disabled={!code.trim()} style={btn(!!code.trim())}>Join</button>
        </div>
      </div>
    )
  }

  // ── PARTY TAB: in a party ─────────────────────────────────────────
  const rows = standings(party)
  const onlineCount = party.members.filter(m => isOnline(m.username)).length
  const copy = () => { navigator.clipboard?.writeText(party.code); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  const maxMinutes = Math.max(0, ...rows.map(r => r.weeklyMinutes))

  return (
    <div style={{ padding: 24, fontFamily: 'Crimson Pro, serif' }}>
      {Tabs}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ color: text, fontSize: 20, margin: 0 }}>{party.name}</h2>
        <span style={{ color: sub, fontSize: 13 }}>{party.members.length}/{PARTY_CAP} · {onlineCount} online</span>
      </div>

      <button onClick={copy} title="copy invite code"
        style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
          border: `1px dashed ${isDark ? '#3f3f46' : '#d8d2c4'}`, background: 'transparent', color: text }}>
        <span style={{ color: sub, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>invite</span>
        <span style={{ color: accent, fontSize: 15, letterSpacing: '0.15em', fontWeight: 600 }}>{party.code}</span>
        <span style={{ color: sub, fontSize: 12 }}>{copied ? '✓ copied' : '⧉'}</span>
      </button>

      <PartyGrove members={rows} cap={PARTY_CAP} isDark={isDark} />

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map(m => {
          const top = m.rank <= 3
          const pct = maxMinutes > 0 ? Math.round((m.weeklyMinutes / maxMinutes) * 100) : 0
          return (
            <div key={m.id} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px 13px', borderRadius: 12,
              background: m.isYou ? 'rgba(217,119,6,0.12)' : rowBg,
              border: m.isYou ? `1px solid rgba(217,119,6,0.35)` : '1px solid transparent', color: text }}>
              <span style={{ width: 22, textAlign: 'center', fontSize: top ? 16 : 13, color: sub }}>{top ? MEDALS[m.rank - 1] : m.rank}</span>
              <Dot on={isOnline(m.username)} />
              <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: m.color,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                {m.username[0]?.toUpperCase()}
              </span>
              <span style={{ fontSize: 15 }}>@{m.username}{m.isYou ? ' (you)' : ''}{m.isOwner ? ' 👑' : ''}</span>
              <span style={{ marginLeft: 'auto', color: accent, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{m.weeklyMinutes} min</span>
              <span style={{ position: 'absolute', left: 14, right: 14, bottom: 5, height: 2, borderRadius: 1, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                <span style={{ display: 'block', height: '100%', width: `${pct}%`, borderRadius: 1, transition: 'width .6s ease',
                  background: 'linear-gradient(90deg, #4d7c0f, #65a30d 60%, #d97706)' }} />
              </span>
            </div>
          )
        })}
      </div>

      <button onClick={() => { if (confirm('Leave this party?')) leaveParty() }}
        style={{ marginTop: 18, color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'Crimson Pro, serif', fontSize: 14 }}>
        Leave party
      </button>
    </div>
  )
})
