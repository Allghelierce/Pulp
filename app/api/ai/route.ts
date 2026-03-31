import { NextResponse } from "next/server"

const API_TOKEN = process.env.HUGGINGFACE_API_TOKEN
const API_URL = "https://api-inference.huggingface.co/models/google/gemma-2-2b-it"

const PROMPTS: Record<string, (text: string) => string> = {
  quiz: (text) => `Generate 5 quiz questions with answers based on this text:\n\n${text}`,
  summarize: (text) => `Summarize this in 3 bullet points:\n\n${text}`,
  explain: (text) => `Explain this clearly and simply:\n\n${text}`,
  outline: (text) => `Create a structured outline for this content:\n\n${text}`,
  improve: (text) => `Improve the writing quality and clarity of this:\n\n${text}`,
}

async function callHuggingFace(prompt: string): Promise<string> {
  const response = await fetch(API_URL, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
    method: "POST",
    body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 500 } }),
  })

  if (!response.ok) {
    throw new Error(`HuggingFace API error: ${response.statusText}`)
  }

  const result = await response.json()
  if (Array.isArray(result) && result[0]?.generated_text) {
    return result[0].generated_text
  }

  throw new Error("Unexpected HuggingFace response format")
}

export async function POST(request: Request) {
  try {
    const { action, text } = await request.json()

    if (!action || !text) {
      return NextResponse.json({ error: "Missing action or text" }, { status: 400 })
    }

    const promptFn = PROMPTS[action]
    if (!promptFn) {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }

    const prompt = promptFn(text)
    const result = await callHuggingFace(prompt)

    return NextResponse.json({ result })
  } catch (error) {
    console.error("AI API error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
