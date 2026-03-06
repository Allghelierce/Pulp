'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  // 1. The Gatekeeper: Bounces you home if you're already signed in
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        window.location.href = '/' 
      }
    }
    checkUser()
  }, [])

  // 2. The Auth Logic: Handles creating accounts or logging in
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) alert(error.message)
      else alert('Success! You can now log in.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
      else window.location.href = '/'
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <form onSubmit={handleAuth} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
        
        <input 
          type="email" 
          placeholder="Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-sm outline-none focus:border-zinc-600"
          required
        />
        
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-sm outline-none focus:border-zinc-600"
          required
        />
        
        <button type="submit" className="w-full bg-white text-black p-2 rounded font-medium hover:bg-zinc-200 transition-colors">
          {isSignUp ? 'Sign Up' : 'Log In'}
        </button>
        
        <button 
          type="button" 
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-xs text-zinc-500 hover:text-white transition-colors"
        >
          {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
        </button>
      </form>
    </div>
  )
}