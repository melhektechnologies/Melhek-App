'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CheckSquare, FolderKanban,
  MessageSquareCode, Settings, HelpCircle, LogOut, Zap, FileText, CalendarDays,
  TrendingUp, Flame, BookOpen
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { getInitials } from '@/lib/utils'
import type { Profile } from '@/types'

const REVENUE_ITEMS = [
  { icon: TrendingUp, label: 'Pipeline',  href: '/pipeline' },
  { icon: Flame,      label: 'CEO Mode',  href: '/ceo' },
  { icon: BookOpen,   label: 'Proposals', href: '/proposals' },
]

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: CheckSquare, label: 'Tasks', href: '/tasks' },
  { icon: FolderKanban, label: 'Projects', href: '/projects' },
  { icon: FileText, label: 'Notes', href: '/notes' },
  { icon: CalendarDays, label: 'Calendar', href: '/calendar' },
  { icon: MessageSquareCode, label: 'AI Assistant', href: '/ai' },
]

const LOWER_ITEMS = [
  { icon: Settings, label: 'Settings', href: '/settings' },
  { icon: HelpCircle, label: 'Help', href: '/help' },
]

export function AppSidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const { signOut } = useUser()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <div
      className="hidden sm:flex w-64 flex-col flex-shrink-0 glass depth-2"
      style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Logo */}
      <div className="px-4 py-5" style={{ borderBottom: '1px solid rgba(0,128,255,0.1)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
            <img src="/logo.jpg" alt="Melhek Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight" style={{ color: 'var(--melhek-text-primary)' }}>
              Melhek OS
            </div>
            <div className="text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>v1.1 · Revenue OS</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {/* Revenue Section */}
        <div className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-1.5 flex items-center gap-1.5"
            style={{ color: '#0080FF' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block animate-pulse" />
            Revenue
          </p>
          {REVENUE_ITEMS.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group mb-0.5"
                style={{
                  color: active ? 'var(--melhek-text-primary)' : 'var(--melhek-text-secondary)',
                  background: active ? 'rgba(0,128,255,0.15)' : 'transparent',
                }}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                    style={{ background: 'linear-gradient(180deg,#0080FF,#00D4FF)' }} />
                )}
                <item.icon className="w-4 h-4 flex-shrink-0 transition-opacity"
                  style={{ color: active ? '#00D4FF' : undefined, opacity: active ? 1 : 0.6 }} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Divider */}
        <div className="mx-3 mb-3" style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

        {/* Core Section */}
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group"
                style={{
                  color: active ? 'var(--melhek-text-primary)' : 'var(--melhek-text-secondary)',
                  background: active ? 'rgba(0,128,255,0.12)' : 'transparent',
                }}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                    style={{ background: 'linear-gradient(180deg,#0080FF,#00D4FF)' }} />
                )}
                <item.icon className="w-4 h-4 flex-shrink-0 transition-opacity"
                  style={{ color: active ? '#00D4FF' : undefined, opacity: active ? 1 : 0.6 }} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Lower items */}
      <div className="px-3 pb-2 space-y-0.5" style={{ borderTop: '1px solid rgba(0,128,255,0.08)' }}>
        <div className="pt-2">
          {LOWER_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
              style={{ color: 'var(--melhek-text-tertiary)' }}
            >
              <item.icon className="w-4 h-4 opacity-60" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* User profile */}
      <div className="px-3 pb-4" style={{ borderTop: '1px solid rgba(0,128,255,0.08)' }}>
        <div className="pt-3 flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(31,31,53,0.5)' }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#0080FF] flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
              {profile ? getInitials(profile.full_name) : '?'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: 'var(--melhek-text-primary)' }}>
                {profile?.full_name ?? 'Loading…'}
              </div>
              <div className="text-xs capitalize" style={{ color: 'var(--melhek-text-tertiary)' }}>
                {profile?.role ?? ''}
              </div>
            </div>
          </div>
          <button onClick={signOut} title="Sign out" className="flex-shrink-0 p-1 rounded-lg transition-colors"
            style={{ color: 'var(--melhek-text-tertiary)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ff6666'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--melhek-text-tertiary)'}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
