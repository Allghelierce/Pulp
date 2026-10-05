import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"

// Max AI requests per user per UTC day, across every AI route. Each request is
// already capped by max_tokens, so this bounds worst-case spend per account.
const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT) || 300
const DEV_USER_ID = "00000000-0000-0000-0000-000000000000"

let warnedMissing = false

// Returns a 429 response when the user is out of quota, otherwise null.
// Fails open (logs) if the DB is unreachable or the migration isn't applied,
// so an outage doesn't take AI down with it.
export async function consumeAiQuota(userId: string): Promise<NextResponse | null> {
  if (userId === DEV_USER_ID || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  const { data, error } = await supabaseAdmin.rpc("consume_ai_quota", { p_user: userId, p_limit: DAILY_LIMIT })
  if (error) {
    const missing = error.code === "PGRST202" || error.code === "42883" || error.code === "42P01"
    if (!missing || !warnedMissing) console.error("AI quota check failed:", error.code, error.message)
    if (missing) warnedMissing = true
    return null
  }
  if (data == null) {
    return NextResponse.json(
      { error: `You've hit today's AI limit (${DAILY_LIMIT} requests). It resets at midnight UTC.` },
      { status: 429 }
    )
  }
  return null
}
