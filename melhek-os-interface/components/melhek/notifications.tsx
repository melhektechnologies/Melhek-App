'use client'

import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

interface NotificationItem {
  id: string
  type: 'error' | 'success' | 'info' | 'warning'
  title: string
  message: string
  timestamp: string
}

export function Notifications() {
  const notifications: NotificationItem[] = [
    {
      id: '1',
      type: 'error',
      title: 'Database Sync Failed',
      message: 'Unable to sync with primary database. Retry scheduled in 30s.',
      timestamp: '2 min ago',
    },
    {
      id: '2',
      type: 'success',
      title: 'Deployment Complete',
      message: 'v2.1.4 deployed to production. 0 errors, 3 warnings.',
      timestamp: '8 min ago',
    },
    {
      id: '3',
      type: 'warning',
      title: 'High CPU Usage',
      message: 'API server cluster running at 87% capacity.',
      timestamp: '15 min ago',
    },
    {
      id: '4',
      type: 'info',
      title: 'Team Member Joined',
      message: 'Sarah Johnson was added to the Platform team.',
      timestamp: '1 hour ago',
    },
  ]

  const typeConfig = {
    error: { icon: AlertCircle, bg: 'rgba(255,68,68,0.15)', border: 'rgba(255,68,68,0.3)', text: '#ff6666' },
    success: { icon: CheckCircle2, bg: 'rgba(0,208,132,0.15)', border: 'rgba(0,208,132,0.3)', text: '#00d084' },
    warning: { icon: AlertCircle, bg: 'rgba(255,149,0,0.15)', border: 'rgba(255,149,0,0.3)', text: '#ffb347' },
    info: { icon: Info, bg: 'rgba(0,128,255,0.15)', border: 'rgba(0,128,255,0.3)', text: '#00D4FF' },
  }

  return (
    <div className="glass depth-2 rounded-xl p-5 space-y-3 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--melhek-text-primary)' }}>Notifications</h3>
        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: 'rgba(0,128,255,0.2)', color: '#00D4FF' }}>
          {notifications.length}
        </span>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => {
          const config = typeConfig[notification.type]
          const Icon = config.icon

          return (
            <div
              key={notification.id}
              className="group p-3 rounded-lg border transition-all duration-200 cursor-pointer"
              style={{ 
                backgroundColor: config.bg,
                borderColor: config.border,
                color: config.text,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 128, 255, 0.2), 0 0 40px rgba(0, 212, 255, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div className="flex gap-3">
                <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: 'var(--melhek-text-primary)' }}>
                    {notification.title}
                  </div>
                  <p className="text-xs line-clamp-2 mb-2" style={{ color: 'var(--melhek-text-secondary)' }}>
                    {notification.message}
                  </p>
                  <div className="text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>
                    {notification.timestamp}
                  </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: 'var(--melhek-text-secondary)' }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* View all button */}
      <button className="w-full mt-4 pt-4 text-xs font-medium transition-colors py-2" 
        style={{ 
          borderTop: '1px solid rgba(0,128,255,0.1)',
          color: '#0080FF',
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#00D4FF'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#0080FF'}
      >
        View all notifications
      </button>
    </div>
  )
}
