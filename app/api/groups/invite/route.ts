import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"

// Public preview for an invite link: party name and how full it is. No auth,
// so it shows nothing beyond that.
export async function GET(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`group-invite:${ip}`, { maxRequests: 30, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const code = (new URL(req.url).searchParams.get("code") || "").trim().toUpperCase()
  if (!/^[A-Z0-9]{8}$/.test(code)) return NextResponse.json({ error: "Invalid code" }, { status: 404 })

  const { data: group } = await supabaseAdmin.from("study_groups")
    .select("id, name, status, max_members").eq("invite_code", code).maybeSingle()
  if (!group || group.status !== "active") return NextResponse.json({ error: "This invite has expired" }, { status: 404 })

  const { count } = await supabaseAdmin.from("group_members")
    .select("id", { count: "exact", head: true }).eq("group_id", group.id).eq("status", "active")
  return NextResponse.json({ name: group.name, members: count ?? 0, max: group.max_members })
}
