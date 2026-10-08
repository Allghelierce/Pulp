import { NextResponse } from "next/server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { getAuthUser } from "@/lib/auth"
import { consumeAiQuota, spendDailyAllowance, FREE_CARD_SESSIONS_PER_DAY, FREE_HIGHLIGHT_CARDS_PER_DAY } from "@/lib/aiQuota"
import {
  SYSTEM_PROMPT, MODEL, MIN_TEXT, clampCount, buildUserMessage, parseCards,
  HIGHLIGHT_SYSTEM_PROMPT, HIGHLIGHT_MIN, HIGHLIGHT_MAX, buildHighlightMessage,
} from "@/lib/recallPrompt"

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

// One Groq JSON call -> the raw reply, or a ready-to-send error response.
async function askGroq(system: string, user: string, maxTokens: number, temperature: number): Promise<string | NextResponse> {
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature,
      reasoning_effort: "low",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
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
  if (typeof raw !== "string") return NextResponse.json({ error: "Invalid response from AI" }, { status: 502 })
  return raw
}

// mode "highlight": ONE card from a passage highlighted in the notes (+ its paragraph
// as context). Spends its own small daily allowance, not the session-card one.
async function highlightCard(userId: string, body: Record<string, unknown>): Promise<NextResponse> {
  const passage = typeof body.text === "string" ? body.text.replace(/\s+/g, " ").trim().slice(0, HIGHLIGHT_MAX) : ""
  const context = typeof body.context === "string" ? body.context.replace(/\s+/g, " ").trim() : ""
  const title = typeof body.title === "string" ? body.title.slice(0, 200) : ""
  if (passage.length < HIGHLIGHT_MIN) return NextResponse.json({ error: "Highlight a bit more text." }, { status: 400 })

  if (!(await spendDailyAllowance(userId, "highlight"))) {
    return NextResponse.json({
      error: `Free accounts get ${FREE_HIGHLIGHT_CARDS_PER_DAY} AI highlight cards a day. Upgrade to Plus for more.`,
      code: "highlight_limit",
    }, { status: 402 })
  }

  const raw = await askGroq(HIGHLIGHT_SYSTEM_PROMPT, buildHighlightMessage(passage, context, title), 1500, 0.3)
  if (typeof raw !== "string") return raw
  const card = parseCards(raw)[0]
  if (!card) return NextResponse.json({ error: "Couldn't make a card from that." }, { status: 422 })
  return NextResponse.json({ cards: [card] })
}

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
    if (body?.mode === "highlight") return await highlightCard(user.id, body)
    const text: string = typeof body?.text === "string" ? body.text : ""
    const count = clampCount(body?.count)
    const title: string = typeof body?.title === "string" ? body.title.slice(0, 200) : ""

    if (text.trim().length < MIN_TEXT) {
      return NextResponse.json({ error: "Not enough notes to review yet — write more first." }, { status: 400 })
    }

    if (!(await spendDailyAllowance(user.id, "cards"))) {
      return NextResponse.json({
        error: `Free accounts get AI cards ${FREE_CARD_SESSIONS_PER_DAY}× a day. Upgrade to Plus for cards whenever you want.`,
        code: "cards_limit",
      }, { status: 402 })
    }

    const raw = await askGroq(SYSTEM_PROMPT, buildUserMessage(text, count, title), 6000, 0.4)
    if (typeof raw !== "string") return raw

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
