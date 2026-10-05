import { NextResponse } from "next/server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { getAuthUser } from "@/lib/auth"
import { consumeAiQuota } from "@/lib/aiQuota"
import { GROQ_MODEL, REASONING_EFFORT } from "@/lib/aiModels"

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

export async function POST(request: Request) {
  try {
    const key = getRateLimitKey(request)
    if (!checkRateLimit(key, { windowMs: 60000, maxRequests: 30 })) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const overQuota = await consumeAiQuota(user.id)
    if (overQuota) return overQuota

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 })
    }

    const { query, notes } = await request.json()

    if (!query || typeof query !== "string" || query.length > 200) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 })
    }

    if (!Array.isArray(notes) || notes.length === 0) {
      return NextResponse.json({ results: [] })
    }

    const noteSummaries = notes.map((n: { id: string; name: string; pages: string[] }, i: number) => {
      const pages = n.pages.map((p: string, pi: number) => `  Page ${pi + 1}: ${p}`).join("\n")
      return `[${i}] "${n.name}"\n${pages}`
    }).join("\n\n")

    const totalLen = noteSummaries.length
    const truncated = totalLen > 12000 ? noteSummaries.slice(0, 12000) + "\n...(truncated)" : noteSummaries

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 1024,
        reasoning_effort: REASONING_EFFORT,
        temperature: 0,
        messages: [
          {
            role: "system",
            content: `You are a search engine for a note-taking app. Given a user query and a list of notebooks with their page contents, return the most relevant matches as a JSON array.

Each match should be: {"noteIdx": <number>, "pageIdx": <number>, "reason": "<short reason>"}

Rules:
- noteIdx is the [index] shown before each notebook name
- pageIdx is 0-based (Page 1 = 0, Page 2 = 1, etc.)
- Return up to 8 most relevant results, ordered by relevance
- Match semantically — the query doesn't need to appear verbatim
- Output ONLY the JSON array, nothing else. No markdown, no explanation.
- If nothing is relevant, return []`,
          },
          {
            role: "user",
            content: `Query: "${query}"\n\nNotebooks:\n${truncated}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error("Groq search error:", response.status)
      return NextResponse.json({ error: "Search AI error" }, { status: 502 })
    }

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "[]"

    let results: { noteIdx: number; pageIdx: number; reason: string }[]
    try {
      const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/, "")
      results = JSON.parse(cleaned)
      if (!Array.isArray(results)) results = []
    } catch {
      results = []
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
