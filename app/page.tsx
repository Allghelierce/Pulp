"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import PulpLanding from "./pulp-landing"

export default function RootPage() {
  const [status, setStatus] = useState<'loading' | 'authed' | 'guest'>('loading')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        window.location.href = '/app'
      } else {
        setStatus('guest')
      }
    })
  }, [])

  if (status === 'loading') return null
  return <PulpLanding />
}
