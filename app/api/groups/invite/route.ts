import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { seasonOver, capOf, countActive, must, guarded } from "@/lib/partyServer"

// Public preview for an invite link: party name and how full it is. No auth,
// so it shows nothing beyond that.
export async function GET(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`group-invite:${ip}`, { maxRequests: 30, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const code = (new URL(req.url).searchParams.get("code") || "").trim().toUpperCase()
  if (!/^[A-Z0-9]{8}$/.test(code)) return NextResponse.json({ error: "Invalid code" }, { status: 404 })

  return guarded("load this invite", async () => {
    const group = must(await supabaseAdmin.from("study_groups")
      .select("id, name, status, max_members, term_end").eq("invite_code", code).maybeSingle(), "group")
    // Same test as joining: an expired season is over even before it's archived.
    if (!group || group.status !== "active" || seasonOver(group)) return NextResponse.json({ error: "This invite has expired" }, { status: 404 })
    return NextResponse.json({ name: group.name, members: await countActive(group.id), max: capOf(group) })
  })
}
