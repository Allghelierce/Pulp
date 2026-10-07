import { NextResponse } from "next/server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { getAuthUser } from "@/lib/auth"
import { consumeAiQuota } from "@/lib/aiQuota"
import { TOPIC_SYSTEM_PROMPT, MIN_TOPIC_TEXT, buildTopicMessage } from "@/lib/recallPrompt"
import { generateTopicCards, cleanKnownTopics } from "@/lib/topicCards"

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

    const result = await generateTopicCards(TOPIC_SYSTEM_PROMPT, buildTopicMessage(text, title, topics), "Recall topic")
    if ("error" in result) return result.error
    return NextResponse.json(result)
  } catch (error) {
    console.error("Recall topic API error:", error)
    const message = error instanceof Error ? error.message : "Failed to tag topic"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
