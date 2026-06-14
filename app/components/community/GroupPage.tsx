"use client"
import { useState, useEffect, useCallback, memo } from "react"
import { apiFetch } from "@/lib/apiFetch"

const accent = '#d97706'
interface Member { user_id: string; role: string; status: string; focus_minutes_total: number; username?: string; level?: number }
interface Group { id: number; name: string; owner_id: string; invite_code: string; term_end: string; status: string }

export const GroupPage = memo(function GroupPage({
  theme, groupId, currentUserId, onBack,
}: { theme: "light" | "dark"; groupId: number; currentUserId: string; onBack: () => void }) {
  const isDark = theme === 'dark'
  const text = isDark ? '#fafafa' : '#0f0f10'
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [lb, setLb] = useState<{ weekly: { user_id: string; username: string; focus_minutes: number }[]; allTime: { user_id: string; username: string; focus_minutes_total: number; trees: number }[] }>({ weekly: [], allTime: [] })

  const load = useCallback(async () => {
    const res = await apiFetch(`/api/groups?id=${groupId}`)
    if (res.ok) { const j = await res.json(); setGroup(j.group); setMembers(j.members) }
    const lbRes = await apiFetch(`/api/groups/leaderboard?id=${groupId}`)
    if (lbRes.ok) setLb(await lbRes.json())
  }, [groupId])
  useEffect(() => { load() }, [load])

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
      {archived && <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(217,119,6,0.1)', color: accent }}>This term is over — read-only.</div>}

      {!archived && <div style={{ marginTop: 12, color: '#8a857e' }}>Invite:{' '}
        <button onClick={() => navigator.clipboard.writeText(group.invite_code)} style={{ color: accent, border: 'none', background: 'none', cursor: 'pointer' }}>{group.invite_code} ⧉</button>
      </div>}

      <h3 style={{ color: text, fontSize: 15, margin: '18px 0 8px' }}>Members ({active.length}/6)</h3>
      {active.map(m => (
        <div key={m.user_id} style={{ display: 'flex', gap: 10, padding: '8px 12px', borderRadius: 10, marginBottom: 6,
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', color: text }}>
          <span>@{m.username ?? 'writer'}{m.role === 'owner' ? ' 👑' : ''}</span>
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

      {!isOwner && <button onClick={leave} style={{ marginTop: 18, color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>Leave group</button>}
    </div>
  )
})
