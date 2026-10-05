import { NextResponse } from "next/server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { chunkText, getEmbeddings, extractPageText } from "@/lib/embeddings"

export async function POST(request: Request) {
  try {
    const key = getRateLimitKey(request)
    if (!checkRateLimit(`embed:${key}`, { windowMs: 10000, maxRequests: 5 })) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { noteId, pages, noteName } = await request.json()
    if (!noteId || !Array.isArray(pages)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    await supabaseAdmin
      .from("note_embeddings")
      .delete()
      .eq("user_id", user.id)
      .eq("note_id", noteId)

    const rows: { user_id: string; note_id: string; page_index: number; chunk_index: number; chunk_text: string; embedding: string }[] = []

    for (let pi = 0; pi < pages.length; pi++) {
      const text = extractPageText(pages[pi])
      if (!text) continue
      const prefix = noteName ? `${noteName}: ` : ""
      const chunks = chunkText(prefix + text)

      if (!chunks.length) continue
      const embeddings = await getEmbeddings(chunks)

      for (let ci = 0; ci < chunks.length; ci++) {
        rows.push({
          user_id: user.id,
          note_id: noteId,
          page_index: pi,
          chunk_index: ci,
          chunk_text: chunks[ci],
          embedding: JSON.stringify(embeddings[ci]),
        })
      }
    }

    if (rows.length) {
      const { error } = await supabaseAdmin.from("note_embeddings").insert(rows)
      if (error) throw error
    }

    return NextResponse.json({ embedded: rows.length })
  } catch (error) {
    console.error("Embed error:", error)
    return NextResponse.json({ error: "Embedding failed" }, { status: 500 })
  }
}
