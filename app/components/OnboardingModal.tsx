"use client"
import { useState, memo } from "react"
import { apiFetch } from "@/lib/apiFetch"
import { SCHOOLS } from "@/lib/schools"

const accent = '#d97706'

export const OnboardingModal = memo(function OnboardingModal({
  theme, onDone,
}: { theme: "light" | "dark"; onDone: (r: { username: string; friend_code: string }) => void }) {
  const [username, setUsername] = useState("")
  const [school, setSchool] = useState(SCHOOLS[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isDark = theme === 'dark'

  const submit = async () => {
    setBusy(true); setError(null)
    const res = await apiFetch('/api/profile/username', {
      method: 'POST', body: JSON.stringify({ username, school }),
    })
    const json = await res.json()
    setBusy(false)
    if (!res.ok) { setError(json.error || 'Could not save'); return }
    onDone(json)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'grid', placeItems: 'center',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
      <div style={{ width: 360, padding: 28, borderRadius: 20, fontFamily: 'Crimson Pro, serif',
        background: isDark ? '#18181b' : '#fdfcf9', border: `1px solid ${isDark ? '#27272a' : '#e7e2d8'}` }}>
        <h2 style={{ fontSize: 22, margin: '0 0 4px', color: isDark ? '#fafafa' : '#0f0f10' }}>Claim your name</h2>
        <p style={{ fontSize: 14, color: '#8a857e', margin: '0 0 18px' }}>Pick a username and your school.</p>
        <input
          autoFocus value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="username"
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, marginBottom: 12,
            border: `1px solid ${isDark ? '#3f3f46' : '#e0dacb'}`, outline: 'none',
            background: isDark ? '#0e0c09' : '#fff', color: isDark ? '#fafafa' : '#0f0f10' }}
        />
        <select value={school} onChange={e => setSchool(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, marginBottom: 16,
            border: `1px solid ${isDark ? '#3f3f46' : '#e0dacb'}`,
            background: isDark ? '#0e0c09' : '#fff', color: isDark ? '#fafafa' : '#0f0f10' }}>
          {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {error && <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}
        <button onClick={submit} disabled={busy || username.trim().length < 3}
          style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: accent, color: '#fff', fontFamily: 'Crimson Pro, serif', fontSize: 15,
            opacity: busy || username.trim().length < 3 ? 0.6 : 1 }}>
          {busy ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </div>
  )
})
