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
    if (!password || typeof password !== "string") {
      return { success: false, error: "Invalid password" }
    }

    if (password.length < 1) {
      return { success: false, error: "Invalid password" }
    }

    // Verify the password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: (await supabase.auth.getUser()).data.user?.email || "",
      password,
    })

    if (signInError) {
      return { success: false, error: "Invalid password" }
    }

    if (deleteType === "account") {
      // Delete user account
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)
      if (deleteError) {
        return { success: false, error: "Failed to delete account" }
      }
    } else {
      // Delete user notes (would need to implement in your database)
      // For now, this is a placeholder
      console.log("Delete notes for user:", userId)
    }

    return { success: true }
  } catch (error) {
    console.error("Password verification error:", error)
    return { success: false, error: "An error occurred" }
  }
}
