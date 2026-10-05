import { NextResponse } from "next/server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { getAuthUser } from "@/lib/auth"
import { consumeAiQuota } from "@/lib/aiQuota"
import { TOPIC_SYSTEM_PROMPT, MODEL, MIN_TOPIC_TEXT, buildTopicMessage, parseTopicResult } from "@/lib/recallPrompt"

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

// POST { text, title? } -> { topic, cards }. Called once at focus-session end
// with the text written during the session.
export async function POST(request: Request) {
  try {
    const key = getRateLimitKey(request)
    if (!checkRateLimit(key, { windowMs: 60000, maxRequests: 10 })) {
      return NextResponse.json({ error: "Too many requests. Try again in a moment." }, { status: 429 })
    }

    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const overQuota = await consumeAiQuota(user.id, { metered: false })
    if (overQuota) return overQuota

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 })
    }

    const body = await request.json()
    const text: string = typeof body?.text === "string" ? body.text : ""
    const title: string = typeof body?.title === "string" ? body.title.slice(0, 200) : ""

    if (text.trim().length < MIN_TOPIC_TEXT) {
      return NextResponse.json({ error: "Not enough new notes." }, { status: 400 })
    }

    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        temperature: 0.3,
        reasoning_effort: "low",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: TOPIC_SYSTEM_PROMPT },
          { role: "user", content: buildTopicMessage(text, title) },
        ],
      }),
    })

    if (!res.ok) {
      let detail = ""
      try { const b = await res.json(); detail = b?.error?.message || "" } catch {}
      console.error("Recall topic Groq error:", res.status, detail)
      if (res.status === 429) return NextResponse.json({ error: "AI rate limit reached — try again shortly." }, { status: 429 })
      return NextResponse.json({ error: `AI service error (${res.status})` }, { status: 502 })
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content
    if (typeof raw !== "string") {
      return NextResponse.json({ error: "Invalid response from AI" }, { status: 502 })
    }

    return NextResponse.json(parseTopicResult(raw))
  } catch (error) {
    console.error("Recall topic API error:", error)
    const message = error instanceof Error ? error.message : "Failed to tag topic"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
