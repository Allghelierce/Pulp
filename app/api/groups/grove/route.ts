import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { parseId } from "@/lib/social"
import { must, guarded } from "@/lib/partyServer"
import { TREE_TYPES } from "@/app/constants"

export async function GET(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`group-grove:${ip}`, { maxRequests: 40, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const id = parseId(new URL(req.url).searchParams.get('id'))
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  return guarded("load the grove", async () => {
    const membership = must(await supabaseAdmin.from('group_members')
      .select('status').eq('group_id', id).eq('user_id', user.id).maybeSingle(), 'membership')
    if (!membership || membership.status !== 'active') return NextResponse.json({ error: "Not a member" }, { status: 403 })

    // The party's most recent trees, newest first (the Party panel's grove strip).
    const data = must(await supabaseAdmin.from('group_trees')
      .select('user_id, tree, planted_at').eq('group_id', id).order('planted_at', { ascending: false }).limit(12), 'group_trees')
    // Older rows were stored unchecked: pass on only a known species and stage.
    const trees = (data ?? []).flatMap(r => {
      const t = (r.tree ?? {}) as { type?: unknown; stage?: unknown }
      if (typeof t.type !== 'string' || !Object.prototype.hasOwnProperty.call(TREE_TYPES, t.type)) return []
      const stage = typeof t.stage === 'number' && Number.isInteger(t.stage) && t.stage >= 0 && t.stage <= 4 ? t.stage : 3
      return [{ type: t.type, stage, user_id: r.user_id, planted_at: r.planted_at }]
    })
    return NextResponse.json({ trees })
  })
}
