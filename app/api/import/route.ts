import { NextResponse } from "next/server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { getAuthUser } from "@/lib/auth"
import { consumeAiQuota, importAllowance, consumeImportTopic, refundImportTopic } from "@/lib/aiQuota"
import { IMPORT_SYSTEM_PROMPT, MIN_TOPIC_TEXT, MAX_IMPORT_SECTION, buildImportMessage } from "@/lib/recallPrompt"
import { generateTopicCards, cleanKnownTopics } from "@/lib/topicCards"

// GET -> { remaining, limit, pro }. remaining = null for Pro (no lifetime cap).
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const allowance = await importAllowance(user.id)
    if (allowance instanceof NextResponse) return allowance
    return NextResponse.json(allowance)
  } catch (error) {
    console.error("Import allowance API error:", error)
    return NextResponse.json({ error: "Failed to load import allowance" }, { status: 500 })
  }
}

// POST { text, title?, heading?, topics? } -> { topic, cards, remaining }.
// One imported section -> one topic + cards. Spends one lifetime import credit
// (free accounts) BEFORE the AI call and refunds it if the AI gives nothing.
export async function POST(request: Request) {
  try {
    const key = getRateLimitKey(request)
    // Own bucket (shared IP key is also used by chat/embed/search) and >= 2x a full import.
    if (!checkRateLimit(`import:${key}`, { windowMs: 60000, maxRequests: 20 })) {
      return NextResponse.json({ error: "Too many requests. Try again in a moment." }, { status: 429 })
    }

    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json().catch(() => null)
    const text: string = typeof body?.text === "string" ? body.text.slice(0, MAX_IMPORT_SECTION) : ""
    const title: string = typeof body?.title === "string" ? body.title.slice(0, 200) : ""
    const heading: string = typeof body?.heading === "string" ? body.heading.slice(0, 120) : ""
    const topics = cleanKnownTopics(body?.topics)

    if (text.trim().length < MIN_TOPIC_TEXT) {
      return NextResponse.json({ error: "Not enough notes in this section." }, { status: 400 })
    }
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 })
    }

    const credit = await consumeImportTopic(user.id)
    if (credit instanceof NextResponse) return credit
    const refund = () => credit.charged ? refundImportTopic(user.id) : Promise.resolve()

    const overQuota = await consumeAiQuota(user.id, { metered: false })
    if (overQuota) { await refund(); return overQuota }

    let result
    try {
      result = await generateTopicCards(IMPORT_SYSTEM_PROMPT, buildImportMessage(text, title, heading, topics), "Import")
    } catch (err) {
      await refund()
      throw err
    }
    if ("error" in result) { await refund(); return result.error }
    if (!result.topic || result.cards.length === 0) {
      await refund()
      return NextResponse.json({ topic: result.topic, cards: [], remaining: credit.remaining == null ? null : credit.remaining + (credit.charged ? 1 : 0) })
    }
    return NextResponse.json({ topic: result.topic, cards: result.cards, remaining: credit.remaining })
  } catch (error) {
    console.error("Import API error:", error)
    const message = error instanceof Error ? error.message : "Failed to import notes"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
