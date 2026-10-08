// Live party presence over Supabase Realtime: who's online and who's focusing.
// One shared channel per app session, started by <PartyPresence /> so your
// status goes out even when the party panel is closed.
import { supabase } from "./supabase"
import { loadParty } from "./party"

export interface Peer {
  user_id: string
  username: string
  status: "online" | "focusing"
  timer_end?: number // epoch ms the current focus session ends
}

export interface PresenceState {
  groupId: number | null
  peers: Record<string, Peer>
}

let state: PresenceState = { groupId: null, peers: {} }
const listeners = new Set<() => void>()
let channel: ReturnType<typeof supabase.channel> | null = null
let me: { id: string; username: string } | null = null

function emit(next: PresenceState) {
  state = next
  listeners.forEach(fn => fn())
}

export function subscribePresence(fn: () => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
export const getPresence = (): PresenceState => state
const EMPTY: PresenceState = { groupId: null, peers: {} }
export const getServerPresence = (): PresenceState => EMPTY

// Your status, read from the timer the app already keeps in sessionStorage.
function myStatus(): Peer {
  let focusing = false
  let timerEnd: number | undefined
  try {
    const t = JSON.parse(sessionStorage.getItem("pulp-timer") || "null")
    if (t?.running && !t?.done && t.total > 0) {
      focusing = true
      timerEnd = Date.now() + Math.max(0, t.total - t.elapsed) * 1000
    }
  } catch {}
  return { user_id: me!.id, username: me!.username, status: focusing ? "focusing" : "online", timer_end: timerEnd }
}

function track() {
  if (channel && me) channel.track(myStatus()).catch(() => {})
}

function disconnect() {
  if (channel) { channel.untrack().catch(() => {}); supabase.removeChannel(channel) }
  channel = null
  emit({ groupId: null, peers: {} })
}

// Accepted risk (for now): `party:<id>` is a public Realtime channel. Anyone
// with the anon key can guess the numeric id, see who's online/focusing, and
// post a status under a member's id. The panel only shows peers who are real
// members and uses presence for nothing but those dots and "Nm left" (no
// minutes, standings or rewards), so the worst case is a fake status. Fix
// later: private channels with a realtime.messages policy on
// is_active_group_member().
function connect(groupId: number) {
  if (state.groupId === groupId && channel) return
  disconnect()
  const ch = supabase.channel(`party:${groupId}`, { config: { presence: { key: me!.id } } })
  channel = ch
  ch.on("presence", { event: "sync" }, () => {
    const raw = ch.presenceState() as unknown as Record<string, Peer[]>
    const peers: Record<string, Peer> = {}
    for (const key of Object.keys(raw)) if (raw[key][0]) peers[key] = raw[key][0]
    emit({ groupId, peers })
  })
  ch.subscribe(status => { if (status === "SUBSCRIBED") track() })
  emit({ groupId, peers: {} })
}

async function sync() {
  try {
    const s = await loadParty()
    if (s.kind !== "in") { me = null; disconnect(); return }
    me = s.me
    connect(s.party.id)
  } catch {}
}

// Returns a cleanup function. Safe to call once per app mount.
export function startPartyPresence(): () => void {
  const onParty = () => { sync() }
  // VitalitySystem posts this whenever the timer starts or stops.
  const onMessage = (e: MessageEvent) => { if (e.data?.type === "pulp-timer-state") setTimeout(track, 300) }
  // Fires INITIAL_SESSION right away, which does the first sync. Deferred:
  // calling auth methods inside this callback can deadlock supabase-js.
  const { data: auth } = supabase.auth.onAuthStateChange(event => { if (event !== "TOKEN_REFRESHED") setTimeout(sync, 0) })
  window.addEventListener("pulp-party-change", onParty)
  window.addEventListener("message", onMessage)
  return () => {
    window.removeEventListener("pulp-party-change", onParty)
    window.removeEventListener("message", onMessage)
    auth.subscription.unsubscribe()
    disconnect()
  }
}
