'use client'

import { CheckCircle2, Clock, AlertCircle } from 'lucide-react'

interface TaskCardProps {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  status: 'completed' | 'in-progress' | 'blocked'
  assignee: string
  dueDate: string
}

export function TaskCard({
  title,
  description,
  priority,
  status,
  assignee,
  dueDate,
}: TaskCardProps) {
  const statusConfig = {
    completed: { icon: CheckCircle2, bgColor: 'rgba(0,208,132,0.15)', textColor: '#00d084', label: 'Completed' },
    'in-progress': { icon: Clock, bgColor: 'rgba(0,128,255,0.15)', textColor: '#0080FF', label: 'In Progress' },
    blocked: { icon: AlertCircle, bgColor: 'rgba(255,149,0,0.15)', textColor: '#ff9500', label: 'Blocked' },
  }

  const priorityConfig = {
    high: { bg: 'rgba(255,68,68,0.2)', text: '#ff6666' },
    medium: { bg: 'rgba(255,149,0,0.2)', text: '#ffb347' },
    low: { bg: 'rgba(0,128,255,0.2)', text: '#00b4ff' },
  }

  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <div className="group glass depth-2 rounded-xl p-5 lift-on-hover flex flex-col gap-3" style={{ position: 'relative' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold mb-1 truncate transition-colors" style={{ color: 'var(--melhek-text-primary)' }}>
            {title}
          </h3>
          <p className="text-xs line-clamp-2" style={{ color: 'var(--melhek-text-secondary)' }}>
            {description}
          </p>
        </div>
        <div className="flex-shrink-0 p-2 rounded-lg flex items-center justify-center" style={{ backgroundColor: config.bgColor, color: config.textColor }}>
          <StatusIcon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(0,128,255,0.1)' }}>
        <div className="flex items-center gap-3 text-xs">
          <span className="px-2 py-1 rounded font-medium" style={{ backgroundColor: priorityConfig[priority].bg, color: priorityConfig[priority].text }}>
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </span>
          <span style={{ color: 'var(--melhek-text-tertiary)' }}>{assignee}</span>
        </div>
        <span className="text-xs flex-shrink-0" style={{ color: 'var(--melhek-text-tertiary)' }}>{dueDate}</span>
      </div>

      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(0,128,255,0) 0%, rgba(0,212,255,0) 100%)',
        pointerEvents: 'none',
      }} className="group-hover:from-[#0080FF]/5 group-hover:to-[#00D4FF]/5 transition-all" />
    </div>
  )
}
