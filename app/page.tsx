"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import PulpLanding from "./pulp-landing"

// Signed-in visitors normally go straight to the app — but not when they're on the site
// for an upgrade: resuming one after sign-in (?checkout=plan), cancelling Stripe Checkout
// (its back arrow → ?upgrade_cancelled=1), or pressing the browser's Back button out of it.
function stayOnSite(): boolean {
  if (/[?&](checkout=plus_(monthly|yearly)|upgrade_cancelled=1)\b/.test(window.location.search)) return true
  const nav = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined
  return nav?.type === "back_forward"
}

export default function RootPage() {
  const [status, setStatus] = useState<'loading' | 'authed' | 'guest'>('loading')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) {
        // Stale/invalid refresh token — purge local session so it stops recurring.
        supabase.auth.signOut({ scope: 'local' })
        setStatus('guest')
      } else if (user && !stayOnSite()) {
        window.location.href = '/app'
      } else {
        // Signed out, finishing an upgrade (?checkout=plan), or back from Stripe Checkout:
        // stay on the site, which opens/returns to Checkout directly, never via the app.
        setStatus('guest')
      }
    })
  }, [])

  if (status === 'loading') return null
  return <PulpLanding />
}
