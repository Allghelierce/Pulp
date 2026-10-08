"use client"
import { useState, memo } from "react"
import { apiFetch } from "@/lib/apiFetch"
import { SCHOOLS } from "@/lib/schools"
import { GRADES } from "@/lib/term"
import { generateUsername } from "@/lib/usernames"
import { ACCENT, ACCENT_CONTRAST, accentAlpha } from "@/lib/accent"

export const OnboardingModal = memo(function OnboardingModal({
  theme, onDone, initialUsername,
}: { theme: "light" | "dark"; initialUsername?: string; onDone: (r: { username: string; friend_code: string; grade?: string }) => void }) {
  const [username, setUsername] = useState(initialUsername ?? "")
  // The generated name arrives after the profile loads; adopt it unless they've typed.
  const [touched, setTouched] = useState(false)
  if (initialUsername && !touched && !username) setUsername(initialUsername)
  const [school, setSchool] = useState(SCHOOLS[0])
  const [grade, setGrade] = useState(GRADES[7]) // 7th Grade default
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isDark = theme === 'dark'

  const submit = async () => {
    setBusy(true); setError(null)
    const res = await apiFetch('/api/profile/username', {
      method: 'POST', body: JSON.stringify({ username, school, grade }),
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
        <p style={{ fontSize: 14, color: '#8a857e', margin: '0 0 18px' }}>Here&apos;s a name to start — keep it, roll a new one, or type your own. Then your school and grade.</p>
        <div style={{ position: 'relative', marginBottom: 12 }}>
        <input
          autoFocus value={username}
          onChange={e => { setTouched(true); setUsername(e.target.value) }}
          placeholder="username"
          maxLength={20}
          style={{ width: '100%', padding: '10px 44px 10px 12px', borderRadius: 10,
            border: `1px solid ${isDark ? '#3f3f46' : '#e0dacb'}`, outline: 'none',
            background: isDark ? '#0e0c09' : '#fff', color: isDark ? '#fafafa' : '#0f0f10' }}
        />
        <button type="button" title="Roll a new name" aria-label="Roll a new name"
          onClick={() => { setTouched(true); setUsername(generateUsername()) }}
          style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 32, height: 30, borderRadius: 8,
            border: 'none', background: accentAlpha(0.12), cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>🎲</button>
        </div>
        <select value={school} onChange={e => setSchool(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, marginBottom: 12,
            border: `1px solid ${isDark ? '#3f3f46' : '#e0dacb'}`,
            background: isDark ? '#0e0c09' : '#fff', color: isDark ? '#fafafa' : '#0f0f10' }}>
          {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={grade} onChange={e => setGrade(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, marginBottom: 16,
            border: `1px solid ${isDark ? '#3f3f46' : '#e0dacb'}`,
            background: isDark ? '#0e0c09' : '#fff', color: isDark ? '#fafafa' : '#0f0f10' }}>
          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        {error && <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}
        <button onClick={submit} disabled={busy || username.trim().length < 3}
          style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: ACCENT, color: ACCENT_CONTRAST, fontFamily: 'Crimson Pro, serif', fontSize: 15,
            opacity: busy || username.trim().length < 3 ? 0.6 : 1 }}>
          {busy ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </div>
  )
})
