"use client"
import { useState, useEffect, memo } from "react"
import { FriendsPanel } from "./community/FriendsPanel"
import { GroupsPanel } from "./community/GroupsPanel"

const accent = '#d97706'

export const CommunityView = memo(function CommunityView({
  theme, friendCode, onClose,
}: { theme: "light" | "dark"; friendCode: string | null; onClose: () => void }) {
  const [tab, setTab] = useState<'friends' | 'groups'>('friends')
  const isDark = theme === 'dark'

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const bg = isDark ? '#0e0c09' : '#ede6d8'
  return (
    <div style={{ position: 'absolute', inset: 0, background: bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px', fontFamily: 'Crimson Pro, serif' }}>
        {(['friends', 'groups'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', textTransform: 'capitalize',
              background: tab === t ? accent : 'transparent', color: tab === t ? '#fff' : (isDark ? '#a1a1aa' : '#6b6864') }}>
            {t}
          </button>
        ))}
        <button onClick={onClose} style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: 'transparent', color: isDark ? '#a1a1aa' : '#6b6864' }}>Close</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'friends' ? <FriendsPanel theme={theme} friendCode={friendCode} /> : <GroupsPanel theme={theme} />}
      </div>
    </div>
  )
})
