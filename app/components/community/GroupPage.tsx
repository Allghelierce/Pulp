"use client"
import { useState, useEffect, useCallback, memo } from "react"
import { apiFetch } from "@/lib/apiFetch"
import { PlantIcon } from "@/app/components/PlantIcon"
import { useGroupPresence } from "./useGroupPresence"
import { ACCENT, accentAlpha } from "@/lib/accent"

const accent = ACCENT
interface Member { user_id: string; role: string; status: string; focus_minutes_total: number; username?: string; level?: number }
interface Group { id: number; name: string; owner_id: string; invite_code: string; term_end: string; status: string }
interface GroupTree { type?: string; stage?: number }

export const GroupPage = memo(function GroupPage({
  theme, groupId, currentUserId, onBack,
}: { theme: "light" | "dark"; groupId: number; currentUserId: string; onBack: () => void }) {
  const isDark = theme === 'dark'
  const text = isDark ? '#fafafa' : '#0f0f10'
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [lb, setLb] = useState<{ weekly: { user_id: string; username: string; focus_minutes: number }[]; allTime: { user_id: string; username: string; focus_minutes_total: number; trees: number }[] }>({ weekly: [], allTime: [] })
  const [grove, setGrove] = useState<GroupTree[]>([])

  const load = useCallback(async () => {
    const res = await apiFetch(`/api/groups?id=${groupId}`)
    if (res.ok) { const j = await res.json(); setGroup(j.group); setMembers(j.members) }
    const lbRes = await apiFetch(`/api/groups/leaderboard?id=${groupId}`)
    if (lbRes.ok) setLb(await lbRes.json())
    const grRes = await apiFetch(`/api/groups/grove?id=${groupId}`)
    if (grRes.ok) setGrove((await grRes.json()).trees || [])
  }, [groupId])
  useEffect(() => { load() }, [load])

  const myUsername = members.find(m => m.user_id === currentUserId)?.username ?? 'writer'
  const { peers, setStatus, broadcastTree } = useGroupPresence(group ? groupId : null, { user_id: currentUserId, username: myUsername }, load)

  // 1s ticker so focusing countdowns update live
  const [now, setNow] = useState(() => 0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setInterval(() => setNow(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // Bridge focus-session start/complete from VitalitySystem (decoupled via window event)
  useEffect(() => {
    if (!group) return
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail || detail.groupId !== groupId) return
      if (detail.kind === 'start') setStatus('focusing', detail.timerEnd)
      else if (detail.kind === 'complete') { setStatus('online'); broadcastTree(); load() }
    }
    window.addEventListener('pulp-group-session', handler)
    return () => window.removeEventListener('pulp-group-session', handler)
  }, [group, groupId, setStatus, broadcastTree, load])

  const isOwner = group?.owner_id === currentUserId
  const archived = group?.status === 'archived'
  const active = members.filter(m => m.status === 'active')
  const pending = members.filter(m => m.status === 'pending')
  // eslint-disable-next-line react-hooks/purity
  const daysLeft = group ? Math.max(0, Math.ceil((new Date(group.term_end).getTime() - Date.now()) / 86400000)) : 0

  const decide = async (userId: string, action: 'approve' | 'decline') => {
    await apiFetch('/api/groups/membership', { method: 'POST', body: JSON.stringify({ action, groupId, userId }) })
    load()
  }
  const leave = async () => {
    await apiFetch('/api/groups/membership', { method: 'POST', body: JSON.stringify({ action: 'leave', groupId }) })
    onBack()
  }

  if (!group) return <div style={{ padding: 24, color: text }}>Loading…</div>
  return (
    <div style={{ padding: 24, fontFamily: 'Crimson Pro, serif', maxWidth: 620, margin: '0 auto' }}>
      <button onClick={onBack} style={{ border: 'none', background: 'none', color: '#8a857e', cursor: 'pointer', marginBottom: 12 }}>← back</button>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h2 style={{ color: text, margin: 0 }}>{group.name}</h2>
        <span style={{ color: '#8a857e', fontSize: 13 }}>{archived ? 'archived' : `${daysLeft}d left`}</span>
      </div>
      {archived && <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: accentAlpha(0.1), color: accent }}>This term is over — read-only.</div>}

      {!archived && <div style={{ marginTop: 12, color: '#8a857e' }}>Invite:{' '}
        <button onClick={() => navigator.clipboard.writeText(group.invite_code)} style={{ color: accent, border: 'none', background: 'none', cursor: 'pointer' }}>{group.invite_code} ⧉</button>
      </div>}

      <h3 style={{ color: text, fontSize: 15, margin: '18px 0 8px' }}>Members ({active.length}/6)</h3>
      {active.map(m => (
        <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, marginBottom: 6,
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', color: text }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            background: peers[m.user_id] ? (peers[m.user_id].status === 'focusing' ? accent : '#22c55e') : '#52525250' }} />
          <span>@{m.username ?? 'writer'}{m.role === 'owner' ? ' 👑' : ''}</span>
          {(() => {
            const p = peers[m.user_id]
            void now // re-render each tick
            if (p?.status === 'focusing' && p.timer_end) {
              const rem = Math.max(0, Math.round((p.timer_end - Date.now()) / 1000))
              const mm = String(Math.floor(rem / 60)).padStart(2, '0')
              const ss = String(rem % 60).padStart(2, '0')
              return <span style={{ color: accent, fontSize: 12 }}>focusing {mm}:{ss}</span>
            }
            return null
          })()}
          <span style={{ marginLeft: 'auto', color: '#8a857e', fontSize: 12 }}>{m.focus_minutes_total} min</span>
        </div>
      ))}

      <h3 style={{ color: text, fontSize: 15, margin: '18px 0 8px' }}>This week</h3>
      {lb.weekly.map((r, i) => (
        <div key={r.user_id} style={{ display: 'flex', gap: 10, padding: '6px 12px', borderRadius: 10, marginBottom: 4,
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', color: text }}>
          <span style={{ color: '#8a857e', width: 22 }}>#{i + 1}</span>
          <span>@{r.username}</span>
          <span style={{ marginLeft: 'auto', color: accent, fontSize: 13 }}>{r.focus_minutes} min</span>
        </div>
      ))}

      <h3 style={{ color: text, fontSize: 15, margin: '18px 0 8px' }}>All term</h3>
      {lb.allTime.map((r, i) => (
        <div key={r.user_id} style={{ display: 'flex', gap: 10, padding: '6px 12px', borderRadius: 10, marginBottom: 4,
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', color: text }}>
          <span style={{ color: '#8a857e', width: 22 }}>#{i + 1}</span>
          <span>@{r.username}</span>
          <span style={{ marginLeft: 'auto', color: '#8a857e', fontSize: 13 }}>{r.focus_minutes_total} min · 🌳 {r.trees}</span>
        </div>
      ))}

      {isOwner && !archived && pending.length > 0 && <>
        <h3 style={{ color: text, fontSize: 15, margin: '18px 0 8px' }}>Requests</h3>
        {pending.map(m => (
          <div key={m.user_id} style={{ display: 'flex', gap: 10, padding: '8px 12px', borderRadius: 10, marginBottom: 6,
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', color: text }}>
            <span>@{m.username ?? 'writer'}</span>
            <span style={{ marginLeft: 'auto' }}>
              <button onClick={() => decide(m.user_id, 'approve')} style={{ color: accent, border: 'none', background: 'none', cursor: 'pointer', marginRight: 8 }}>Approve</button>
              <button onClick={() => decide(m.user_id, 'decline')} style={{ color: '#8a857e', border: 'none', background: 'none', cursor: 'pointer' }}>Decline</button>
            </span>
          </div>
        ))}
      </>}

      <div style={{ marginTop: 20 }}>
        <h3 style={{ color: text, fontSize: 15, margin: '0 0 8px' }}>Communal grove</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 4,
          padding: 16, borderRadius: 14, background: isDark ? 'rgba(120,140,80,0.10)' : 'rgba(120,140,80,0.14)' }}>
          {grove.length === 0 && <span style={{ color: '#8a857e', fontSize: 13 }}>No trees yet — start a session here.</span>}
          {grove.map((t, i) => <PlantIcon key={i} type={t.type || 'tangerine'} size={48} stage={t.stage ?? 3} hideGround />)}
        </div>
      </div>

      {!isOwner && <button onClick={leave} style={{ marginTop: 18, color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>Leave group</button>}
    </div>
  )
})
