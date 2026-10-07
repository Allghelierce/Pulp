"use client"
import { useEffect, useRef, useSyncExternalStore } from "react"
import { startPartyPresence, subscribePresence, getPresence, getServerPresence } from "@/lib/partyPresence"
import { supabase } from "@/lib/supabase"

export const PENDING_INVITE_KEY = "pulp-pending-invite"

// Always-mounted: keeps your party presence live, resumes an invite link
// after sign-in, and opens the party panel for /app?party=open.
export function PartyPresence({ onOpenParty }: { onOpenParty: () => void }) {
  const openRef = useRef(onOpenParty)
  useEffect(() => { openRef.current = onOpenParty }, [onOpenParty])
  useEffect(() => startPartyPresence(), [])

  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get("party") === "open") {
      url.searchParams.delete("party")
      window.history.replaceState(null, "", url.toString())
      openRef.current()
    }
    let code: string | null = null
    try { code = localStorage.getItem(PENDING_INVITE_KEY) } catch {}
    if (!code) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      try { localStorage.removeItem(PENDING_INVITE_KEY) } catch {}
      window.location.href = `/join/${encodeURIComponent(code!)}`
    })
  }, [])

  return null
}

export function usePartyPresence() {
  return useSyncExternalStore(subscribePresence, getPresence, getServerPresence)
}
