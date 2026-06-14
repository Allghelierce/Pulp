"use client"
import { memo } from "react"
export const GroupsPanel = memo(function GroupsPanel({ theme }: { theme: "light" | "dark" }) {
  return <div style={{ padding: 24, fontFamily: 'Crimson Pro, serif', color: theme === 'dark' ? '#fafafa' : '#0f0f10' }}>Groups</div>
})
