import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"

// Students apply to add a new (unlisted) school. Reviewed before it becomes joinable.
export async function POST(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`school-apply:${ip}`, { maxRequests: 5, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const name = typeof body.school_name === 'string' ? body.school_name.trim().slice(0, 80) : ''
  if (name.length < 2) {
    return NextResponse.json({ error: "School name too short" }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('school_applications')
    .upsert({ user_id: user.id, school_name: name, status: 'pending' }, { onConflict: 'user_id,school_name' })

  if (error) return NextResponse.json({ error: "Could not submit" }, { status: 500 })

  return NextResponse.json({ ok: true })
}
