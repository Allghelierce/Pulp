import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { query, noteId, pageIndex } = await request.json()
    if (!query || !noteId) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

    await supabaseAdmin.from("search_interactions").insert({
      user_id: user.id,
      query_text: query,
      clicked_note_id: noteId,
      clicked_page_index: pageIndex || 0,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Search click error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
