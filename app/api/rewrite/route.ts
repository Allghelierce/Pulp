import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { text } = await req.json()
    if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

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
      const err = await response.text()
      console.error("HF Error:", err)
      return NextResponse.json({ error: "HF integration failed" }, { status: response.status })
    }

    const result = await response.json()
    let rewritten = ""
    if (Array.isArray(result) && result[0]?.generated_text) {
      rewritten = result[0].generated_text.trim()
    } else if (result?.generated_text) {
      rewritten = result.generated_text.trim()
    } else {
      console.error("HF Unexpected Result:", result)
      return NextResponse.json({ error: "No text generated" }, { status: 500 })
    }

    return NextResponse.json({ rewritten })
  } catch (error) {
    console.error("Rewrite Error:", error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
