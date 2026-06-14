#!/usr/bin/env node
// Offline eval harness for recall-card quality. Run:
//   node scripts/recall-eval.ts                  # all built-in samples
//   node scripts/recall-eval.ts bio              # one sample by name
//   node scripts/recall-eval.ts path/to/notes.txt   # your own notes
//   COUNT=10 TEMP=0.4 node scripts/recall-eval.ts
// Uses the SAME prompt/parser as production (lib/recallPrompt.ts), so what
// you see here is what users get. Tweak the prompt there, re-run, judge.

import { readFileSync } from "node:fs"
import { SYSTEM_PROMPT, MODEL, buildUserMessage, parseCards, type Card } from "../lib/recallPrompt.ts"

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

function loadKey(): string {
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY
  try {
    const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    const m = env.match(/^GROQ_API_KEY=(.+)$/m)
    if (m) return m[1].trim().replace(/^["']|["']$/g, "")
  } catch {}
  throw new Error("GROQ_API_KEY not found (env or .env.local)")
}

const SAMPLES: Record<string, { title: string; text: string }> = {
  bio: {
    title: "Cellular Respiration",
    text: `Glycolysis happens in the cytoplasm and splits one glucose into two pyruvate, netting 2 ATP and 2 NADH. It needs no oxygen.
The pyruvate enters the mitochondrial matrix and is converted to acetyl-CoA, releasing CO2 and making NADH.
The Krebs cycle (citric acid cycle) runs in the matrix. Each turn produces 3 NADH, 1 FADH2, 1 ATP (GTP), and 2 CO2. Two turns per glucose.
The electron transport chain is on the inner mitochondrial membrane. NADH and FADH2 donate electrons; the energy pumps protons into the intermembrane space, creating a gradient. ATP synthase uses this proton-motive force to make ATP. Oxygen is the final electron acceptor, forming water.
Total yield is roughly 30-32 ATP per glucose. Without oxygen, cells fall back on fermentation, which regenerates NAD+ so glycolysis can continue but makes far less ATP.`,
  },
  history: {
    title: "Causes of WWI",
    text: `The system of alliances split Europe into two blocs: the Triple Entente (France, Russia, Britain) and the Triple Alliance (Germany, Austria-Hungary, Italy). An attack on one risked dragging in all.
Militarism meant arms races, especially the naval rivalry between Britain and Germany over dreadnought battleships.
Imperialism created friction as powers competed for colonies and markets, raising tensions in places like Morocco and the Balkans.
Nationalism was strong in the Balkans, where Slavic groups under Austria-Hungary wanted independence, backed by Serbia and Russia.
The spark was the assassination of Archduke Franz Ferdinand in Sarajevo in June 1914 by Gavrilo Princip. Austria-Hungary's ultimatum to Serbia triggered the alliance chain, and within weeks the major powers were at war.`,
  },
  cs: {
    title: "Big-O & Data Structures",
    text: `Big-O describes how an algorithm's cost grows with input size n, ignoring constants. O(1) is constant, O(log n) logarithmic, O(n) linear, O(n log n), O(n^2) quadratic.
A hash table gives average O(1) lookup, insert, and delete, but O(n) worst case under heavy collisions. It trades memory for speed.
A balanced binary search tree gives O(log n) for search, insert, delete, and keeps elements ordered, which a hash table does not.
Binary search needs a sorted array and runs in O(log n) by halving the search space each step.
Arrays give O(1) index access but O(n) insertion in the middle; linked lists give O(1) insertion at a known node but O(n) access.`,
  },
}

function lint(cards: Card[]): string[] {
  const notes: string[] = []
  const whatIs = cards.filter(c => /^what (is|are)\b/i.test(c.q)).length
  if (whatIs > cards.length * 0.4) notes.push(`${whatIs}/${cards.length} are low-value "what is" questions`)
  const qs = cards.map(c => c.q.toLowerCase().trim())
  const dupes = qs.length - new Set(qs).size
  if (dupes > 0) notes.push(`${dupes} duplicate question(s)`)
  const yesNo = cards.filter(c => /^(is|are|does|do|did|can|was|were)\b/i.test(c.q)).length
  if (yesNo > 0) notes.push(`${yesNo} possibly yes/no question(s)`)
  const avgA = Math.round(cards.reduce((s, c) => s + c.a.split(/\s+/).length, 0) / cards.length)
  notes.push(`avg answer length: ${avgA} words`)
  const withHint = cards.filter(c => c.hint).length
  notes.push(`${withHint}/${cards.length} have hints`)
  return notes
}

async function run(name: string, title: string, text: string, count: number, temp: number) {
  console.log(`\n${"=".repeat(70)}\n  ${name}  —  "${title}"  (count=${count}, temp=${temp})\n${"=".repeat(70)}`)
  const t0 = Date.now()
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${loadKey()}` },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      temperature: temp,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(text, count, title) },
      ],
    }),
  })
  if (!res.ok) { console.error(`  HTTP ${res.status}: ${await res.text()}`); return }
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content ?? ""
  const cards = parseCards(raw)
  const ms = Date.now() - t0
  if (!cards.length) { console.error(`  PARSE FAILED. Raw:\n${raw}`); return }

  cards.forEach((c, i) => {
    console.log(`\n  ${i + 1}. Q: ${c.q}`)
    if (c.hint) console.log(`     hint: ${c.hint}`)
    console.log(`     A: ${c.a}`)
  })
  console.log(`\n  ── lint ──`)
  lint(cards).forEach(n => console.log(`     • ${n}`))
  console.log(`     • ${cards.length} cards in ${ms}ms`)
}

const arg = process.argv[2]
const count = Number(process.env.COUNT) || 8
const temp = Number(process.env.TEMP) || 0.4

if (arg && (arg.includes("/") || arg.endsWith(".txt") || arg.endsWith(".md"))) {
  await run("file", arg, readFileSync(arg, "utf8"), count, temp)
} else if (arg && SAMPLES[arg]) {
  await run(arg, SAMPLES[arg].title, SAMPLES[arg].text, count, temp)
} else if (arg) {
  console.error(`Unknown sample "${arg}". Options: ${Object.keys(SAMPLES).join(", ")}, or a file path.`)
  process.exit(1)
} else {
  for (const [name, s] of Object.entries(SAMPLES)) await run(name, s.title, s.text, count, temp)
}
