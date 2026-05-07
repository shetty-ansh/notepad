'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '@/lib/actions/auth'
import { toast } from 'sonner'
import { CustomToast } from '@/components/toastMessage'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'signup') {
        await signUp(email, password, name)
        toast.custom(() => (
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
      toast.custom(() => (
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
    <div className="min-h-[100svh] flex items-center justify-center bg-[#F5F4F0] p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-4xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row bg-white"
      >
        {/* Left image — hidden on mobile */}
        <div className="w-1/2 hidden md:block relative">
          <img
            src="/orbit-landing-bg.png"
            alt="Orbit"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <p className="text-white/60 text-[10px] tracking-[0.2em] uppercase font-medium">Welcome to</p>
            <p className="text-white text-2xl font-bold tracking-tight">Orbit</p>
            <p className="text-white/50 text-xs mt-1 leading-relaxed">Money · Goals · Todos · Habits · Notes</p>
          </div>
        </div>

        {/* Right form */}
        <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-center">
          {/* Mobile branding */}
          <div className="md:hidden mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">O</span>
              </div>
              <span className="text-sm font-bold tracking-[0.15em] uppercase text-black/70">Orbit</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <p className="text-sm text-black/40 mb-1">
              {mode === 'login' ? 'Hello!' : 'Hey there!'}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight leading-tight mb-6">
              Welcome {mode === 'login' ? 'back' : 'onboard'}
            </h1>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            className="space-y-3.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            {mode === 'signup' && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full h-11 px-4 rounded-lg bg-black/[0.04] text-sm outline-none border border-transparent focus:border-black/20 transition-colors"
                required
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              className="w-full h-11 px-4 rounded-lg bg-black/[0.04] text-sm outline-none border border-transparent focus:border-black/20 transition-colors"
              required
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full h-11 px-4 pr-11 rounded-lg bg-black/[0.04] text-sm outline-none border border-transparent focus:border-black/20 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-black text-white text-sm font-semibold tracking-wide hover:bg-black/80 disabled:opacity-50 transition-all duration-200 active:scale-[0.98]"
            >
              {loading
                ? mode === 'login'
                  ? 'Signing in...'
                  : 'Creating account...'
                : mode === 'login'
                  ? 'Sign in'
                  : 'Create account'}
            </button>
          </motion.form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs text-black/40 mt-5 text-center"
          >
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="ml-1 text-black font-semibold hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </motion.p>

          {/* Footer branding */}
          <div className="mt-8 sm:mt-10 flex items-center gap-2 text-black/20">
            <div className="w-4 h-4 bg-black/20 rounded-full" />
            <span className="text-[10px] tracking-[0.2em] uppercase font-medium">Orbit © 2026</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
