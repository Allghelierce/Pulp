"use server"

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId || typeof userId !== "string") {
      return { success: false, error: "Invalid user" }
    }
    if (!currentPassword || !newPassword) {
      return { success: false, error: "Both fields are required" }
    }
    if (newPassword.length < 6) {
      return { success: false, error: "New password must be at least 6 characters" }
    }

    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)
    if (userError || !user?.email) {
      return { success: false, error: "User not found" }
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (signInError) {
      return { success: false, error: "Current password is incorrect" }
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    })
    if (updateError) {
      return { success: false, error: "Failed to update password" }
    }

    return { success: true }
  } catch {
    return { success: false, error: "An error occurred" }
  }
}
