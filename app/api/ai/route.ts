import { NextResponse } from "next/server"

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

async function callGroq(prompt: string, context?: string): Promise<string> {
  const systemPrompt = "You are a helpful writing assistant. Provide concise, helpful responses to user requests about their text. Be direct and clear."

  const userMessage = context
    ? `User request: ${prompt}\n\nText to work with:\n${context}`
    : prompt

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mixtral-8x7b-32768",
      max_tokens: 512,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Groq error response:", errorText)
    throw new Error(`Groq API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  if (data.choices?.[0]?.message?.content) {
    return data.choices[0].message.content.trim()
  }

  throw new Error("Invalid Groq response format")
}

export async function POST(request: Request) {
  try {
    const { prompt, text } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 })
    }

    const result = await callGroq(prompt, text)
    return NextResponse.json({ result })
  } catch (error) {
    console.error("AI API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 }
    )
  }
}
