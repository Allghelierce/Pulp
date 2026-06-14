"use client"
import { memo } from "react"
export const FriendsPanel = memo(function FriendsPanel({ theme, friendCode }: { theme: "light" | "dark"; friendCode: string | null }) {
  return <div style={{ padding: 24, fontFamily: 'Crimson Pro, serif', color: theme === 'dark' ? '#fafafa' : '#0f0f10' }}>Friends — your code: {friendCode ?? '—'}</div>
})
