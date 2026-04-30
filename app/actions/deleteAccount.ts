"use server"

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "" // Use service role for admin operations
)

export async function verifyPasswordAndDelete(
  userId: string,
  password: string,
  deleteType: "account" | "notes"
): Promise<{ success: boolean; error?: string }> {
  try {
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

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    })

    if (signInError) {
      return { success: false, error: "Invalid password" }
    }

    if (deleteType === "account") {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)
      if (deleteError) {
        return { success: false, error: "Failed to delete account" }
      }
    } else {
      console.log("Delete notes for user:", userId)
    }

    return { success: true }
  } catch (error) {
    console.error("Password verification error:", error)
    return { success: false, error: "An error occurred" }
  }
}
