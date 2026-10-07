"use client"
import { useState, useEffect, useCallback, useRef, memo } from "react"
import { loadParty, createParty, joinParty, cancelJoin, answerRequest, leaveParty, standings, hasJoinedBefore, PARTY_CAP, type PartyState } from "@/lib/party"
import { loadFriends, addFriend, answerFriend, removeFriend, type FriendsState, type Friend } from "@/lib/friends"
import { PlantIcon } from "@/app/components/PlantIcon"
import { usePartyPresence } from "./PartyPresence"
import { useGroveStore } from "@/app/store/useGroveStore"
import { TREE_TYPES } from "@/app/constants"
import { getWeekStart } from "@/lib/leagues"
import { ACCENT, ACCENT_CONTRAST, accentAlpha } from "@/lib/accent"

const accent = ACCENT
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

export const SCENE_CSS = `
@keyframes groveFirefly { 0%,100% { transform: translate(0,0); opacity: 0 } 20% { opacity: .9 } 50% { transform: translate(var(--dx), var(--dy)); opacity: .6 } 80% { opacity: .9 } }
@keyframes groveTwinkle { 0%,100% { opacity: .25 } 50% { opacity: .9 } }
@keyframes groveMist { 0% { transform: translateX(-6%) } 100% { transform: translateX(6%) } }
@keyframes groveRise { from { transform: translateY(10px) scale(.92); opacity: 0 } to { transform: none; opacity: 1 } }
@keyframes groveGlow { 0%,100% { opacity: .55 } 50% { opacity: .9 } }
@keyframes groveFocus { 0%,100% { transform: scale(.92); opacity: .45 } 50% { transform: scale(1.08); opacity: .95 } }
@keyframes groveBurst { 0% { transform: translate(0,0) scale(.6); opacity: 1 } 100% { transform: translate(var(--dx), var(--dy)) scale(1); opacity: 0 } }
@media (prefers-reduced-motion: reduce) { .grove-anim { animation: none !important } }
`

export function GroveBackdrop({ isDark, height }: { isDark: boolean; height: number }) {
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
// focusLeft: user id -> minutes left in their running focus session.
function PartyGrove({ members, cap, isDark, focusLeft }: { members: GroveMember[]; cap: number; isDark: boolean; focusLeft: Record<string, number> }) {
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
        const minsLeft = focusLeft[m.id]
        const focusing = minsLeft != null
        return (
          <div key={m.id} className="grove-anim" title={`@${m.username} · ${m.weeklyMinutes} min this week`}
            style={{ position: 'absolute', left, bottom: 18, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center',
              animation: `groveRise .7s cubic-bezier(.2,.8,.2,1) ${i * 0.08}s both` }}>
            <div style={{ position: 'relative' }}>
              {focusing && <div className="grove-anim" style={{ position: 'absolute', inset: -12, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(52,211,153,0.40), rgba(52,211,153,0.10) 55%, transparent 70%)',
                animation: 'groveFocus 2.4s ease-in-out infinite' }} />}
              {lead && <div className="grove-anim" style={{ position: 'absolute', inset: -10, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(253,230,138,0.45), transparent 65%)', animation: 'groveGlow 3s ease-in-out infinite' }} />}
              <PlantIcon type={speciesFor(m.username)} size={size} stage={stage} hideGround />
            </div>
            <div style={{ width: size * 0.55, height: 6, borderRadius: '50%', marginTop: -3, background: 'rgba(0,0,0,0.25)', filter: 'blur(2px)' }} />
            <div style={{ marginTop: 3, fontSize: 11, color: m.isYou ? accent : label, fontWeight: m.isYou ? 600 : 400, whiteSpace: 'nowrap',
              textShadow: isDark ? '0 1px 2px rgba(0,0,0,0.6)' : '0 1px 0 rgba(255,255,255,0.6)' }}>
              {lead ? '👑 ' : ''}{m.isYou ? 'you' : `@${m.username}`}
            </div>
            {focusing && (
              <div style={{ fontSize: 10, color: '#34d399', whiteSpace: 'nowrap', marginTop: 1, letterSpacing: '0.02em' }}>
                focusing{minsLeft > 0 ? ` · ${minsLeft}m` : ''}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Shared weekly goal ───────────────────────────────────────────
// Everyone's minutes count toward one target; hitting it unlocks a rare seed
// for each member (claimed once per party per week).
const GOAL_PER_MEMBER = 90
const RARE_SEEDS = Object.keys(TREE_TYPES).filter(k => TREE_TYPES[k].rarity === 'rare')
const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m`)

function PartyGoal({ partyId, total, members, isDark, text, sub }: { partyId: number; total: number; members: number; isDark: boolean; text: string; sub: string }) {
  const goal = GOAL_PER_MEMBER * Math.max(1, members)
  const pct = Math.min(100, Math.round((total / goal) * 100))
  const done = total >= goal
  const claimKey = `pulp-party-reward:${partyId}:${getWeekStart()}`
  const [claimed, setClaimed] = useState<string | null>(() => {
    try { return typeof window === 'undefined' ? null : localStorage.getItem(claimKey) } catch { return null }
  })
  const claim = () => {
    const seed = RARE_SEEDS[Math.floor(Math.random() * RARE_SEEDS.length)] || 'cypress'
    useGroveStore.getState().setInventory(prev => [...prev, seed])
    try { localStorage.setItem(claimKey, seed) } catch {}
    setClaimed(seed)
  }
  return (
    <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 12, position: 'relative', overflow: 'hidden',
      background: done ? (isDark ? 'rgba(52,211,153,0.08)' : 'rgba(16,185,129,0.07)') : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
      border: `1px solid ${done ? 'rgba(52,211,153,0.30)' : 'transparent'}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ color: text, fontSize: 14 }}>{done ? 'Party goal reached 🎉' : 'Party goal'}</span>
        <span style={{ color: sub, fontSize: 12 }}>{fmtMin(GOAL_PER_MEMBER)} each, together</span>
        <span style={{ marginLeft: 'auto', color: done ? '#34d399' : accent, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{fmtMin(total)} / {fmtMin(goal)}</span>
      </div>
      <div style={{ marginTop: 8, height: 8, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, transition: 'width .8s cubic-bezier(.2,.8,.2,1)',
          background: done ? 'linear-gradient(90deg, #059669, #34d399)' : `linear-gradient(90deg, #4d7c0f, #65a30d 55%, ${ACCENT})` }} />
      </div>
      {done && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          {claimed ? (
            <>
              <PlantIcon type={claimed} size={28} stage={0} isSeed hideGround />
              <span style={{ color: sub, fontSize: 13 }}>You got a <b style={{ color: text }}>{TREE_TYPES[claimed]?.name || claimed}</b> seed this week.</span>
            </>
          ) : (
            <>
              <span style={{ color: sub, fontSize: 13 }}>Everyone gets a rare seed.</span>
              <button onClick={claim} style={{ marginLeft: 'auto', position: 'relative', padding: '7px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', fontFamily: 'Crimson Pro, serif', fontSize: 14 }}>
                Claim seed
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <span key={i} className="grove-anim" style={{ position: 'absolute', left: '50%', top: '50%', width: 4, height: 4, borderRadius: 2, background: '#a7f3d0',
                    ['--dx' as string]: `${Math.cos(i) * 26}px`, ['--dy' as string]: `${Math.sin(i) * 18}px`,
                    animation: `groveBurst 1.6s ease-out ${i * 0.12}s infinite` } as React.CSSProperties} />
                ))}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: color,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>
      {name[0]?.toUpperCase()}
    </span>
  )
}

export const PartyPanel = memo(function PartyPanel({ theme }: { theme: "light" | "dark" }) {
  const isDark = theme === 'dark'
  const text = isDark ? '#fafafa' : '#0f0f10'
  const sub = '#8a857e'
  const rowBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'

  const [tab, setTab] = useState<'party' | 'friends'>('party')
  const [party, setParty] = useState<PartyState | null>(null)
  const [friends, setFriends] = useState<FriendsState | null>(null)
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [friendInput, setFriendInput] = useState("")
  const [msg, setMsg] = useState<{ text: string; ok?: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  // Loads can overlap (poll + action); only the newest one may set state.
  const partySeq = useRef(0)
  const friendsSeq = useRef(0)
  const refreshParty = useCallback(() => {
    const seq = ++partySeq.current
    loadParty().then(s => { if (seq === partySeq.current) setParty(s) }).catch(e => setMsg({ text: e.message }))
  }, [])
  const refreshFriends = useCallback(() => {
    const seq = ++friendsSeq.current
    loadFriends().then(s => { if (seq === friendsSeq.current) setFriends(s) }).catch(e => setMsg({ text: e.message }))
  }, [])

  useEffect(() => {
    const first = setTimeout(() => { refreshParty(); refreshFriends() }, 0)
    window.addEventListener('pulp-party-change', refreshParty)
    window.addEventListener('pulp-friends-change', refreshFriends)
    // Pick up new minutes, approvals and friend requests while open.
    const poll = setInterval(() => { refreshParty(); refreshFriends() }, 20000)
    return () => {
      clearTimeout(first); clearInterval(poll)
      window.removeEventListener('pulp-party-change', refreshParty)
      window.removeEventListener('pulp-friends-change', refreshFriends)
    }
  }, [refreshParty, refreshFriends])

  const inParty = party?.kind === 'in' ? party : null
  const presence = usePartyPresence()
  const peers = presence.groupId === inParty?.party.id ? presence.peers : {}
  const online = (id: string) => !!peers[id] || id === inParty?.me.id

  // Run an action, show its error inline, keep buttons from double-firing.
  const run = async (fn: () => Promise<unknown>, success?: string) => {
    setBusy(true); setMsg(null)
    try { await fn(); if (success) setMsg({ text: success, ok: true }) }
    catch (e) { setMsg({ text: e instanceof Error ? e.message : 'Something went wrong' }) }
    finally { setBusy(false) }
  }

  const field = { padding: '9px 12px', borderRadius: 10, outline: 'none', fontFamily: 'Crimson Pro, serif', fontSize: 14,
    border: `1px solid ${isDark ? '#3f3f46' : '#e0dacb'}`, background: isDark ? '#0e0c09' : '#fff', color: text } as const
  const btn = (enabled = true) => ({ padding: '10px 16px', borderRadius: 10, border: 'none', cursor: enabled ? 'pointer' : 'default',
    background: accent, color: ACCENT_CONTRAST, fontFamily: 'Crimson Pro, serif', fontSize: 14, opacity: enabled ? 1 : 0.5 } as const)
  const ghostBtn = { padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Crimson Pro, serif', fontSize: 13,
    border: `1px solid ${isDark ? '#3f3f46' : '#e0dacb'}`, background: 'transparent', color: text } as const

  const Tabs = (
    <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
      {(['party', 'friends'] as const).map(t => (
        <button key={t} onClick={() => { setTab(t); setMsg(null) }}
          style={{ padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'Crimson Pro, serif', fontSize: 14, textTransform: 'capitalize',
            background: tab === t ? accent : 'transparent', color: tab === t ? ACCENT_CONTRAST : sub }}>{t}</button>
      ))}
    </div>
  )
  const Msg = msg && <p style={{ color: msg.ok ? '#22c55e' : '#ef4444', fontSize: 13, margin: '10px 2px 0' }}>{msg.text}</p>

  const SignIn = (what: string) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', height: 110, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
        <style>{SCENE_CSS}</style>
        <GroveBackdrop isDark={isDark} height={110} />
      </div>
      <p style={{ color: sub, fontSize: 15, margin: '0 0 14px' }}>Sign in to {what}.</p>
      <button onClick={() => { window.location.href = '/login' }} style={btn()}>Sign in</button>
    </div>
  )
  const Loading = <p style={{ color: sub, fontSize: 14 }}>Loading…</p>

  // ── FRIENDS TAB ───────────────────────────────────────────────────
  if (tab === 'friends') {
    const add = () => run(async () => {
      const r = await addFriend(friendInput)
      setFriendInput("")
      setMsg({ text: r === 'accepted' ? 'You are now friends.' : 'Request sent.', ok: true })
    })
    const FriendRow = ({ f, children }: { f: Friend; children: React.ReactNode }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: rowBg, color: text }}>
        <Avatar name={f.username} color={f.color} />
        <span style={{ fontSize: 15 }}>@{f.username}</span>
        {f.level != null && <span style={{ fontSize: 12, color: sub }}>lv {f.level}</span>}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>{children}</span>
      </div>
    )
    return (
      <div style={{ padding: 24, fontFamily: 'Crimson Pro, serif' }}>
        {Tabs}
        {!friends ? Loading : friends.kind === 'signed-out' ? SignIn('add friends') : (
          <>
            <h2 style={{ color: text, fontSize: 20, margin: 0 }}>Friends</h2>
            <p style={{ color: sub, fontSize: 13, margin: '4px 0 0' }}>
              {friends.me ? <>Friends can add you as <b style={{ color: accent }}>@{friends.me}</b></> : 'Set a username in settings so friends can find you.'}
            </p>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <input value={friendInput} onChange={e => setFriendInput(e.target.value)} placeholder="@username"
                style={{ ...field, flex: 1 }} onKeyDown={e => { if (e.key === 'Enter' && friendInput.trim() && !busy) add() }} />
              <button onClick={add} disabled={!friendInput.trim() || busy} style={btn(!!friendInput.trim() && !busy)}>Add</button>
            </div>
            {Msg}

            {friends.incoming.length > 0 && (
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <h3 style={{ color: text, fontSize: 14, margin: '0 0 2px' }}>Requests</h3>
                {friends.incoming.map(f => (
                  <FriendRow key={f.friendshipId} f={f}>
                    <button disabled={busy} onClick={() => run(() => answerFriend(f.friendshipId, true))} style={{ ...btn(!busy), padding: '6px 12px', fontSize: 13 }}>Accept</button>
                    <button disabled={busy} onClick={() => run(() => answerFriend(f.friendshipId, false))} style={ghostBtn}>Decline</button>
                  </FriendRow>
                ))}
              </div>
            )}

            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {friends.friends.length === 0 && <p style={{ color: sub, fontSize: 14, margin: 0 }}>No friends yet — add someone by @username.</p>}
              {friends.friends.map(f => (
                <FriendRow key={f.friendshipId} f={f}>
                  <button disabled={busy} onClick={() => { if (confirm(`Remove @${f.username}?`)) run(() => removeFriend(f.friendshipId)) }} title="remove"
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: sub, fontSize: 16, lineHeight: 1 }}>×</button>
                </FriendRow>
              ))}
              {friends.outgoing.map(f => (
                <FriendRow key={f.friendshipId} f={f}>
                  <span style={{ fontSize: 12, color: sub }}>requested</span>
                  <button disabled={busy} onClick={() => run(() => removeFriend(f.friendshipId))} title="cancel request"
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: sub, fontSize: 16, lineHeight: 1 }}>×</button>
                </FriendRow>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  // ── PARTY TAB ─────────────────────────────────────────────────────
  if (!party) return <div style={{ padding: 24, fontFamily: 'Crimson Pro, serif' }}>{Tabs}{Loading}</div>
  if (party.kind === 'signed-out') return <div style={{ padding: 24, fontFamily: 'Crimson Pro, serif' }}>{Tabs}{SignIn('start a party with friends')}</div>

  if (party.kind === 'pending') {
    return (
      <div style={{ padding: 24, fontFamily: 'Crimson Pro, serif' }}>
        {Tabs}
        <div style={{ position: 'relative', height: 110, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
          <style>{SCENE_CSS}</style>
          <GroveBackdrop isDark={isDark} height={110} />
        </div>
        <h2 style={{ color: text, fontSize: 20, margin: '0 0 6px' }}>Waiting to be let in</h2>
        <p style={{ color: sub, fontSize: 14, margin: '0 0 16px' }}>
          You asked to join <b style={{ color: accent, letterSpacing: '0.1em' }}>{party.code}</b>. The party owner needs to accept you.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button disabled={busy} onClick={() => run(async () => { refreshParty() })} style={btn(!busy)}>Check again</button>
          <button disabled={busy} onClick={() => run(cancelJoin)} style={ghostBtn}>Cancel request</button>
        </div>
        {Msg}
      </div>
    )
  }

  if (party.kind === 'none') {
    const firstTime = !hasJoinedBefore()
    const create = () => run(async () => { await createParty(name); setName(""); setMode('choose') })
    const join = () => run(async () => { await joinParty(code); setCode(""); setMode('choose') })
    const choice = (label: string, hint: string, primary: boolean, onClick: () => void) => (
      <button onClick={onClick}
        style={{ flex: 1, padding: '16px 14px', borderRadius: 14, cursor: 'pointer', textAlign: 'left', fontFamily: 'Crimson Pro, serif',
          border: primary ? 'none' : `1px solid ${isDark ? '#3f3f46' : '#e0dacb'}`,
          background: primary ? `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 82%, #000))` : 'transparent',
          color: primary ? ACCENT_CONTRAST : text, boxShadow: primary ? `0 8px 20px -10px ${accentAlpha(0.7)}` : 'none' }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 12.5, opacity: 0.8, marginTop: 2 }}>{hint}</div>
      </button>
    )
    return (
      <div style={{ padding: 24, fontFamily: 'Crimson Pro, serif' }}>
        {Tabs}
        <div style={{ marginBottom: 20, padding: '16px 18px', borderRadius: 14, textAlign: 'center',
          background: accentAlpha(isDark ? 0.10 : 0.08),
          border: `1px solid ${accentAlpha(isDark ? 0.22 : 0.18)}` }}>
          <div style={{ position: 'relative', height: 110, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
            <style>{SCENE_CSS}</style>
            <GroveBackdrop isDark={isDark} height={110} />
            {([['sakura', 1, 30], ['oak', 3, 50], ['pine', 2, 70]] as const).map(([type, stage, x], i) => (
              <div key={i} className="grove-anim" style={{ position: 'absolute', left: `${x}%`, bottom: 8, transform: 'translateX(-50%)',
                animation: `groveRise .8s cubic-bezier(.2,.8,.2,1) ${i * 0.15}s both` }}>
                <PlantIcon type={type} size={40 + stage * 10} stage={stage} hideGround />
              </div>
            ))}
          </div>
          <h2 style={{ color: text, fontSize: 19, margin: '0 0 6px' }}>{firstTime ? 'Grow together 🌳' : 'Start a new party'}</h2>
          <p style={{ color: sub, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
            Race up to {PARTY_CAP} players on <b style={{ color: accent }}>focus minutes</b> each week. Study more, climb the list — standings reset every Monday.
          </p>
        </div>

        {mode === 'choose' && (
          <div style={{ display: 'flex', gap: 10 }}>
            {choice('Create a party', "You'll get an invite code", true, () => { setMode('create'); setMsg(null) })}
            {choice('Join a party', 'Got a code from a friend?', false, () => { setMode('join'); setMsg(null) })}
          </div>
        )}
        {mode === 'create' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="party name" maxLength={24}
              style={{ ...field, flex: 1 }} onKeyDown={e => { if (e.key === 'Enter' && name.trim().length >= 2 && !busy) create(); if (e.key === 'Escape') setMode('choose') }} />
            <button onClick={create} disabled={name.trim().length < 2 || busy} style={btn(name.trim().length >= 2 && !busy)}>Create</button>
          </div>
        )}
        {mode === 'join' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <input autoFocus value={code} onChange={e => setCode(e.target.value)} placeholder="invite code" maxLength={8}
              style={{ ...field, flex: 1, textTransform: 'uppercase', letterSpacing: '0.1em' }}
              onKeyDown={e => { if (e.key === 'Enter' && code.trim() && !busy) join(); if (e.key === 'Escape') setMode('choose') }} />
            <button onClick={join} disabled={!code.trim() || busy} style={btn(!!code.trim() && !busy)}>Join</button>
          </div>
        )}
        {mode !== 'choose' && (
          <button onClick={() => { setMode('choose'); setMsg(null) }}
            style={{ marginTop: 10, border: 'none', background: 'none', cursor: 'pointer', color: sub, fontFamily: 'Crimson Pro, serif', fontSize: 13, padding: 0 }}>← back</button>
        )}
        {Msg}
      </div>
    )
  }

  // ── PARTY TAB: in a party ─────────────────────────────────────────
  const p = party.party
  const rows = standings(p)
  const onlineCount = p.members.filter(m => online(m.id)).length
  // Minutes left for anyone mid-session (0 once their timer runs out).
  const focusLeft: Record<string, number> = {}
  for (const m of p.members) {
    const peer = peers[m.id]
    if (peer?.status === 'focusing') focusLeft[m.id] = peer.timer_end ? Math.max(0, Math.ceil((peer.timer_end - Date.now()) / 60000)) : 0
  }
  const focusingCount = Object.keys(focusLeft).length
  const weekTotal = p.members.reduce((sum, m) => sum + m.weeklyMinutes, 0)
  const inviteLink = typeof window === 'undefined' ? '' : `${window.location.origin}/join/${p.code}`
  const copyLink = () => { navigator.clipboard?.writeText(inviteLink); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 1500) }
  const maxMinutes = Math.max(0, ...rows.map(r => r.weeklyMinutes))
  const copy = () => { navigator.clipboard?.writeText(p.code); setCopied(true); setTimeout(() => setCopied(false), 1500) }

  return (
    <div style={{ padding: 24, fontFamily: 'Crimson Pro, serif' }}>
      {Tabs}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ color: text, fontSize: 20, margin: 0 }}>{p.name}</h2>
        <span style={{ color: sub, fontSize: 13 }}>{p.members.length}/{PARTY_CAP} · {onlineCount} online{focusingCount ? <> · <span style={{ color: '#34d399' }}>{focusingCount} focusing</span></> : null}</span>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <button onClick={copy} title="copy invite code"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
          border: `1px dashed ${isDark ? '#3f3f46' : '#d8d2c4'}`, background: 'transparent', color: text }}>
        <span style={{ color: sub, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>invite</span>
        <span style={{ color: accent, fontSize: 15, letterSpacing: '0.15em', fontWeight: 600 }}>{p.code}</span>
        <span style={{ color: sub, fontSize: 12 }}>{copied ? '✓ copied' : '⧉'}</span>
      </button>
      {p.members.length < PARTY_CAP && (
        <button onClick={copyLink} title={inviteLink}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, cursor: 'pointer', border: 'none',
            background: linkCopied ? 'rgba(52,211,153,0.15)' : accentAlpha(0.12), color: linkCopied ? '#34d399' : accent, fontFamily: 'Crimson Pro, serif', fontSize: 14 }}>
          {linkCopied ? '✓ link copied' : '🔗 copy invite link'}
        </button>
      )}
      </div>

      <PartyGrove members={rows} cap={PARTY_CAP} isDark={isDark} focusLeft={focusLeft} />

      <PartyGoal key={p.id} partyId={p.id} total={weekTotal} members={p.members.length} isDark={isDark} text={text} sub={sub} />

      {p.requests.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h3 style={{ color: text, fontSize: 14, margin: '0 0 2px' }}>Wants to join</h3>
          {p.requests.map(r => (
            <div key={r.userId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12,
              background: accentAlpha(isDark ? 0.08 : 0.06), color: text }}>
              <span style={{ fontSize: 15 }}>@{r.username}</span>
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <button disabled={busy || p.members.length >= PARTY_CAP} onClick={() => run(() => answerRequest(p.id, r.userId, true))}
                  style={{ ...btn(!busy && p.members.length < PARTY_CAP), padding: '6px 12px', fontSize: 13 }}>Let in</button>
                <button disabled={busy} onClick={() => run(() => answerRequest(p.id, r.userId, false))} style={ghostBtn}>Decline</button>
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map(m => {
          const top = m.rank <= 3
          const pct = maxMinutes > 0 ? Math.round((m.weeklyMinutes / maxMinutes) * 100) : 0
          return (
            <div key={m.id} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px 13px', borderRadius: 12,
              background: m.isYou ? accentAlpha(0.12) : rowBg,
              border: m.isYou ? `1px solid ${accentAlpha(0.35)}` : '1px solid transparent', color: text }}>
              <span style={{ width: 22, textAlign: 'center', fontSize: top ? 16 : 13, color: sub }}>{top ? MEDALS[m.rank - 1] : m.rank}</span>
              {focusLeft[m.id] != null
                ? <span title="focusing" className="grove-anim" style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: '#34d399',
                    boxShadow: '0 0 6px rgba(52,211,153,0.8)', animation: 'groveGlow 1.6s ease-in-out infinite' }} />
                : <Dot on={online(m.id)} />}
              <Avatar name={m.username} color={m.color} />
              <span style={{ fontSize: 15 }}>@{m.username}{m.isYou ? ' (you)' : ''}{m.isOwner ? ' 👑' : ''}</span>
              <span style={{ marginLeft: 'auto', color: accent, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{m.weeklyMinutes} min</span>
              <span style={{ position: 'absolute', left: 14, right: 14, bottom: 5, height: 2, borderRadius: 1, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                <span style={{ display: 'block', height: '100%', width: `${pct}%`, borderRadius: 1, transition: 'width .6s ease',
                  background: `linear-gradient(90deg, #4d7c0f, #65a30d 60%, ${ACCENT})` }} />
              </span>
            </div>
          )
        })}
      </div>
      {Msg}

      <button disabled={busy} onClick={() => { if (confirm(p.isOwner ? 'End this party for everyone?' : 'Leave this party?')) run(() => leaveParty(p)) }}
        style={{ marginTop: 18, color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'Crimson Pro, serif', fontSize: 14 }}>
        {p.isOwner ? 'End party' : 'Leave party'}
      </button>
    </div>
  )
})
