import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { query, response, chunkNoteIds, rating } = await request.json()
    if (!query || !response || ![1, -1].includes(rating)) {
      return NextResponse.json({ error: "Invalid" }, { status: 400 })
    }

    const safeChunkIds = Array.isArray(chunkNoteIds)
      ? chunkNoteIds.filter((id: unknown) => typeof id === "string").slice(0, 50)
      : []

    await supabaseAdmin.from("chat_feedback").insert({
      user_id: user.id,
      query_text: query.slice(0, 2000),
      response_text: response.slice(0, 5000),
      chunk_note_ids: safeChunkIds,
      rating,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Feedback error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
