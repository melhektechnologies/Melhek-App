'use client'

import { Search, Bell, Grid3X3, Eye } from 'lucide-react'

export function CommandBar() {
  return (
    <div className="h-16 glass px-8 flex items-center justify-between gap-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: 'var(--melhek-text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search • ⌘K"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm transition-all duration-200 focus:outline-none"
            style={{ 
              backgroundColor: 'var(--melhek-bg-2)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--melhek-text-primary)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--melhek-bg-3)'
              e.currentTarget.style.borderColor = 'rgba(0,128,255,0.5)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--melhek-bg-2)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
            }}
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* View toggle */}
        <button className="p-2 rounded-lg transition-all duration-200 press-scale" style={{ color: 'var(--melhek-text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--melhek-text-primary)'
            e.currentTarget.style.backgroundColor = 'var(--melhek-bg-2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--melhek-text-secondary)'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Grid toggle */}
        <button className="p-2 rounded-lg transition-all duration-200 press-scale" style={{ color: 'var(--melhek-text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--melhek-text-primary)'
            e.currentTarget.style.backgroundColor = 'var(--melhek-bg-2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--melhek-text-secondary)'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <Grid3X3 className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg transition-all duration-200 press-scale group" style={{ color: 'var(--melhek-text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--melhek-text-primary)'
            e.currentTarget.style.backgroundColor = 'var(--melhek-bg-2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--melhek-text-secondary)'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <Bell className="w-4 h-4" />
          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ff4444] animate-pulse" />
        </button>

        {/* Status indicator */}
        <div className="ml-2 pl-2 flex items-center gap-2" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-[#00d084] animate-pulse" />
            <span style={{ color: 'var(--melhek-text-secondary)' }}>Live</span>
          </div>
        </div>
      </div>
    </div>
  )
}
