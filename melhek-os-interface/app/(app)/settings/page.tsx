'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { getInitials } from '@/lib/utils'
import { Loader2, Save, Key, User, Globe } from 'lucide-react'
import { toast } from 'sonner'

const TIMEZONES = [
  'Africa/Addis_Ababa', 'Africa/Nairobi', 'UTC',
  'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Dubai',
]

export default function SettingsPage() {
  const { profile, loading } = useUser()
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [timezone, setTimezone] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  // Init form when profile loads
  if (profile && !fullName && !timezone) {
    setFullName(profile.full_name)
    setTimezone(profile.timezone)
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !fullName.trim()) return
    setSavingProfile(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), timezone })
      .eq('id', profile.id)
    if (error) toast.error('Failed to save profile')
    else toast.success('Profile updated')
    setSavingProfile(false)
  }

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) toast.error(error.message)
    else { toast.success('Password updated'); setCurrentPassword(''); setNewPassword('') }
    setSavingPassword(false)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3" style={{ color: 'var(--melhek-text-tertiary)' }}>
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--melhek-text-primary)' }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--melhek-text-tertiary)' }}>Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--melhek-text-primary)' }}>
            <User className="w-4 h-4 opacity-60" /> Profile
          </h2>
        </div>
        <form onSubmit={saveProfile} className="px-6 py-5 space-y-4">
          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00D4FF] to-[#0080FF] flex items-center justify-center text-xl font-bold text-black">
              {profile ? getInitials(profile.full_name) : '?'}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--melhek-text-primary)' }}>{profile?.full_name}</p>
              <p className="text-xs capitalize" style={{ color: 'var(--melhek-text-tertiary)' }}>{profile?.role}</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--melhek-text-tertiary)' }}>Full Name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' }}
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--melhek-text-tertiary)' }}>
              <div className="flex items-center gap-1"><Globe className="w-3 h-3" /> Timezone</div>
            </label>
            <select value={timezone} onChange={e => setTimezone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' }}>
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>

          <button type="submit" disabled={savingProfile}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-black transition-all press-scale disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#0080FF,#00D4FF)' }}>
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </button>
        </form>
      </div>

      {/* Password Section */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--melhek-text-primary)' }}>
            <Key className="w-4 h-4 opacity-60" /> Change Password
          </h2>
        </div>
        <form onSubmit={savePassword} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--melhek-text-tertiary)' }}>New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters" minLength={8}
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' }}
            />
          </div>
          <button type="submit" disabled={savingPassword || newPassword.length < 8}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-black transition-all press-scale disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#0080FF,#00D4FF)' }}>
            {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            Update Password
          </button>
        </form>
      </div>

      {/* About */}
      <div className="glass rounded-2xl px-6 py-5">
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>
          <span>Melhek OS · Internal Productivity System</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  )
}
