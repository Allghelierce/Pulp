import { NextResponse } from "next/server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getEmbeddings } from "@/lib/embeddings"

export async function POST(request: Request) {
  try {
    const key = getRateLimitKey(request)
    if (!checkRateLimit(key, { windowMs: 5000, maxRequests: 10 })) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { query } = await request.json()
    if (!query || typeof query !== "string" || query.length > 300) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 })
    }

    const [queryEmbedding] = await getEmbeddings([query])

    const { data: matches, error } = await supabaseAdmin.rpc("match_embeddings", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_user_id: user.id,
      match_threshold: 0.3,
      match_count: 12,
    })

    if (error) throw error

    const { data: clicks } = await supabaseAdmin
      .from("search_interactions")
      .select("clicked_note_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    const clickCounts: Record<string, number> = {}
    if (clicks) {
      for (const c of clicks) {
        clickCounts[c.clicked_note_id] = (clickCounts[c.clicked_note_id] || 0) + 1
      }
    }

    const boosted = (matches || []).map((m: { note_id: string; page_index: number; chunk_text: string; similarity: number }) => ({
      ...m,
      score: m.similarity + (clickCounts[m.note_id] || 0) * 0.02,
    }))

    boosted.sort((a: { score: number }, b: { score: number }) => b.score - a.score)

    const seen = new Set<string>()
    const deduped = boosted.filter((m: { note_id: string; page_index: number }) => {
      const key = `${m.note_id}:${m.page_index}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 8)

    return NextResponse.json({ results: deduped })
  } catch (error) {
    console.error("Semantic search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
