import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"

// Max AI requests per user per UTC day, across every AI route. Each request is
// already capped by max_tokens, so this bounds worst-case spend per account.
const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT) || 300
// Forever free allowance for writing AI before Plus is required (like Notion's trial credits).
export const FREE_AI_LIMIT = Number(process.env.AI_FREE_LIMIT) || 50
const DEV_USER_ID = "00000000-0000-0000-0000-000000000000"

const warnedMissing = new Set<string>()

// Missing migration / RPC: log once, then fail open so an outage doesn't take AI down.
function failOpen(rpc: string, error: { code?: string; message: string }): null {
  const missing = error.code === "PGRST202" || error.code === "42883" || error.code === "42P01" || error.code === "42703"
  if (!missing || !warnedMissing.has(rpc)) console.error(`AI quota (${rpc}) failed:`, error.code, error.message)
  if (missing) warnedMissing.add(rpc)
  return null
}

export async function hasPro(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin.from("player_profiles")
    .select("pro_access, pro_expires_at").eq("user_id", userId).maybeSingle()
  if (!data?.pro_access) return false
  return !data.pro_expires_at || new Date(data.pro_expires_at).getTime() > Date.now()
}

// Returns an error response when the user can't make this AI request, otherwise null.
// `metered` routes (writing AI) spend the forever free allowance for non-Pro users;
// recall + search are part of the core study loop and only hit the daily cap.
export async function consumeAiQuota(userId: string, { metered = true }: { metered?: boolean } = {}): Promise<NextResponse | null> {
  if (userId === DEV_USER_ID || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null

  if (metered && !(await hasPro(userId))) {
    const { data, error } = await supabaseAdmin.rpc("consume_free_ai", { p_user: userId, p_limit: FREE_AI_LIMIT })
    if (error) return failOpen("consume_free_ai", error)
    if (data == null) {
      return NextResponse.json(
        { error: `You've used all ${FREE_AI_LIMIT} free AI requests. Upgrade to Plus to keep using AI.`, code: "ai_upgrade" },
        { status: 402 }
      )
    }
  }

  const { data, error } = await supabaseAdmin.rpc("consume_ai_quota", { p_user: userId, p_limit: DAILY_LIMIT })
  if (error) return failOpen("consume_ai_quota", error)
  if (data == null) {
    return NextResponse.json(
      { error: `You've hit today's AI limit (${DAILY_LIMIT} requests). It resets at midnight UTC.` },
      { status: 429 }
    )
  }
  return null
}

// ── note import: lifetime pool of AI-carded sections for free accounts ──
export const IMPORT_FREE_TOPICS = Number(process.env.IMPORT_FREE_TOPICS) || 12

export interface ImportAllowance { remaining: number | null; limit: number; pro: boolean }

function importUnavailable(rpc: string, error?: { code?: string; message: string }): NextResponse {
  if (error) console.error(`Import quota (${rpc}) failed:`, error.code, error.message)
  return NextResponse.json({ error: "Note import isn't available right now.", code: "import_unavailable" }, { status: 503 })
}

// Current import allowance. Fails CLOSED (503) when the migration is missing —
// imports are bulk AI spend, so never treat a broken counter as unlimited.
export async function importAllowance(userId: string): Promise<ImportAllowance | NextResponse> {
  if (userId === DEV_USER_ID) return { remaining: null, limit: IMPORT_FREE_TOPICS, pro: true }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return importUnavailable("config")
  if (await hasPro(userId)) return { remaining: null, limit: IMPORT_FREE_TOPICS, pro: true }
  const { data, error } = await supabaseAdmin.from("player_profiles")
    .select("import_topics_used").eq("user_id", userId).maybeSingle()
  if (error) return importUnavailable("import_topics_used", error)
  const used = Number((data as { import_topics_used?: number } | null)?.import_topics_used ?? 0)
  return { remaining: Math.max(0, IMPORT_FREE_TOPICS - used), limit: IMPORT_FREE_TOPICS, pro: false }
}

// Spend one import credit BEFORE the AI call. Pro / dev skip the lifetime cap.
// Returns the allowance after spending (charged=true means refund on failure), or an error response.
export async function consumeImportTopic(userId: string): Promise<(ImportAllowance & { charged: boolean }) | NextResponse> {
  if (userId === DEV_USER_ID) return { remaining: null, limit: IMPORT_FREE_TOPICS, pro: true, charged: false }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return importUnavailable("config")
  if (await hasPro(userId)) return { remaining: null, limit: IMPORT_FREE_TOPICS, pro: true, charged: false }
  const { data, error } = await supabaseAdmin.rpc("consume_import_topic", { p_user: userId, p_limit: IMPORT_FREE_TOPICS })
  if (error) return importUnavailable("consume_import_topic", error)
  if (data == null) {
    return NextResponse.json(
      { error: "You've used your free imports. Upgrade to Plus to import more.", code: "import_limit" },
      { status: 402 }
    )
  }
  return { remaining: Math.max(0, IMPORT_FREE_TOPICS - Number(data)), limit: IMPORT_FREE_TOPICS, pro: false, charged: true }
}

// Give back a credit spent on a failed/empty AI call. Best effort; logs on failure.
export async function refundImportTopic(userId: string): Promise<void> {
  if (userId === DEV_USER_ID || !process.env.SUPABASE_SERVICE_ROLE_KEY) return
  const { error } = await supabaseAdmin.rpc("refund_import_topic", { p_user: userId })
  if (error) console.error("Import quota (refund_import_topic) failed:", error.code, error.message)
}

// ── Plus: daily free taste of AI recall ─────────────────────────────
// Free accounts get AI cards from a few focus sessions a day and a few AI-graded
// answers a day, so their trees always have something to grow from; Plus is
// limited only by the daily fair-use cap above.
export const FREE_CARD_SESSIONS_PER_DAY = Number(process.env.FREE_CARD_SESSIONS_PER_DAY) || 2
export const FREE_GRADES_PER_DAY = Number(process.env.FREE_GRADES_PER_DAY) || 15
export type AllowanceKind = "cards" | "grades"
const DAILY_FREE: Record<AllowanceKind, number> = { cards: FREE_CARD_SESSIONS_PER_DAY, grades: FREE_GRADES_PER_DAY }

// Spend one of today's free uses. true = allowed. Plus/dev always allowed.
// Fails OPEN if the migration is missing: recall is the core study loop.
export async function spendDailyAllowance(userId: string, kind: AllowanceKind): Promise<boolean> {
  if (userId === DEV_USER_ID || !process.env.SUPABASE_SERVICE_ROLE_KEY) return true
  if (await hasPro(userId)) return true
  const { data, error } = await supabaseAdmin.rpc("consume_daily_allowance", { p_user: userId, p_kind: kind, p_limit: DAILY_FREE[kind] })
  if (error) { failOpen("consume_daily_allowance", error); return true }
  return data != null
}

// Today's remaining free uses (null = unlimited / unknown).
export async function dailyAllowanceLeft(userId: string, kind: AllowanceKind): Promise<number | null> {
  if (userId === DEV_USER_ID || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabaseAdmin.from("ai_allowance").select("used")
    .eq("user_id", userId).eq("kind", kind).eq("day", today).maybeSingle()
  if (error) return null
  return Math.max(0, DAILY_FREE[kind] - Number((data as { used?: number } | null)?.used ?? 0))
}

export async function freeWritingAiLeft(userId: string): Promise<number | null> {
  if (userId === DEV_USER_ID || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  const { data, error } = await supabaseAdmin.from("player_profiles").select("ai_free_used").eq("user_id", userId).maybeSingle()
  if (error) return null
  return Math.max(0, FREE_AI_LIMIT - Number((data as { ai_free_used?: number } | null)?.ai_free_used ?? 0))
}
