import { NextResponse } from "next/server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { getAuthUser } from "@/lib/auth"
import { SYSTEM_PROMPT, MODEL, MIN_TEXT, clampCount, buildUserMessage, parseCards } from "@/lib/recallPrompt"

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

export async function POST(request: Request) {
  try {
    const key = getRateLimitKey(request)
    if (!checkRateLimit(key, { windowMs: 60000, maxRequests: 10 })) {
      return NextResponse.json({ error: "Too many requests. Try again in a moment." }, { status: 429 })
    }

    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 })
    }

    const body = await request.json()
    const text: string = typeof body?.text === "string" ? body.text : ""
    const count = clampCount(body?.count)
    const title: string = typeof body?.title === "string" ? body.title.slice(0, 200) : ""

    if (text.trim().length < MIN_TEXT) {
      return NextResponse.json({ error: "Not enough notes to review yet — write more first." }, { status: 400 })
    }

    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserMessage(text, count, title) },
        ],
      }),
    })

    if (!res.ok) {
      let detail = ""
      try { const b = await res.json(); detail = b?.error?.message || "" } catch {}
      console.error("Recall Groq error:", res.status, detail)
      if (res.status === 429) return NextResponse.json({ error: "AI rate limit reached — try again shortly." }, { status: 429 })
      return NextResponse.json({ error: `AI service error (${res.status})` }, { status: 502 })
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content
    if (typeof raw !== "string") {
      return NextResponse.json({ error: "Invalid response from AI" }, { status: 502 })
    }

    const cards = parseCards(raw)
    if (cards.length === 0) {
      return NextResponse.json({ error: "Couldn't build a review from these notes — try adding more detail." }, { status: 422 })
    }

    return NextResponse.json({ cards })
  } catch (error) {
    console.error("Recall API error:", error)
    const message = error instanceof Error ? error.message : "Failed to generate review"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
