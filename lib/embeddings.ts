const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN
const HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
const HF_URL = `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}`

const CHUNK_SIZE = 400
const CHUNK_OVERLAP = 80

export function chunkText(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim()
  if (!clean) return []
  if (clean.length <= CHUNK_SIZE) return [clean]

  const chunks: string[] = []
  let start = 0
  while (start < clean.length) {
    let end = start + CHUNK_SIZE
    if (end < clean.length) {
      const lastSpace = clean.lastIndexOf(" ", end)
      if (lastSpace > start + CHUNK_SIZE / 2) end = lastSpace
    }
    chunks.push(clean.slice(start, end).trim())
    start = end - CHUNK_OVERLAP
  }
  return chunks.filter(c => c.length > 20)
}

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (!HF_TOKEN) throw new Error("HUGGINGFACE_API_TOKEN not set")
  if (!texts.length) return []

  const res = await fetch(HF_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: texts, options: { wait_for_model: true } }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`HuggingFace embedding error: ${res.status} ${err}`)
  }

  return res.json()
}

export function extractPageText(page: { boxes?: { content?: string }[] }): string {
  if (!page?.boxes) return ""
  return page.boxes
    .map(b => b.content || "")
    .filter(Boolean)
    .join(" ")
}
