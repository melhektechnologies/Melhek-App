'use client'

import { useUser } from '@/hooks/useUser'
import { AppSidebar } from '@/components/layout/AppSidebar'
import CommandPalette from '@/components/layout/CommandPalette'
import { AppTopbar } from '@/components/layout/AppTopbar'
import { GridBackground } from '@/components/melhek/grid-background'
import { Loader2 } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useUser()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0080FF] to-[#00D4FF] flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-black animate-spin" />
          </div>
          <p className="text-sm" style={{ color: 'var(--melhek-text-tertiary)' }}>Loading Melhek OS…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <GridBackground />
      <div className="flex h-screen overflow-hidden relative z-10">
        <AppSidebar profile={profile} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppTopbar profile={profile} />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
      <CommandPalette />
    </div>
  )
}
