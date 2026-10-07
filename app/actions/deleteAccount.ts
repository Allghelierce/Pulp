"use server"

import { createClient } from "@supabase/supabase-js"

// Tables holding a user's own rows. Not all cascade from auth.users, so clear them first.
const NOTE_TABLES = ["notes", "folders", "trash"]
const ACCOUNT_TABLES = [...NOTE_TABLES, "settings", "achievements", "daily_stats", "player_profiles"]

export async function verifyPasswordAndDelete(
  userId: string,
  password: string,
  deleteType: "account" | "notes",
  identity: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return { success: false, error: "Server configuration error" }
    }
    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    if (!password || typeof password !== "string" || password.length < 1) {
      return { success: false, error: "Invalid password" }
    }

    if (!userId || typeof userId !== "string") {
      return { success: false, error: "Invalid user" }
    }

    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)
    if (userError || !user?.email) {
      return { success: false, error: "User not found" }
    }

    const verifyClient = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { error: signInError } = await verifyClient.auth.signInWithPassword({
      email: user.email,
      password,
    })

    if (signInError) {
      return { success: false, error: "Invalid password" }
    }

    // The typed username/email must actually be this account's.
    const typed = (identity || "").trim().toLowerCase().replace(/^@/, "")
    const { data: profile } = await supabase.from("player_profiles").select("username").eq("user_id", userId).maybeSingle()
    const matches = typed && (typed === user.email.toLowerCase() || (profile?.username && typed === String(profile.username).toLowerCase()))
    if (!matches) {
      return { success: false, error: "That username or email doesn't match this account" }
    }

    if (deleteType === "account") {
      for (const table of ACCOUNT_TABLES) await supabase.from(table).delete().eq("user_id", userId)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)
      if (deleteError) {
        console.error("Account delete failed:", deleteError.message)
        return { success: false, error: "Failed to delete account" }
      }
    } else {
      const { error: deleteError } = await supabase.from("notes").delete().eq("user_id", userId)
      if (deleteError) {
        return { success: false, error: "Failed to delete notes" }
      }
      await supabase.from("folders").delete().eq("user_id", userId)
      await supabase.from("trash").delete().eq("user_id", userId)
    }

    return { success: true }
  } catch (error) {
    console.error("Password verification error:", error)
    return { success: false, error: "An error occurred" }
  }
}
