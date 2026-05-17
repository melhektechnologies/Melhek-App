'use client'

import { Home, Settings, BarChart3, Zap, Users, FileText, HelpCircle, LogOut } from 'lucide-react'

export function Sidebar() {
  const navItems = [
    { icon: Home, label: 'Dashboard', badge: null },
    { icon: BarChart3, label: 'Analytics', badge: null },
    { icon: Zap, label: 'Operations', badge: '3' },
    { icon: Users, label: 'Team', badge: null },
    { icon: FileText, label: 'Reports', badge: null },
  ]

  const lowerItems = [
    { icon: HelpCircle, label: 'Help' },
    { icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="w-64 glass depth-2 flex flex-col" style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header */}
      <div className="px-4 py-6" style={{ borderBottom: '1px solid rgba(0,128,255,0.1)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0080FF] to-[#00D4FF] flex items-center justify-center">
            <span className="text-xs font-bold text-[#000000]">M</span>
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--melhek-text-primary)' }}>Melhek</div>
            <div className="text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>OS v2.1</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.label}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative"
            style={{ color: 'var(--melhek-text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--melhek-text-primary)'
              e.currentTarget.style.backgroundColor = 'var(--melhek-bg-3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--melhek-text-secondary)'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <div className="px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,128,255,0.2)', color: '#00D4FF', fontSize: '0.75rem', fontWeight: '500' }}>
                {item.badge}
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* Lower items */}
      <div className="px-3 py-4 space-y-1" style={{ borderTop: '1px solid rgba(0,128,255,0.1)' }}>
        {lowerItems.map((item) => (
          <button
            key={item.label}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{ color: 'var(--melhek-text-tertiary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--melhek-text-secondary)'
              e.currentTarget.style.backgroundColor = 'var(--melhek-bg-3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--melhek-text-tertiary)'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <item.icon className="w-4 h-4 opacity-50" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* User profile */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(0,128,255,0.1)' }}>
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer" 
             style={{ backgroundColor: 'rgba(31,31,53,0.5)' }}
             onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--melhek-bg-3)'}
             onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(31,31,53,0.5)'}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#0080FF]" />
            <div className="text-xs">
              <div className="font-medium" style={{ color: 'var(--melhek-text-primary)' }}>Alex Chen</div>
              <div style={{ color: 'var(--melhek-text-tertiary)' }}>admin</div>
            </div>
          </div>
          <LogOut className="w-3.5 h-3.5 transition-colors cursor-pointer" 
                  style={{ color: 'var(--melhek-text-tertiary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--melhek-text-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--melhek-text-tertiary)'}
          />
        </div>
      </div>
    </div>
  )
}
