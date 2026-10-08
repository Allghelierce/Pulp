"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import PulpLanding from "./pulp-landing"

export default function RootPage() {
  const [status, setStatus] = useState<'loading' | 'authed' | 'guest'>('loading')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) {
        // Stale/invalid refresh token — purge local session so it stops recurring.
        supabase.auth.signOut({ scope: 'local' })
        setStatus('guest')
      } else if (user && !/[?&]checkout=plus_(monthly|yearly)\b/.test(window.location.search)) {
        window.location.href = '/app'
      } else {
        // Signed out, or finishing an upgrade (?checkout=plan): stay on the site,
        // which opens Stripe Checkout directly instead of going through the app.
        setStatus('guest')
      }
    })
  }, [])

  if (status === 'loading') return null
  return <PulpLanding />
}
