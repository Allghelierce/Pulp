import { NextResponse } from "next/server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { getAuthUser } from "@/lib/auth"
import { consumeAiQuota, spendDailyAllowance, FREE_REPHRASE_PER_DAY } from "@/lib/aiQuota"
import { GRADE_MODEL, REPHRASE_SYSTEM_PROMPT, MAX_REPHRASE_CARDS, buildRephraseMessage, parseRephrase } from "@/lib/recallPrompt"

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

// POST { cards: [{ id, q, a }] } -> { alts: { [id]: string[] } }.
// One call per study session; the client saves the rephrasings on the cards.
export async function POST(request: Request) {
  try {
    if (!checkRateLimit(`rephrase:${getRateLimitKey(request)}`, { windowMs: 60000, maxRequests: 10 })) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json().catch(() => null)
    const raw: unknown[] = Array.isArray(body?.cards) ? body.cards : []
    // Real ids are short base36 hashes (cardId) — anything else would only inflate the prompt.
    const seen = new Set<string>()
    const cards = raw
      .map(c => c as { id?: unknown; q?: unknown; a?: unknown })
      .filter(c => typeof c.id === "string" && /^[a-z0-9]{1,16}$/.test(c.id) && !seen.has(c.id) && !!seen.add(c.id)
        && typeof c.q === "string" && typeof c.a === "string" && c.q.trim())
      .slice(0, MAX_REPHRASE_CARDS) as { id: string; q: string; a: string }[]
    if (!cards.length) return NextResponse.json({ alts: {} })

    const overQuota = await consumeAiQuota(user.id, { metered: false })
    if (overQuota) return overQuota
    if (!(await spendDailyAllowance(user.id, "rephrase"))) {
      return NextResponse.json({
        error: `Free accounts get mixed-up wording in ${FREE_REPHRASE_PER_DAY} sessions a day.`,
        code: "rephrase_limit",
      }, { status: 402 })
    }

    const key = process.env.GROQ_API_KEY
    if (!key) return NextResponse.json({ error: "AI service not configured" }, { status: 503 })
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: GRADE_MODEL,
        max_tokens: 4000,
        temperature: 0.7,
        reasoning_effort: "low",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: REPHRASE_SYSTEM_PROMPT },
          { role: "user", content: buildRephraseMessage(cards) },
        ],
      }),
    })
    if (!res.ok) {
      console.error("Rephrase Groq error:", res.status)
      return NextResponse.json({ error: `AI service error (${res.status})` }, { status: res.status === 429 ? 429 : 502 })
    }
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    const alts = typeof content === "string" ? parseRephrase(content, new Map(cards.map(c => [c.id, { q: c.q, a: c.a }]))) : {}
    return NextResponse.json({ alts })
  } catch (error) {
    console.error("Rephrase API error:", error)
    return NextResponse.json({ error: "Failed to rephrase" }, { status: 500 })
  }
}
