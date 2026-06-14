import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { validateUsername } from "@/lib/social"
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
    .select('username, school, grade, friend_code, identity_changed_at')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({
    username: data?.username ?? null,
    school: data?.school ?? null,
    grade: data?.grade ?? null,
    friend_code: data?.friend_code ?? null,
    changed_at: data?.identity_changed_at ?? {},
    cooldown_ms: COOLDOWN_MS,
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
    .select('identity_changed_at')
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
      .from('player_profiles').select('user_id').ilike('username', value).maybeSingle()
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
  const { error } = await supabaseAdmin
    .from('player_profiles')
    .update({ [field]: value, identity_changed_at: nextChanged })
    .eq('user_id', user.id)
  if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 })

  return NextResponse.json({ ok: true, field, value, changed_at: nextChanged })
}
