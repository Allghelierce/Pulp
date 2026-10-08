import { NextResponse } from "next/server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { getAuthUser } from "@/lib/auth"
import { consumeAiQuota, spendDailyAllowance } from "@/lib/aiQuota"
import { TOPIC_SYSTEM_PROMPT, TOPIC_ONLY_SYSTEM_PROMPT, IMPORT_SYSTEM_PROMPT, MIN_TOPIC_TEXT, buildTopicMessage, buildImportMessage } from "@/lib/recallPrompt"
import { generateTopicCards, cleanKnownTopics, cleanKnownQuestions } from "@/lib/topicCards"

// POST { text, title?, topics? } -> { topic, cards }. Called once at focus-session end
// with the text written during the session. `topics` = the notebook's existing topic
// names, so the AI reuses one (e.g. an imported topic) instead of inventing a new tree.
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

    const body = await request.json()
    const text: string = typeof body?.text === "string" ? body.text : ""
    const title: string = typeof body?.title === "string" ? body.title.slice(0, 200) : ""
    const topics = cleanKnownTopics(body?.topics)

    if (text.trim().length < MIN_TOPIC_TEXT) {
      return NextResponse.json({ error: "Not enough new notes." }, { status: 400 })
    }

    // Free accounts: AI cards from a few sessions a day; after that, name the
    // topic only so the tree still gets one (cardsLimited tells the UI why).
    const cardsOk = await spendDailyAllowance(user.id, "cards")
    // mode "page": a notebook page carded on demand by full review (existing notes, not a session).
    const pageMode = body?.mode === "page"
    // Page mode has no tree to name — past the allowance, skip the AI call entirely.
    if (pageMode && !cardsOk) return NextResponse.json({ topic: "", cards: [], cardsLimited: true })
    const result = cardsOk
      ? (pageMode
          ? await generateTopicCards(IMPORT_SYSTEM_PROMPT, buildImportMessage(text, title, undefined, topics, cleanKnownQuestions(body?.existing)), "Recall page")
          : await generateTopicCards(TOPIC_SYSTEM_PROMPT, buildTopicMessage(text, title, topics), "Recall topic"))
      : await generateTopicCards(TOPIC_ONLY_SYSTEM_PROMPT, buildTopicMessage(text, title, topics), "Recall topic (name only)", { topicOnly: true })
    if ("error" in result) return result.error
    return NextResponse.json(cardsOk ? result : { topic: result.topic, cards: [], cardsLimited: true })
  } catch (error) {
    console.error("Recall topic API error:", error)
    const message = error instanceof Error ? error.message : "Failed to tag topic"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
