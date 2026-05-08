import { NextResponse } from 'next/server'
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { getAuthUser } from "@/lib/auth"

const MAX_TEXT_LENGTH = 5000

export async function POST(req: Request) {
  try {
    // Rate limiting
    const key = getRateLimitKey(req)
    if (!checkRateLimit(key, { windowMs: 60000, maxRequests: 15 })) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH}` }, { status: 400 })
    }

    if (!process.env.HUGGINGFACE_API_TOKEN) {
      return NextResponse.json({ error: "Rewrite service not configured" }, { status: 503 })
    }

    const response = await fetch("https://api-inference.huggingface.co/models/google/gemma-2-2b-it", {
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      method: "POST",
      body: JSON.stringify({
        inputs: `Rewrite the following text to be more clear, professional, and well-written. Keep the original meaning but improve the flow and tone. Only return the rewritten text and nothing else.\n\nText: ${text}\n\nRewritten:`,
        parameters: { max_new_tokens: 250, return_full_text: false, temperature: 0.7, stop: ["\n", "Text:", "Rewritten:"] }
      }),
    })

    if (!response.ok) {
      console.error("HF Error:", response.status)
      return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
    }

    const result = await response.json()
    let rewritten = ""
    if (Array.isArray(result) && result[0]?.generated_text) {
      rewritten = result[0].generated_text.trim()
    } else if (result?.generated_text) {
      rewritten = result.generated_text.trim()
    } else {
      return NextResponse.json({ error: "Failed to generate text" }, { status: 500 })
    }

    return NextResponse.json({ rewritten })
  } catch (error) {
    console.error("Rewrite Error:", error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
