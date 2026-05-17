'use client'

import { Code2, Users as UsersIcon } from 'lucide-react'

interface ProjectCardProps {
  name: string
  description: string
  progress: number
  team: number
  status: 'active' | 'completed' | 'paused'
}

export function ProjectCard({
  name,
  description,
  progress,
  team,
  status,
}: ProjectCardProps) {
  const statusColors = {
    active: { bg: 'rgba(0,128,255,0.15)', text: '#00D4FF' },
    completed: { bg: 'rgba(0,208,132,0.15)', text: '#00d084' },
    paused: { bg: 'rgba(255,149,0,0.15)', text: '#ffb347' },
  }

  return (
    <div className="group glass depth-2 rounded-xl p-5 lift-on-hover flex flex-col gap-4 overflow-hidden" style={{ position: 'relative' }}>
      {/* Accent gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '80px',
        height: '80px',
        background: 'linear-gradient(135deg, #00D4FF 0%, #0080FF 100%)',
        opacity: 0.05,
        borderRadius: '9999px',
        filter: 'blur(40px)',
        marginRight: '-40px',
        marginTop: '-40px',
      }} />

      <div style={{ position: 'relative' }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold mb-1 truncate transition-colors" style={{ color: 'var(--melhek-text-primary)' }}>
              {name}
            </h3>
            <p className="text-xs line-clamp-2" style={{ color: 'var(--melhek-text-secondary)' }}>
              {description}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--melhek-bg-3)' }}>
            <Code2 className="w-4 h-4" style={{ color: 'var(--melhek-text-secondary)', opacity: 0.6 }} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--melhek-text-secondary)' }}>Progress</span>
            <span className="text-xs font-semibold" style={{ color: '#0080FF' }}>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--melhek-bg-3)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #0080FF, #00D4FF)',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(0,128,255,0.1)' }}>
          <div className="flex items-center gap-2 text-xs">
            <UsersIcon className="w-3.5 h-3.5" style={{ color: 'var(--melhek-text-tertiary)' }} />
            <span style={{ color: 'var(--melhek-text-secondary)' }}>{team} members</span>
          </div>
          <div className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: statusColors[status].bg, color: statusColors[status].text }}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        </div>

        {/* Hover accent */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.2), transparent)',
          opacity: 0,
          transition: 'opacity 0.3s ease',
        }} className="group-hover:opacity-100" />
      </div>
    </div>
  )
}
