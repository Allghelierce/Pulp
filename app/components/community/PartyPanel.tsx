"use client"
import { useState, useEffect, useCallback, memo } from "react"
import { getParty, createParty, joinParty, leaveParty, standings, PARTY_CAP, type Party } from "@/lib/party"

const accent = '#d97706'
const MEDALS = ['🥇', '🥈', '🥉']

export const PartyPanel = memo(function PartyPanel({ theme }: { theme: "light" | "dark" }) {
  const isDark = theme === 'dark'
  const text = isDark ? '#fafafa' : '#0f0f10'
  const sub = isDark ? '#8a857e' : '#8a857e'
  const rowBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'

  const [party, setParty] = useState<Party | null>(null)
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [copied, setCopied] = useState(false)

  const refresh = useCallback(() => setParty(getParty()), [])
  useEffect(() => {
    refresh()
    window.addEventListener('pulp-party-change', refresh)
    return () => window.removeEventListener('pulp-party-change', refresh)
  }, [refresh])

  const field = { padding: '9px 12px', borderRadius: 10, outline: 'none', fontFamily: 'Crimson Pro, serif', fontSize: 14,
    border: `1px solid ${isDark ? '#3f3f46' : '#e0dacb'}`, background: isDark ? '#0e0c09' : '#fff', color: text } as const
  const btn = (enabled = true) => ({ padding: '10px 16px', borderRadius: 10, border: 'none', cursor: enabled ? 'pointer' : 'default',
    background: accent, color: '#fff', fontFamily: 'Crimson Pro, serif', fontSize: 14, opacity: enabled ? 1 : 0.5 } as const)

  // ── Empty state: create or join ──────────────────────────────────
  if (!party) {
    return (
      <div style={{ padding: 24, fontFamily: 'Crimson Pro, serif', maxWidth: 460, margin: '0 auto' }}>
        <h2 style={{ color: text, fontSize: 22, margin: '4px 0 4px' }}>Start a party</h2>
        <p style={{ color: sub, fontSize: 14, margin: '0 0 22px' }}>
          Race friends on focus minutes this week. Up to {PARTY_CAP} players.
        </p>

        <h3 style={{ color: text, fontSize: 15, margin: '0 0 8px' }}>Create</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="party name" maxLength={24}
            style={{ ...field, flex: 1 }} onKeyDown={e => { if (e.key === 'Enter' && name.trim().length >= 2) createParty(name) }} />
          <button onClick={() => createParty(name)} disabled={name.trim().length < 2} style={btn(name.trim().length >= 2)}>Create</button>
        </div>

        <h3 style={{ color: text, fontSize: 15, margin: '0 0 8px' }}>Join by code</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="invite code" maxLength={8}
            style={{ ...field, flex: 1, textTransform: 'uppercase' }} onKeyDown={e => { if (e.key === 'Enter' && code.trim()) joinParty(code) }} />
          <button onClick={() => joinParty(code)} disabled={!code.trim()} style={btn(!!code.trim())}>Join</button>
        </div>
      </div>
    )
  }

  // ── In a party ───────────────────────────────────────────────────
  const rows = standings(party)
  const full = party.members.length >= PARTY_CAP
  const copy = () => { navigator.clipboard?.writeText(party.code); setCopied(true); setTimeout(() => setCopied(false), 1500) }

  return (
    <div style={{ padding: 24, fontFamily: 'Crimson Pro, serif', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ color: text, fontSize: 22, margin: 0 }}>{party.name}</h2>
        <span style={{ color: sub, fontSize: 13 }}>{party.members.length}/{PARTY_CAP} · this week</span>
      </div>

      <button onClick={copy} title="copy invite code"
        style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
          border: `1px dashed ${isDark ? '#3f3f46' : '#d8d2c4'}`, background: 'transparent', color: text, fontFamily: 'Crimson Pro, serif' }}>
        <span style={{ color: sub, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>invite</span>
        <span style={{ color: accent, fontSize: 15, letterSpacing: '0.15em', fontWeight: 600 }}>{party.code}</span>
        <span style={{ color: sub, fontSize: 12 }}>{copied ? '✓ copied' : '⧉'}</span>
      </button>

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map(m => {
          const top = m.rank <= 3
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12,
              background: m.isYou ? 'rgba(217,119,6,0.12)' : rowBg,
              border: m.isYou ? `1px solid rgba(217,119,6,0.35)` : '1px solid transparent', color: text }}>
              <span style={{ width: 24, textAlign: 'center', fontSize: top ? 16 : 13, color: sub }}>
                {top ? MEDALS[m.rank - 1] : m.rank}
              </span>
              <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: m.color,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                {m.username[0]?.toUpperCase()}
              </span>
              <span style={{ fontSize: 15 }}>
                @{m.username}{m.isYou ? ' (you)' : ''}{m.isOwner ? ' 👑' : ''}
              </span>
              <span style={{ marginLeft: 'auto', color: accent, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{m.weeklyMinutes} min</span>
            </div>
          )
        })}
      </div>

      {full && <p style={{ color: sub, fontSize: 13, marginTop: 12 }}>Party is full.</p>}

      <button onClick={() => { if (confirm('Leave this party?')) leaveParty() }}
        style={{ marginTop: 20, color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'Crimson Pro, serif', fontSize: 14 }}>
        Leave party
      </button>
    </div>
  )
})
