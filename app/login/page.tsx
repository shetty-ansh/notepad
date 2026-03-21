'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { CustomToast } from '@/components/toastMessage'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'signup') {
        await signUp(email, password, name)
        toast.custom((id) => (
          <CustomToast
            type="success"
            title="Account created"
            message="Check your email to confirm your account, then log in."
          />
        ))
        setMode('login')
      } else {
        await signIn(email, password)
        router.push('/money')
        router.refresh()
      }
    } catch (err) {
      toast.custom((id) => (
        <CustomToast
          type="error"
          title={mode === 'signup' ? 'Sign up failed' : 'Login failed'}
          message={err instanceof Error ? err.message : 'Something went wrong'}
        />
      ))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] p-6">
  <div className="w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex bg-white">
    
    <div className="w-1/2 hidden md:block">
      <img
        src="/login-illustration.png"
        alt="login"
        className="h-full w-full object-cover"
      />
    </div>

    <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
      <button className="text-sm text-gray-500 mb-6 text-left">{mode === 'login' ? "Hello!": "Hey there!"}</button>

      <h1 className="text-3xl font-serif text-gray-900 leading-tight mb-6">
        Welcome {mode === 'login' ? "back": "onboard"}
        
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full h-11 px-4 rounded-lg bg-gray-100 text-sm outline-none"
            required
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
          className="w-full h-11 px-4 rounded-lg bg-gray-100 text-sm outline-none"
          required
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className="w-full h-11 px-4 rounded-lg bg-gray-100 text-sm outline-none"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-lg bg-black text-white text-sm font-medium hover:bg-green-800"
        >
          {loading
            ? mode === 'login'
              ? 'Signing in...'
              : 'Creating account...'
            : mode === 'login'
              ? 'Sign in'
              : 'Create account'}
        </button>
      </form>

      <p className="text-xs text-gray-500 mt-4">
        {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
        <button
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="ml-1 text-black font-medium"
        >
          {mode === 'login' ? 'Sign up' : 'Sign in'}
        </button>
      </p>

      <div className="mt-10 flex items-center gap-2 text-sm text-gray-600">
        <div className="w-5 h-5 bg-black rounded-full"></div>PLACEHOLDER TEXT
      </div>
    </div>
  </div>
</div>
  )
}
