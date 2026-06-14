"use client"
import { useState, useEffect, useCallback, memo } from "react"
import { apiFetch } from "@/lib/apiFetch"

const accent = '#d97706'
interface Card { friendshipId: number; user_id: string; username: string | null; level?: number }

export const FriendsPanel = memo(function FriendsPanel({ theme, friendCode }: { theme: "light" | "dark"; friendCode: string | null }) {
  const isDark = theme === 'dark'
  const [friends, setFriends] = useState<Card[]>([])
  const [incoming, setIncoming] = useState<Card[]>([])
  const [outgoing, setOutgoing] = useState<Card[]>([])
  const [input, setInput] = useState("")
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await apiFetch('/api/friends')
    if (res.ok) { const j = await res.json(); setFriends(j.friends); setIncoming(j.incoming); setOutgoing(j.outgoing) }
  }, [])
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const add = async () => {
    const val = input.trim()
    if (!val) return
    const body = val.toUpperCase().startsWith('PULP-') ? { action: 'request', friend_code: val.toUpperCase() } : { action: 'request', username: val }
    const res = await apiFetch('/api/friends', { method: 'POST', body: JSON.stringify(body) })
    const j = await res.json()
    setMsg(res.ok ? (j.status === 'accepted' ? 'Friend added!' : 'Request sent') : (j.error || 'Failed'))
    setInput(""); load()
  }
  const act = async (friendshipId: number, action: 'accept' | 'decline') => {
    await apiFetch('/api/friends', { method: 'POST', body: JSON.stringify({ action, friendshipId }) })
    load()
  }

  const text = isDark ? '#fafafa' : '#0f0f10'
  const sub = '#8a857e'
  const card = (c: Card, right: React.ReactNode) => (
    <div key={c.friendshipId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10,
      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', marginBottom: 6 }}>
      <span style={{ color: text }}>@{c.username ?? 'writer'}</span>
      <span style={{ color: sub, fontSize: 12 }}>lvl {c.level ?? 1}</span>
      <span style={{ marginLeft: 'auto' }}>{right}</span>
    </div>
  )

  return (
    <div style={{ padding: 24, fontFamily: 'Crimson Pro, serif', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ marginBottom: 18, color: sub }}>Your code:{' '}
        <button onClick={() => friendCode && navigator.clipboard.writeText(friendCode)}
          style={{ color: accent, border: 'none', background: 'none', cursor: 'pointer', fontSize: 16 }}>{friendCode ?? '—'} ⧉</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="friend code or @username"
          style={{ flex: 1, padding: '9px 12px', borderRadius: 10, outline: 'none',
            border: `1px solid ${isDark ? '#3f3f46' : '#e0dacb'}`, background: isDark ? '#0e0c09' : '#fff', color: text }} />
        <button onClick={add} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: accent, color: '#fff', cursor: 'pointer' }}>Add</button>
      </div>
      {msg && <p style={{ color: sub, fontSize: 13, margin: '0 0 12px' }}>{msg}</p>}

      {incoming.length > 0 && <h3 style={{ color: text, fontSize: 15, margin: '14px 0 8px' }}>Requests</h3>}
      {incoming.map(c => card(c, <>
        <button onClick={() => act(c.friendshipId, 'accept')} style={{ color: accent, border: 'none', background: 'none', cursor: 'pointer', marginRight: 8 }}>Accept</button>
        <button onClick={() => act(c.friendshipId, 'decline')} style={{ color: sub, border: 'none', background: 'none', cursor: 'pointer' }}>Decline</button>
      </>))}

      <h3 style={{ color: text, fontSize: 15, margin: '14px 0 8px' }}>Friends ({friends.length})</h3>
      {friends.map(c => card(c, null))}
      {outgoing.map(c => card(c, <span style={{ color: sub, fontSize: 12 }}>pending</span>))}
    </div>
  )
})
