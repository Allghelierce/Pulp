import { NextResponse } from "next/server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { getAuthUser } from "@/lib/auth"
import { consumeAiQuota } from "@/lib/aiQuota"
import { GRADE_MODEL, GRADE_SYSTEM_PROMPT, buildGradeMessage, parseVerdict } from "@/lib/recallPrompt"

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

// Grades a typed recall answer against the card's expected answer.
// Returns { verdict: "correct" | "partial" | "wrong", feedback }.
export async function POST(request: Request) {
  try {
    const key = getRateLimitKey(request)
    if (!checkRateLimit(`grade:${key}`, { windowMs: 60000, maxRequests: 60 })) {
      return NextResponse.json({ error: "Too many requests. Slow down a little." }, { status: 429 })
    }

    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const overQuota = await consumeAiQuota(user.id, { metered: false })
    if (overQuota) return overQuota

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 })
    }

    const body = await request.json().catch(() => null)
    const q = typeof body?.q === "string" ? body.q.trim() : ""
    const a = typeof body?.a === "string" ? body.a.trim() : ""
    const answer = typeof body?.answer === "string" ? body.answer.trim() : ""
    if (!q || !a) return NextResponse.json({ error: "Missing question or expected answer" }, { status: 400 })

    // Blank answers never need a model call.
    if (!answer) return NextResponse.json({ verdict: "wrong", feedback: "No answer given — give it a try next time." })

    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: GRADE_MODEL,
        max_tokens: 1024,
        temperature: 0,
        reasoning_effort: "low",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: GRADE_SYSTEM_PROMPT },
          { role: "user", content: buildGradeMessage(q, a, answer) },
        ],
      }),
    })

    if (!res.ok) {
      console.error("Grade Groq error:", res.status)
      if (res.status === 429) return NextResponse.json({ error: "AI rate limit reached — try again shortly." }, { status: 429 })
      return NextResponse.json({ error: `AI service error (${res.status})` }, { status: 502 })
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content
    const result = typeof raw === "string" ? parseVerdict(raw) : null
    if (!result) return NextResponse.json({ error: "Couldn't grade that answer" }, { status: 502 })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Grade API error:", error)
    return NextResponse.json({ error: "Failed to grade answer" }, { status: 500 })
  }
}
