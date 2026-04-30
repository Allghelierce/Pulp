"use server"

import { createClient } from "@supabase/supabase-js"

export async function verifyPasswordAndDelete(
  userId: string,
  password: string,
  deleteType: "account" | "notes"
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

    if (deleteType === "account") {
      await supabase.from("notes").delete().eq("user_id", userId)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)
      if (deleteError) {
        return { success: false, error: "Failed to delete account" }
      }
    } else {
      const { error: deleteError } = await supabase.from("notes").delete().eq("user_id", userId)
      if (deleteError) {
        return { success: false, error: "Failed to delete notes" }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Password verification error:", error)
    return { success: false, error: "An error occurred" }
  }
}
