'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Zap, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { GridBackground } from '@/components/melhek/grid-background'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative">
      <GridBackground />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0080FF] to-[#00D4FF] flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(0,128,255,0.4)]">
            <Zap className="w-7 h-7 text-black" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--melhek-text-primary)' }}>
            Melhek OS
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--melhek-text-secondary)' }}>
            Internal productivity system
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 depth-2"
          style={{
            background: 'rgba(21,21,39,0.8)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--melhek-text-primary)' }}>
            Sign in to your workspace
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--melhek-text-secondary)' }}>
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--melhek-text-tertiary)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@melhek.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none"
                  style={{
                    background: 'var(--melhek-bg-2)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--melhek-text-primary)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,128,255,0.6)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,128,255,0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--melhek-text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--melhek-text-tertiary)' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none"
                  style={{
                    background: 'var(--melhek-bg-2)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--melhek-text-primary)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,128,255,0.6)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,128,255,0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
                style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', color: '#ff6666' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-black transition-all press-scale mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #0080FF, #00D4FF)' }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = '0 0 24px rgba(0,128,255,0.5)' }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--melhek-text-tertiary)' }}>
          Melhek Technologies · Internal System · v1.0
        </p>
      </div>
    </div>
  )
}
