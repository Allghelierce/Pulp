import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import {
  hasPro, freeWritingAiLeft, dailyAllowanceLeft, importAllowance,
  FREE_AI_LIMIT, IMPORT_FREE_TOPICS, FREE_CARD_SESSIONS_PER_DAY, FREE_GRADES_PER_DAY,
} from "@/lib/aiQuota"

// GET -> the signed-in user's plan and what's left of the free AI taste.
export async function GET(req: Request) {
  if (!checkRateLimit(`plan:${getRateLimitKey(req)}`, { maxRequests: 60, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const plus = await hasPro(user.id)
  const { data } = await supabaseAdmin.from("player_profiles").select("pro_expires_at").eq("user_id", user.id).maybeSingle()
  const imports = await importAllowance(user.id)

  return NextResponse.json({
    plus,
    plusUntil: plus ? (data?.pro_expires_at ?? null) : null,
    free: plus ? null : {
      writingAiLeft: await freeWritingAiLeft(user.id),
      importsLeft: imports instanceof NextResponse ? null : imports.remaining,
      cardSessionsLeftToday: await dailyAllowanceLeft(user.id, "cards"),
      gradesLeftToday: await dailyAllowanceLeft(user.id, "grades"),
    },
    limits: { writingAi: FREE_AI_LIMIT, imports: IMPORT_FREE_TOPICS, cardSessionsPerDay: FREE_CARD_SESSIONS_PER_DAY, gradesPerDay: FREE_GRADES_PER_DAY },
  })
}
