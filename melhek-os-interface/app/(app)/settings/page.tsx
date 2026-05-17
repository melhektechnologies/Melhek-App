'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { getInitials } from '@/lib/utils'
import { Loader2, Save, Key, User, Globe, Shield } from 'lucide-react'
import { toast } from 'sonner'

const TIMEZONES = [
  'Africa/Addis_Ababa', 'Africa/Nairobi', 'UTC',
  'Europe/London', 'America/New_York', 'America/Los_Angeles',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Tokyo',
]

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--melhek-text-primary)' }}>
          <span className="opacity-60">{icon}</span> {title}
        </h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wider block"
        style={{ color: 'var(--melhek-text-tertiary)' }}>{label}</label>
      {children}
    </div>
  )
}

const INPUT = {
  className: 'w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all',
  style: { background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' } as React.CSSProperties,
}

export default function SettingsPage() {
  const { profile, loading } = useUser()
  const supabase = useRef(createClient()).current

  // ─── Form state ─────────────────────────────────────────────
  const [fullName, setFullName] = useState('')
  const [timezone, setTimezone] = useState('Africa/Addis_Ababa')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // ─── Sync form when profile loads (useEffect, not render body) ─
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name)
      setTimezone(profile.timezone ?? 'Africa/Addis_Ababa')
    }
  }, [profile])

  // ─── Save profile ────────────────────────────────────────────
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !fullName.trim()) return
    setSavingProfile(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), timezone })
      .eq('id', profile.id)
    if (error) toast.error('Failed to save: ' + error.message)
    else toast.success('Profile saved')
    setSavingProfile(false)
  }

  // ─── Change password ─────────────────────────────────────────
  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) toast.error(error.message)
    else {
      toast.success('Password updated')
      setNewPassword('')
      setConfirmPassword('')
    }
    setSavingPassword(false)
  }

  // ─── Loading state ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-8 space-y-4 max-w-2xl">
        <div className="h-8 w-32 shimmer rounded" />
        {[...Array(2)].map((_, i) => <div key={i} className="h-48 shimmer rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl space-y-6 pb-12 overflow-y-auto h-full">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--melhek-text-primary)' }}>
          Settings
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--melhek-text-tertiary)' }}>
          Manage your account and preferences
        </p>
      </div>

      {/* ─── Profile Section ─────────────────────────────────── */}
      <Section title="Profile" icon={<User className="w-4 h-4" />}>
        <form onSubmit={saveProfile} className="space-y-4">
          {/* Avatar preview */}
          <div className="flex items-center gap-4 pb-2">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-black flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#00D4FF,#0080FF)' }}>
              {profile ? getInitials(profile.full_name) : '?'}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--melhek-text-primary)' }}>
                {profile?.full_name}
              </p>
              <p className="text-xs capitalize mt-0.5" style={{ color: 'var(--melhek-text-tertiary)' }}>
                {profile?.role} · Melhek OS
              </p>
            </div>
          </div>

          <Field label="Full Name">
            <input
              type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
              {...INPUT}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,128,255,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </Field>

          <Field label="Timezone">
            <select value={timezone} onChange={e => setTimezone(e.target.value)} {...INPUT}>
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </Field>

          <button type="submit" disabled={savingProfile}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-black press-scale disabled:opacity-60 transition-all"
            style={{ background: 'linear-gradient(135deg,#0080FF,#00D4FF)' }}>
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </button>
        </form>
      </Section>

      {/* ─── Password Section ─────────────────────────────────── */}
      <Section title="Change Password" icon={<Key className="w-4 h-4" />}>
        <form onSubmit={savePassword} className="space-y-4">
          <Field label="New Password">
            <input
              type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters" minLength={8}
              {...INPUT}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,128,255,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </Field>

          <Field label="Confirm Password">
            <input
              type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              {...INPUT}
              style={{
                ...INPUT.style,
                borderColor: confirmPassword && confirmPassword !== newPassword
                  ? 'rgba(255,68,68,0.5)' : 'rgba(255,255,255,0.08)',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,128,255,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor =
                confirmPassword && confirmPassword !== newPassword ? 'rgba(255,68,68,0.5)' : 'rgba(255,255,255,0.08)')}
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-xs mt-1" style={{ color: '#ff6666' }}>Passwords do not match</p>
            )}
          </Field>

          <button type="submit"
            disabled={savingPassword || newPassword.length < 8 || newPassword !== confirmPassword}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-black press-scale disabled:opacity-60 transition-all"
            style={{ background: 'linear-gradient(135deg,#0080FF,#00D4FF)' }}>
            {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Update Password
          </button>
        </form>
      </Section>

      {/* ─── About ───────────────────────────────────────────── */}
      <div className="glass rounded-2xl px-6 py-4">
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>
          <span>Melhek OS · Internal Productivity Platform</span>
          <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(0,128,255,0.1)', color: '#0080FF' }}>v1.0.0</span>
        </div>
      </div>
    </div>
  )
}
