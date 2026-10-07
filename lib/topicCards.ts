import { NextResponse } from "next/server"
import { MODEL, GRADE_MODEL, parseTopicResult, type Card } from "@/lib/recallPrompt"

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

export type TopicCardsResult = { topic: string; cards: Card[] } | { error: NextResponse }

// One Groq call -> { topic, cards }. Shared by /api/recall/topic and /api/import.
// Returns { error } with a ready-to-send response on config/AI failure.
// `topicOnly` uses the small model with a short budget (free accounts past today's card allowance).
export async function generateTopicCards(system: string, user: string, label = "Recall topic", { topicOnly = false }: { topicOnly?: boolean } = {}): Promise<TopicCardsResult> {
  const key = process.env.GROQ_API_KEY
  if (!key) return { error: NextResponse.json({ error: "AI service not configured" }, { status: 503 }) }

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: topicOnly ? GRADE_MODEL : MODEL,
      max_tokens: topicOnly ? 600 : 4000,
      temperature: 0.3,
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
    console.error(`${label} Groq error:`, res.status, detail)
    if (res.status === 429) return { error: NextResponse.json({ error: "AI rate limit reached — try again shortly." }, { status: 429 }) }
    return { error: NextResponse.json({ error: `AI service error (${res.status})` }, { status: 502 }) }
  }

  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content
  if (typeof raw !== "string") return { error: NextResponse.json({ error: "Invalid response from AI" }, { status: 502 }) }
  return parseTopicResult(raw)
}

// Sanitize client-sent known topics: <= 30 non-empty strings of <= 40 chars, deduped.
export function cleanKnownTopics(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const t of raw) {
    if (typeof t !== "string") continue
    const s = t.trim().slice(0, 40)
    if (s && !out.includes(s)) out.push(s)
    if (out.length >= 30) break
  }
  return out
}
