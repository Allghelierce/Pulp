import { NextResponse } from "next/server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const key = getRateLimitKey(request)
    if (!checkRateLimit(key, { windowMs: 5000, maxRequests: 10 })) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { noteId } = await request.json()
    if (!noteId) return NextResponse.json({ error: "Missing noteId" }, { status: 400 })

    const { data, error } = await supabaseAdmin.rpc("find_related_notes", {
      source_note_id: noteId,
      source_user_id: user.id,
      match_threshold: 0.4,
      match_count: 5,
    })

    if (error) throw error

    return NextResponse.json({ related: data || [] })
  } catch (error) {
    console.error("Related notes error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
