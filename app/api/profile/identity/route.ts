import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { validateUsername, escapeLike } from "@/lib/social"
import { GRADES } from "@/lib/term"

const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000 // one week
const EDITABLE = ['username', 'school', 'grade'] as const
type Field = typeof EDITABLE[number]

export async function GET(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`identity:${ip}`, { maxRequests: 30, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data } = await supabaseAdmin
    .from('player_profiles')
    .select('username, school, grade, friend_code, identity_changed_at, grove_archive')
    .eq('user_id', user.id)
    .single()

  // Summarize archived groves (grade -> tree count) for the past-years view.
  const archive = (data?.grove_archive ?? {}) as Record<string, unknown[]>
  const archived_grades: Record<string, number> = {}
  for (const [g, trees] of Object.entries(archive)) archived_grades[g] = Array.isArray(trees) ? trees.length : 0

  return NextResponse.json({
    username: data?.username ?? null,
    school: data?.school ?? null,
    grade: data?.grade ?? null,
    friend_code: data?.friend_code ?? null,
    changed_at: data?.identity_changed_at ?? {},
    cooldown_ms: COOLDOWN_MS,
    archived_grades,
  })
}

export async function POST(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`identity-post:${ip}`, { maxRequests: 15, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const field = body.field as Field
  if (!EDITABLE.includes(field)) return NextResponse.json({ error: "Invalid field" }, { status: 400 })

  const { data: profile } = await supabaseAdmin
    .from('player_profiles')
    .select('identity_changed_at, grade, grove, grove_archive')
    .eq('user_id', user.id)
    .single()

  const changed: Record<string, string> = profile?.identity_changed_at ?? {}
  const last = changed[field] ? new Date(changed[field]).getTime() : 0
  const now = Date.now()
  if (last && now - last < COOLDOWN_MS) {
    const until = new Date(last + COOLDOWN_MS).toISOString()
    return NextResponse.json({ error: "On cooldown", cooldown_until: until }, { status: 429 })
  }

  // Validate / normalize the value per field.
  let value: string
  if (field === 'username') {
    const v = validateUsername(body.value ?? '')
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 })
    value = v.value
    const { data: existing } = await supabaseAdmin
      .from('player_profiles').select('user_id').ilike('username', escapeLike(value)).maybeSingle()
    if (existing && existing.user_id !== user.id) {
      return NextResponse.json({ error: "Username taken" }, { status: 409 })
    }
  } else if (field === 'grade') {
    value = String(body.value ?? '').trim()
    if (!GRADES.includes(value)) return NextResponse.json({ error: "Invalid grade" }, { status: 400 })
  } else {
    value = String(body.value ?? '').trim().slice(0, 80)
    if (value.length < 2) return NextResponse.json({ error: "Too short" }, { status: 400 })
  }

  const nextChanged = { ...changed, [field]: new Date(now).toISOString() }
  const updates: Record<string, unknown> = { [field]: value, identity_changed_at: nextChanged }

  // Changing school year: snapshot the current grove into the archive (keyed by the
  // old grade), then either restore the target grade's archived grove or start fresh.
  // The wallet (gems/juice/inventory/achievements) is account-level and untouched.
  let responseGrove: unknown[] | undefined
  if (field === 'grade') {
    const currentGrade = (profile?.grade ?? null) as string | null
    if (currentGrade !== value) {
      const currentGrove = Array.isArray(profile?.grove) ? (profile!.grove as unknown[]) : []
      const archive = { ...((profile?.grove_archive ?? {}) as Record<string, unknown[]>) }
      // Snapshot current grove under the old grade (only if there's something to keep).
      if (currentGrade && currentGrove.length > 0) archive[currentGrade] = currentGrove
      // Restore if returning to an archived grade, else a fresh empty grove.
      let nextGrove: unknown[] = []
      if (Object.prototype.hasOwnProperty.call(archive, value)) {
        nextGrove = archive[value] ?? []
        delete archive[value]
      }
      updates.grove = nextGrove
      updates.grove_archive = archive
      responseGrove = nextGrove
    }
  }

  const { error } = await supabaseAdmin
    .from('player_profiles')
    .update(updates)
    .eq('user_id', user.id)
  if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 })

  return NextResponse.json({ ok: true, field, value, changed_at: nextChanged, ...(responseGrove !== undefined ? { grove: responseGrove } : {}) })
}
