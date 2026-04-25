'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { SignIn1 } from '@/components/ui/modern-stunning-sign-in'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) window.location.href = '/'
    }
    checkUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setError('Check your email to confirm your account.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else window.location.href = '/'
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    })
    if (error) setError(error.message)
  }

  return (
    <SignIn1
      email={email}
      password={password}
      error={error}
      isSignUp={isSignUp}
      loading={loading}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      onToggleMode={() => { setIsSignUp(v => !v); setError('') }}
      onGoogleSignIn={handleGoogle}
    />
  )
}
