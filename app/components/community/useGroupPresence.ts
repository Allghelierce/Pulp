"use client"
import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"

export interface Presence { user_id: string; username: string; status: 'online' | 'focusing'; timer_end?: number }

export function useGroupPresence(
  groupId: number | null,
  me: { user_id: string; username: string },
  onTree?: () => void,
) {
  const [peers, setPeers] = useState<Record<string, Presence>>({})
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const onTreeRef = useRef(onTree)
  onTreeRef.current = onTree

  useEffect(() => {
    if (!groupId || !me.user_id) return
    const channel = supabase.channel(`group:${groupId}`, { config: { presence: { key: me.user_id } } })
    channelRef.current = channel

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as unknown as Record<string, Presence[]>
      const flat: Record<string, Presence> = {}
      for (const key of Object.keys(state)) flat[key] = state[key][0]
      setPeers(flat)
    })
    channel.on('broadcast', { event: 'tree' }, () => { onTreeRef.current?.() })
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: me.user_id, username: me.username, status: 'online' } as Presence)
      }
    })
    return () => { channel.untrack(); supabase.removeChannel(channel); channelRef.current = null }
  }, [groupId, me.user_id, me.username])

  const setStatus = (status: 'online' | 'focusing', timer_end?: number) => {
    channelRef.current?.track({ user_id: me.user_id, username: me.username, status, timer_end } as Presence)
  }
  const broadcastTree = () => { channelRef.current?.send({ type: 'broadcast', event: 'tree', payload: {} }) }

  return { peers, setStatus, broadcastTree }
}
