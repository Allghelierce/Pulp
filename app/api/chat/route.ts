import { NextResponse } from "next/server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { getAuthUser } from "@/lib/auth"

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

const DEFAULT_SYSTEM = `You are a helpful AI assistant inside a notebook app called Pulp. You help users understand, summarize, quiz, and explore their notes. Be conversational but concise. Use markdown formatting when helpful. If asked to quiz, give clear questions with answers after the user responds.`

export async function POST(request: Request) {
  try {
    const key = getRateLimitKey(request)
    if (!checkRateLimit(key, { windowMs: 60000, maxRequests: 20 })) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 })
    }

    const { prompt, text, personality } = await request.json()
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 })
    }

    const systemPrompt = personality
      ? `${DEFAULT_SYSTEM}\n\nADDITIONAL PERSONALITY INSTRUCTIONS (from user):\n${personality}`
      : DEFAULT_SYSTEM

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 1024,
        temperature: 0.5,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text ? `${prompt}\n\nContext:\n${text}` : prompt },
        ],
      }),
    })

    if (!response.ok) {
      console.error("Groq chat error:", response.status)
      return NextResponse.json({ error: "AI error" }, { status: 502 })
    }

    const data = await response.json()
    const result = data.choices?.[0]?.message?.content?.trim() || "I couldn't generate a response."

    return NextResponse.json({ result })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Chat failed" }, { status: 500 })
  }
}
