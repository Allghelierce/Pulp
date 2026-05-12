import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { TREE_TYPES } from "@/app/constants"

const VALID_TREE_TYPES = new Set(Object.keys(TREE_TYPES).filter(k => k !== 'spoiled'))

const XP_FORMULA = (minutes: number) => Math.max(10, Math.round(minutes * 3 + Math.pow(minutes / 10, 1.5)))

export async function POST(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`grove:${ip}`, { maxRequests: 10, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { treeType, notebookId, timerDuration } = body

  if (!treeType || !VALID_TREE_TYPES.has(treeType)) {
    return NextResponse.json({ error: "Invalid tree type" }, { status: 400 })
  }

  const duration = Number(timerDuration)
  if (!duration || duration < 60 || duration > 7200) {
    return NextResponse.json({ error: "Invalid timer duration" }, { status: 400 })
  }

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('player_profiles')
    .select('grove, juice, gems, inventory')
    .eq('user_id', user.id)
    .single()

  if (profileErr || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  const grove: any[] = profile.grove || []
  const inventory: Record<string, number> = profile.inventory || {}

  if (treeType !== 'tangerine') {
    const stock = inventory[treeType] || 0
    if (stock <= 0) {
      return NextResponse.json({ error: "Seed not in inventory" }, { status: 400 })
    }
    inventory[treeType] = stock - 1
    if (inventory[treeType] <= 0) delete inventory[treeType]
  }

  const minutes = duration / 60
  const xpReward = XP_FORMULA(minutes)

  const nbId = notebookId || '_unassigned'
  let plotsFull = false
  const treesInNb = grove.filter((t: any) => (t.notebookId || '_unassigned') === nbId).length
  if (treesInNb >= 90) plotsFull = true

  let newTree = null
  if (!plotsFull) {
    newTree = {
      id: Date.now(),
      type: treeType,
      stage: 4,
      progress: 100,
      plantedAt: Date.now(),
      notebookId: notebookId || undefined,
    }
    grove.push(newTree)
  }

  const { error: updateErr } = await supabaseAdmin
    .from('player_profiles')
    .update({ grove, juice: profile.juice, inventory })
    .eq('user_id', user.id)

  if (updateErr) {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }

  return NextResponse.json({
    tree: newTree,
    sap: profile.juice,
    xpReward,
    plotsFull,
  })
}
