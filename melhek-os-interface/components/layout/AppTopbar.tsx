'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Bell, Loader2 } from 'lucide-react'
import { getInitials, formatDate, getPriorityConfig } from '@/lib/utils'
import type { Profile } from '@/types'

interface SearchResult {
  tasks: { id: string; title: string; status: string; priority: string; due_date: string | null; project?: { name: string; color: string } | null }[]
  projects: { id: string; name: string; status: string; color: string; icon: string }[]
}

export function AppTopbar({ profile }: { profile: Profile | null }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); setOpen(false); return }
    setSearching(true)
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
    const data: SearchResult = await res.json()
    setResults(data)
    setOpen(true)
    setSearching(false)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setQuery(v)
    search(v)
  }

  const go = (href: string) => {
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  const totalResults = (results?.tasks.length ?? 0) + (results?.projects.length ?? 0)

  return (
    <div
      className="h-14 px-6 flex items-center justify-between gap-4 flex-shrink-0 relative z-20"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,10,20,0.6)', backdropFilter: 'blur(12px)' }}
    >
      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <div className="relative">
          {searching
            ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" style={{ color: 'var(--melhek-text-tertiary)' }} />
            : <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--melhek-text-tertiary)' }} />
          }
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onFocus={() => { if (results && totalResults > 0) setOpen(true) }}
            placeholder="Search tasks, projects…"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none transition-all"
            style={{
              background: 'var(--melhek-bg-2)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'var(--melhek-text-primary)',
            }}
            onFocusCapture={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0,128,255,0.5)'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,128,255,0.08)'
            }}
            onBlurCapture={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
        </div>

        {/* Dropdown */}
        {open && results && (
          <div
            className="absolute top-full mt-2 w-full rounded-xl overflow-hidden depth-3"
            style={{ background: 'var(--melhek-bg-2)', border: '1px solid rgba(0,128,255,0.15)', zIndex: 50 }}
          >
            {totalResults === 0 ? (
              <div className="px-4 py-3 text-sm" style={{ color: 'var(--melhek-text-tertiary)' }}>No results found</div>
            ) : (
              <>
                {results.tasks.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--melhek-text-tertiary)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      Tasks
                    </div>
                    {results.tasks.map(t => {
                      const p = getPriorityConfig(t.priority as 'low')
                      return (
                        <button key={t.id} onMouseDown={() => go(`/tasks?id=${t.id}`)}
                          className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-white/5 transition-colors">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.dot }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm truncate" style={{ color: 'var(--melhek-text-primary)' }}>{t.title}</div>
                            {t.due_date && <div className="text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>{formatDate(t.due_date)}</div>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
                {results.projects.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--melhek-text-tertiary)', borderBottom: '1px solid rgba(255,255,255,0.05)', borderTop: results.tasks.length > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
                      Projects
                    </div>
                    {results.projects.map(p => (
                      <button key={p.id} onMouseDown={() => go(`/projects/${p.id}`)}
                        className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-white/5 transition-colors">
                        <span className="text-base">{p.icon}</span>
                        <div className="text-sm" style={{ color: 'var(--melhek-text-primary)' }}>{p.name}</div>
                        <div className="ml-auto">
                          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg transition-colors relative" style={{ color: 'var(--melhek-text-secondary)' }}>
          <Bell className="w-4 h-4" />
        </button>
        <div
          className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#0080FF] flex items-center justify-center text-xs font-bold text-black cursor-pointer flex-shrink-0"
          title={profile?.full_name}
        >
          {profile ? getInitials(profile.full_name) : '?'}
        </div>
      </div>
    </div>
  )
}
