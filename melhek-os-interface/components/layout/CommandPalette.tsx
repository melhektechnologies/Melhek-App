'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, FolderKanban, CheckSquare, FileText, Calendar, Zap, ArrowRight, CornerDownLeft } from 'lucide-react'

// ─── Search Result Type ─────────────────────────────────────
type SearchResult = {
  type: 'project' | 'task' | 'note'
  id: string
  title: string
  meta?: string
  icon?: string
  link: string
}

// ─── Quick Actions ──────────────────────────────────────────
const QUICK_ACTIONS = [
  { id: 'qa-task', title: 'Create new task', icon: CheckSquare, link: '/tasks?new=true', color: '#00d084' },
  { id: 'qa-note', title: 'Create new note', icon: FileText, link: '/notes?new=true', color: '#a855f7' },
  { id: 'qa-cal', title: 'View Calendar', icon: Calendar, link: '/calendar', color: '#ff9500' },
  { id: 'qa-ai', title: 'Ask ARIA AI', icon: Zap, link: '/ai', color: '#00D4FF' },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Toggle listener ──────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(open => !open)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // ─── Search handler ───────────────────────────────────────
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.results ?? [])
          setSelectedIndex(0)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // ─── Keyboard Navigation ──────────────────────────────────
  const items = query.length >= 2 ? results : QUICK_ACTIONS

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) return
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => (i + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => (i - 1 + items.length) % items.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = items[selectedIndex]
      if (item) {
        router.push(item.link)
        setOpen(false)
      }
    }
  }, [open, items, selectedIndex, router])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
      
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl depth-3 flex flex-col"
        style={{ 
          background: 'var(--melhek-bg-1)', 
          border: '1px solid rgba(0,128,255,0.2)',
          maxHeight: '60vh'
        }}>
        
        {/* ─── Search Input ────────────────────────────────── */}
        <div className="relative flex items-center px-4 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <Search className="w-5 h-5 opacity-50" style={{ color: 'var(--melhek-text-primary)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, projects, notes, or run commands..."
            className="w-full bg-transparent px-3 py-4 text-sm focus:outline-none placeholder:opacity-50"
            style={{ color: 'var(--melhek-text-primary)' }}
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin absolute right-4" style={{ color: '#0080FF' }} />}
          <div className="absolute right-4 flex items-center gap-1 opacity-50 hidden sm:flex">
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/10">ESC</kbd>
          </div>
        </div>

        {/* ─── Results List ────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-2"
             style={{ background: 'var(--melhek-bg-2)' }}>
          
          {items.length === 0 && query.length >= 2 && !loading ? (
            <div className="text-center py-10">
              <p className="text-sm" style={{ color: 'var(--melhek-text-tertiary)' }}>No results found for "{query}"</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {query.length < 2 && (
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" 
                   style={{ color: 'var(--melhek-text-tertiary)' }}>
                  Quick Actions
                </p>
              )}
              {query.length >= 2 && results.length > 0 && (
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" 
                   style={{ color: 'var(--melhek-text-tertiary)' }}>
                  Results
                </p>
              )}

              {items.map((item, index) => {
                const selected = index === selectedIndex
                
                // For Quick Actions
                if ('color' in item) {
                  const QA = item as typeof QUICK_ACTIONS[0]
                  return (
                    <div key={QA.id}
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => { router.push(QA.link); setOpen(false) }}
                      className="flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-colors"
                      style={{ 
                        background: selected ? 'rgba(255,255,255,0.06)' : 'transparent',
                      }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${QA.color}20`, color: QA.color }}>
                          <QA.icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--melhek-text-primary)' }}>
                          {QA.title}
                        </span>
                      </div>
                      {selected && <CornerDownLeft className="w-4 h-4 opacity-40" style={{ color: 'var(--melhek-text-primary)' }} />}
                    </div>
                  )
                }

                // For Search Results
                const Result = item as SearchResult
                return (
                  <div key={Result.id}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => { router.push(Result.link); setOpen(false) }}
                    className="flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-colors"
                    style={{ 
                      background: selected ? 'rgba(0,128,255,0.1)' : 'transparent',
                    }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ 
                          background: Result.type === 'project' ? 'rgba(0,128,255,0.1)' :
                                      Result.type === 'task' ? 'rgba(0,208,132,0.1)' : 'rgba(168,85,247,0.1)',
                          color: Result.type === 'project' ? '#00D4FF' :
                                 Result.type === 'task' ? '#00d084' : '#a855f7'
                        }}>
                        {Result.type === 'project' ? <FolderKanban className="w-4 h-4" /> :
                         Result.type === 'task' ? <CheckSquare className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--melhek-text-primary)' }}>
                          {Result.icon && <span className="mr-1">{Result.icon}</span>}
                          {Result.title}
                        </p>
                        <p className="text-xs truncate capitalize" style={{ color: 'var(--melhek-text-tertiary)' }}>
                          {Result.type} {Result.meta ? ` • ${Result.meta}` : ''}
                        </p>
                      </div>
                    </div>
                    {selected && <ArrowRight className="w-4 h-4" style={{ color: '#0080FF' }} />}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
