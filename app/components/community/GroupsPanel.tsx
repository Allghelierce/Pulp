"use client"
import { useState, useEffect, useCallback, memo } from "react"
import { apiFetch } from "@/lib/apiFetch"

const accent = '#d97706'
interface Group { id: number; name: string; invite_code: string; term_end: string; status: string }

function plusMonthsISO(months: number): string {
  const d = new Date(); d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

export const GroupsPanel = memo(function GroupsPanel({ theme, onOpenGroup }: { theme: "light" | "dark"; onOpenGroup: (id: number) => void }) {
  const isDark = theme === 'dark'
  const text = isDark ? '#fafafa' : '#0f0f10'
  const [groups, setGroups] = useState<Group[]>([])
  const [name, setName] = useState("")
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10))
  const [end, setEnd] = useState(plusMonthsISO(3))
  const [code, setCode] = useState("")
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await apiFetch('/api/groups')
    if (res.ok) setGroups((await res.json()).groups || [])
  }, [])
  useEffect(() => { load() }, [load])

  const create = async () => {
    const res = await apiFetch('/api/groups', { method: 'POST', body: JSON.stringify({ name, term_start: start, term_end: end }) })
    const j = await res.json()
    if (res.ok) { setName(""); load() } else setMsg(j.error)
  }
  const join = async () => {
    const res = await apiFetch('/api/groups/membership', { method: 'POST', body: JSON.stringify({ action: 'join', invite_code: code.trim() }) })
    const j = await res.json()
    setMsg(res.ok ? 'Request sent — waiting for approval' : j.error)
    setCode("")
  }

  const field = { padding: '9px 12px', borderRadius: 10, outline: 'none',
    border: `1px solid ${isDark ? '#3f3f46' : '#e0dacb'}`, background: isDark ? '#0e0c09' : '#fff', color: text } as const

  return (
    <div style={{ padding: 24, fontFamily: 'Crimson Pro, serif', maxWidth: 560, margin: '0 auto' }}>
      <h3 style={{ color: text, fontSize: 15, margin: '0 0 8px' }}>Your groups</h3>
      {groups.length === 0 && <p style={{ color: '#8a857e', fontSize: 14 }}>No groups yet.</p>}
      {groups.map(g => (
        <button key={g.id} onClick={() => onOpenGroup(g.id)}
          style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, marginBottom: 6, cursor: 'pointer',
            border: 'none', textAlign: 'left', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', color: text }}>
          <span>{g.name}</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#8a857e' }}>ends {g.term_end}</span>
        </button>
      ))}

      <h3 style={{ color: text, fontSize: 15, margin: '20px 0 8px' }}>Create a group</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="group name" style={field} />
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="date" value={start} onChange={e => setStart(e.target.value)} style={{ ...field, flex: 1 }} />
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} style={{ ...field, flex: 1 }} />
        </div>
        <button onClick={create} disabled={name.trim().length < 2}
          style={{ padding: '10px', borderRadius: 10, border: 'none', background: accent, color: '#fff', cursor: 'pointer', opacity: name.trim().length < 2 ? 0.6 : 1 }}>Create</button>
      </div>

      <h3 style={{ color: text, fontSize: 15, margin: '20px 0 8px' }}>Join by code</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={code} onChange={e => setCode(e.target.value)} placeholder="invite code" style={{ ...field, flex: 1 }} />
        <button onClick={join} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: accent, color: '#fff', cursor: 'pointer' }}>Join</button>
      </div>
      {msg && <p style={{ color: '#8a857e', fontSize: 13, marginTop: 10 }}>{msg}</p>}
    </div>
  )
})
