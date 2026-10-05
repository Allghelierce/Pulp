"use client"
import { useState, useEffect, useCallback, memo } from "react"
import { getParty, createParty, joinParty, leaveParty, standings, hasJoinedBefore, PARTY_CAP, type Party } from "@/lib/party"
import { getFriends, addFriend, removeFriend, getMyCode, isOnline, type Friend } from "@/lib/friends"

const accent = '#d97706'
const MEDALS = ['🥇', '🥈', '🥉']

function Dot({ on }: { on: boolean }) {
  return <span title={on ? 'online' : 'offline'} style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
    background: on ? '#22c55e' : '#71717a55', boxShadow: on ? '0 0 5px rgba(34,197,94,0.6)' : 'none' }} />
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
    const myCode = getMyCode()
    const copyCode = () => { navigator.clipboard?.writeText(myCode); setCopied(true); setTimeout(() => setCopied(false), 1500) }
    const add = () => { const r = addFriend(friendInput); setMsg(r.ok ? null : r.error); if (r.ok) setFriendInput("") }
    const onlineCount = friends.filter(f => isOnline(f.username)).length

    return (
      <div style={{ padding: 24, fontFamily: 'Crimson Pro, serif' }}>
        {Tabs}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <h2 style={{ color: text, fontSize: 20, margin: 0 }}>Friends</h2>
          <span style={{ color: sub, fontSize: 13 }}>{onlineCount} online</span>
        </div>

        <button onClick={copyCode} title="copy your friend code"
          style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
            border: `1px dashed ${isDark ? '#3f3f46' : '#d8d2c4'}`, background: 'transparent', color: text }}>
          <span style={{ color: sub, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>your code</span>
          <span style={{ color: accent, fontSize: 15, letterSpacing: '0.1em', fontWeight: 600 }}>{myCode}</span>
          <span style={{ color: sub, fontSize: 12 }}>{copied ? '✓' : '⧉'}</span>
        </button>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <input value={friendInput} onChange={e => setFriendInput(e.target.value)} placeholder="@username or friend code"
            style={{ ...field, flex: 1 }} onKeyDown={e => { if (e.key === 'Enter') add() }} />
          <button onClick={add} disabled={!friendInput.trim()} style={btn(!!friendInput.trim())}>Add</button>
        </div>
        {msg && <p style={{ color: '#ef4444', fontSize: 13, margin: '8px 2px 0' }}>{msg}</p>}

        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {friends.length === 0 && <p style={{ color: sub, fontSize: 14 }}>No friends yet — add someone by code.</p>}
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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 4, marginBottom: 10 }}>
              {['🌱', '🌿', '🌳'].map((e, i) => (
                <span key={i} style={{ fontSize: 18 + i * 8, lineHeight: 1,
                  animation: `partySprout 2s ease-in-out ${i * 0.25}s infinite` }}>{e}</span>
              ))}
            </div>
            <h2 style={{ color: text, fontSize: 19, margin: '0 0 6px' }}>Grow together 🌳</h2>
            <p style={{ color: sub, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
              A party is you + up to {PARTY_CAP} friends racing on <b style={{ color: accent }}>focus minutes</b> each week.
              Study more, climb the list, bragging rights reset every Monday.
            </p>
            <style>{`@keyframes partySprout { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }`}</style>
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

      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map(m => {
          const top = m.rank <= 3
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12,
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
