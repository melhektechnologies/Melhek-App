'use client'

import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import type { ReactNode } from 'react'

interface KPICardProps {
  title: string
  value: string | number
  unit?: string
  change?: number
  icon?: ReactNode
  color?: 'blue' | 'cyan' | 'success' | 'warning'
}

export function KPICard({
  title,
  value,
  unit,
  change,
  icon,
  color = 'blue',
}: KPICardProps) {
  const colorClasses = {
    blue: { from: '#0080FF', to: 'rgba(0,128,255,0.3)' },
    cyan: { from: '#00D4FF', to: 'rgba(0,212,255,0.3)' },
    success: { from: '#00d084', to: 'rgba(0,208,132,0.3)' },
    warning: { from: '#ff9500', to: 'rgba(255,149,0,0.3)' },
  }

  const isPositive = change && change > 0

  return (
    <div className="group glass depth-2 rounded-xl p-4 lift-on-hover overflow-hidden" style={{ position: 'relative' }}>
      {/* Gradient accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '96px',
        height: '96px',
        background: `linear-gradient(135deg, ${colorClasses[color].from} 0%, ${colorClasses[color].to} 100%)`,
        opacity: 0.05,
        borderRadius: '9999px',
        filter: 'blur(48px)',
        marginRight: '-48px',
        marginTop: '-48px',
      }} />

      <div style={{ position: 'relative' }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--melhek-text-secondary)' }}>
              {title}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold" style={{ color: 'var(--melhek-text-primary)' }}>{value}</span>
              {unit && <span className="text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>{unit}</span>}
            </div>
          </div>
          {icon ? (
            <div style={{ color: 'var(--melhek-text-secondary)', opacity: 0.6 }}>
              {icon}
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--melhek-bg-3)' }}>
              <Activity className="w-5 h-5" style={{ color: 'var(--melhek-text-secondary)', opacity: 0.6 }} />
            </div>
          )}
        </div>

        {/* Change indicator */}
        {change !== undefined && (
          <div className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg" style={{
            backgroundColor: isPositive ? 'rgba(0,208,132,0.15)' : 'rgba(255,68,68,0.15)',
            color: isPositive ? '#00d084' : '#ff6666',
          }}>
            {isPositive ? (
              <>
                <TrendingUp className="w-3 h-3" />
                +{change}%
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3" />
                {change}%
              </>
            )}
          </div>
        )}

        {/* Bottom accent line */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(0,128,255,0.2), transparent)',
          opacity: 0,
          transition: 'opacity 0.3s ease',
        }} className="group-hover:opacity-100" />
      </div>
    </div>
  )
}
