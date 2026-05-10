<<<<<<< Updated upstream
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
=======
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '@/lib/actions/auth'
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
        const result = await signIn(email, password)
        if (!result.ok) {
          toast.custom(() => (
            <CustomToast
              type="error"
              title="Login failed"
              message={
                result.errorCode === 'INVALID_CREDENTIALS'
                  ? 'Wrong email or password. Please try again.'
                  : result.message || 'Something went wrong'
              }
            />
          ))
          return
        }
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
    <div className="min-h-screen flex items-center justify-center bg-[#F5F4F0] p-6">
      <div className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-[0_8px_48px_rgba(0,0,0,0.10)] flex bg-white">

        {/* Left image panel */}
        <div className="w-1/2 hidden md:block">
          <img
            src="/orbit-landing-bg.png"
            alt="Orbit"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Right form panel */}
        <div className="w-full md:w-1/2 px-10 py-12 flex flex-col justify-center">

          {/* Eyebrow */}
          <p className="text-[9px] tracking-[0.28em] uppercase font-medium text-black/30 mb-5">
            {mode === 'login' ? 'Welcome back' : 'Get started'}
          </p>

          {/* Heading */}
          <h1 className="text-[2rem] font-bold tracking-[-0.03em] leading-tight text-black mb-1">
            {mode === 'login' ? 'Sign in to Orbit' : 'Create your account'}
          </h1>
          <p className="text-[12px] text-black/38 mb-8 leading-relaxed">
            {mode === 'login'
              ? 'Your money, goals, and habits are waiting.'
              : 'Everything that matters, one place.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full h-11 px-4 rounded-[8px] bg-black/[0.04] text-[13px] text-black placeholder:text-black/30 outline-none border border-transparent focus:border-black/20 transition-colors"
                required
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full h-11 px-4 rounded-[8px] bg-black/[0.04] text-[13px] text-black placeholder:text-black/30 outline-none border border-transparent focus:border-black/20 transition-colors"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full h-11 px-4 rounded-[8px] bg-black/[0.04] text-[13px] text-black placeholder:text-black/30 outline-none border border-transparent focus:border-black/20 transition-colors"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-[8px] bg-black text-white text-[11px] font-semibold tracking-[0.12em] uppercase hover:bg-black/75 disabled:opacity-50 transition-all duration-300 mt-1"
            >
              {loading
                ? mode === 'login' ? 'Signing in…' : 'Creating account…'
                : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-[11px] text-black/35 mt-4">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="ml-1.5 text-black font-semibold hover:text-black/60 transition-colors"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          {/* Brand mark */}
          <div className="mt-10 pt-6 border-t border-black/[0.06] flex items-center gap-2.5">
            <div className="w-4 h-4 bg-black rounded-full" />
            <span className="text-[9px] tracking-[0.22em] uppercase font-medium text-black/30">Orbit</span>
            <span className="text-[9px] text-black/18 ml-auto">Money · Goals · Life</span>
          </div>
        </div>
      </div>
    </div>
  )
}
>>>>>>> Stashed changes
