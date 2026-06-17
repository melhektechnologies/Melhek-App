'use client'

import { useState } from 'react'
import {
  Flame, Target, Phone, MessageCircle, FileText, TrendingUp, AlertTriangle,
  BarChart3, Zap, CheckCircle2, ChevronRight, Plus, Calendar, Users,
  DollarSign, Clock, Star, Edit3
} from 'lucide-react'
import { useOpportunities } from '@/hooks/useOpportunities'
import { useScorecard } from '@/hooks/useScorecard'
import { useRevenue, formatETB, noContactLabel } from '@/hooks/useRevenue'
import type { Opportunity } from '@/types'

// ─── Today's Focus Banner ─────────────────────────────────────
function MissionBanner({ stats }: { stats: ReturnType<typeof useRevenue>['stats'] }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const statusConfig = {
    ahead:    { text: 'Ahead of pace 🚀', color: '#00d084', bg: 'rgba(0,208,132,0.08)', border: 'rgba(0,208,132,0.2)' },
    on_pace:  { text: 'On pace 🎯', color: '#ffcc00', bg: 'rgba(255,204,0,0.08)', border: 'rgba(255,204,0,0.2)' },
    behind:   { text: 'Behind pace — take action now ⚡', color: '#ff6666', bg: 'rgba(255,68,68,0.08)', border: 'rgba(255,68,68,0.2)' },
  }[stats.status]

  return (
    <div className="rounded-2xl p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(0,128,255,0.1), rgba(0,212,255,0.05))', border: '1px solid rgba(0,128,255,0.2)' }}>
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-[0.06] pointer-events-none"
        style={{ background: '#0080FF', filter: 'blur(40px)', transform: 'translate(30%, -30%)' }} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-5 h-5" style={{ color: '#ff6b35' }} />
          <h1 className="text-xl font-bold" style={{ color: 'var(--melhek-text-primary)' }}>
            {greeting}, CEO.
          </h1>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--melhek-text-secondary)' }}>
          You need <strong style={{ color: '#00D4FF' }}>{formatETB(stats.dailyPaceRequired)}</strong> today to stay on pace for {formatETB(stats.goal)} in {stats.daysRemaining} days.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: statusConfig.bg, border: `1px solid ${statusConfig.border}`, color: statusConfig.color }}>
          {statusConfig.text}
        </div>
      </div>
    </div>
  )
}

// ─── Scorecard quick increment widget ────────────────────────
function ScorecardQuick() {
  const { today, increment, decrement, streak, dailyCompletion } = useScorecard()

  const metrics = [
    { label: 'Calls Made', key: 'calls_made' as const, icon: Phone, color: '#00d084' },
    { label: 'Follow-Ups', key: 'followups_sent' as const, icon: MessageCircle, color: '#00D4FF' },
    { label: 'Meetings', key: 'meetings_booked' as const, icon: Users, color: '#8b8bff' },
    { label: 'Proposals', key: 'proposals_sent' as const, icon: FileText, color: '#ff9500' },
    { label: 'Deals Closed', key: 'deals_closed' as const, icon: CheckCircle2, color: '#00d084' },
    { label: 'Revenue (ETB)', key: 'revenue_generated' as const, icon: DollarSign, color: '#ffcc00' },
  ]

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--melhek-text-secondary)' }}>
          Today's Scorecard
        </h2>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <span className="text-xs font-bold flex items-center gap-1" style={{ color: '#ff9500' }}>
              🔥 {streak}d
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <div className="relative w-8 h-8">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                <circle cx="16" cy="16" r="13" fill="none" stroke="#0080FF" strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 13}`}
                  strokeDashoffset={`${2 * Math.PI * 13 * (1 - dailyCompletion / 100)}`}
                  strokeLinecap="round" className="transition-all duration-700" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold" style={{ color: '#0080FF' }}>
                {dailyCompletion}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {metrics.map(({ label, key, icon: Icon, color }) => (
          <div key={key} className="rounded-xl p-2.5 flex flex-col gap-1.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-1.5">
              <Icon className="w-3 h-3 flex-shrink-0" style={{ color }} />
              <span className="text-[10px] truncate" style={{ color: 'var(--melhek-text-tertiary)' }}>{label}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => decrement(key)}
                className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 hover:bg-white/10 transition-colors"
                style={{ color: 'var(--melhek-text-tertiary)' }}>−</button>
              <span className="flex-1 text-center text-base font-bold tabular-nums" style={{ color }}>
                {today?.[key] ?? 0}
              </span>
              <button onClick={() => increment(key)}
                className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 hover:bg-white/10 transition-colors"
                style={{ color }}>+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Top Opportunities ────────────────────────────────────────
function TopOpportunities({ opps }: { opps: Opportunity[] }) {
  if (opps.length === 0) return null
  return (
    <div className="glass rounded-2xl p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--melhek-text-secondary)' }}>
        🏆 Top Opportunities
      </h2>
      <div className="space-y-2">
        {opps.slice(0, 5).map((opp, i) => (
          <div key={opp.id} className="flex items-center gap-3 py-2"
            style={{ borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(0,128,255,0.15)', color: '#0080FF' }}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--melhek-text-primary)' }}>{opp.company_name}</p>
              {opp.next_action && (
                <p className="text-xs truncate" style={{ color: 'var(--melhek-text-tertiary)' }}>→ {opp.next_action}</p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold" style={{ color: '#00D4FF' }}>{formatETB(opp.expected_revenue ?? 0)}</p>
              <p className="text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>{opp.probability}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Deals at Risk ────────────────────────────────────────────
function DealsAtRisk({ opps }: { opps: Opportunity[] }) {
  if (opps.length === 0) return (
    <div className="glass rounded-2xl p-5 flex flex-col items-center gap-2 py-8">
      <CheckCircle2 className="w-8 h-8 opacity-20" style={{ color: '#00d084' }} />
      <p className="text-sm font-medium" style={{ color: '#00d084' }}>No deals at risk</p>
      <p className="text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>All contacts are up to date 👌</p>
    </div>
  )

  return (
    <div className="glass rounded-2xl p-5" style={{ border: '1px solid rgba(255,68,68,0.15)' }}>
      <h2 className="text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: '#ff6666' }}>
        <AlertTriangle className="w-3.5 h-3.5" /> Deals at Risk ({opps.length})
      </h2>
      <div className="space-y-2">
        {opps.map((opp) => (
          <div key={opp.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
            style={{ background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.1)' }}>
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#ff6666' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--melhek-text-primary)' }}>{opp.company_name}</p>
              <p className="text-xs" style={{ color: '#ff9999' }}>{noContactLabel(opp.last_contact_date)}</p>
            </div>
            <div className="flex items-center gap-1">
              {opp.phone && (
                <a href={`tel:${opp.phone}`} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <Phone className="w-3.5 h-3.5" style={{ color: '#00d084' }} />
                </a>
              )}
              {opp.phone && (
                <a href={`https://wa.me/${opp.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" style={{ color: '#25d366' }} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Revenue Forecast ─────────────────────────────────────────
function RevenueForecast({ stats }: { stats: ReturnType<typeof useRevenue>['stats'] }) {
  const sprintEnd = new Date('2026-06-17')
  sprintEnd.setDate(sprintEnd.getDate() + 84)
  const projDate = new Date()
  projDate.setDate(projDate.getDate() + Math.floor((stats.goal - stats.closed) / Math.max(stats.currentDailyPace, 1)))

  return (
    <div className="glass rounded-2xl p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--melhek-text-secondary)' }}>
        📈 Revenue Forecast
      </h2>
      <div className="space-y-3">
        {[
          { label: 'Goal', value: formatETB(stats.goal), color: 'var(--melhek-text-secondary)' },
          { label: 'Closed', value: formatETB(stats.closed), color: '#00d084' },
          { label: 'Remaining', value: formatETB(stats.remaining), color: '#ff9500' },
          { label: 'At current pace', value: formatETB(stats.projectedTotal), color: stats.projectedTotal >= stats.goal ? '#00d084' : '#ff6666' },
          { label: 'Sprint ends', value: sprintEnd.toLocaleDateString('en-ET', { month: 'short', day: 'numeric' }), color: 'var(--melhek-text-secondary)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>{label}</span>
            <span className="text-sm font-bold" style={{ color }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── End of Day Reflection ────────────────────────────────────
function EODReflection() {
  const { today, saveReflection } = useScorecard()
  const [text, setText] = useState(today?.reflection ?? '')
  const [saved, setSaved] = useState(false)

  const save = async () => {
    await saveReflection(text)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="glass rounded-2xl p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--melhek-text-secondary)' }}>
        🌙 End of Day Reflection
      </h2>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="What went well today? What do you commit to tomorrow?..."
        rows={4}
        className="w-full px-3 py-2.5 rounded-xl text-sm resize-none outline-none"
        style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--melhek-text-primary)' }} />
      <button onClick={save}
        className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
        style={{ background: saved ? 'rgba(0,208,132,0.2)' : 'rgba(0,128,255,0.15)', color: saved ? '#00d084' : '#0080FF' }}>
        {saved ? '✓ Saved' : 'Save Reflection'}
      </button>
    </div>
  )
}

// ─── CEO Mode Page ────────────────────────────────────────────
export default function CEOModePage() {
  const { opportunities, loading: oppLoading } = useOpportunities()
  const revenue = useRevenue(opportunities)
  const { stats, topOpportunities, dealsAtRisk, followUpsToday, followUpsOverdue } = revenue

  return (
    <div className="h-full overflow-y-auto p-6 lg:p-8 space-y-6 pb-16">
      {/* Mission Banner */}
      <MissionBanner stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Scorecard */}
          <ScorecardQuick />

          {/* Follow-Up Today */}
          {followUpsToday.length > 0 && (
            <div className="glass rounded-2xl p-5" style={{ border: '1px solid rgba(255,204,0,0.15)' }}>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: '#ffcc00' }}>
                <Clock className="w-3.5 h-3.5" /> Follow-Up Today ({followUpsToday.length})
              </h2>
              <div className="space-y-2">
                {followUpsToday.map(opp => (
                  <div key={opp.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(255,204,0,0.05)', border: '1px solid rgba(255,204,0,0.1)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--melhek-text-primary)' }}>{opp.company_name}</p>
                      {opp.next_action && <p className="text-xs truncate" style={{ color: 'var(--melhek-text-tertiary)' }}>{opp.next_action}</p>}
                    </div>
                    <div className="flex gap-1">
                      {opp.phone && <a href={`tel:${opp.phone}`} className="p-1.5 rounded-lg hover:bg-white/5"><Phone className="w-3.5 h-3.5" style={{ color: '#00d084' }} /></a>}
                      {opp.phone && <a href={`https://wa.me/${opp.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-white/5"><MessageCircle className="w-3.5 h-3.5" style={{ color: '#25d366' }} /></a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overdue follow-ups */}
          {followUpsOverdue.length > 0 && (
            <div className="glass rounded-2xl p-5" style={{ border: '1px solid rgba(255,68,68,0.2)', animation: 'pulse-border 2s ease-in-out infinite' }}>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: '#ff4444' }}>
                <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> OVERDUE ({followUpsOverdue.length}) — Act Now
              </h2>
              <div className="space-y-2">
                {followUpsOverdue.map(opp => (
                  <div key={opp.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(255,68,68,0.07)', border: '1px solid rgba(255,68,68,0.15)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: '#ff9999' }}>{opp.company_name}</p>
                      <p className="text-xs" style={{ color: '#ff6666' }}>Overdue: {opp.next_action_date}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(255,68,68,0.15)', color: '#ff6666' }}>
                      {formatETB(opp.expected_revenue ?? 0)}
                    </span>
                    <div className="flex gap-1">
                      {opp.phone && <a href={`tel:${opp.phone}`} className="p-1.5 rounded-lg hover:bg-white/5"><Phone className="w-3.5 h-3.5" style={{ color: '#00d084' }} /></a>}
                      {opp.phone && <a href={`https://wa.me/${opp.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-white/5"><MessageCircle className="w-3.5 h-3.5" style={{ color: '#25d366' }} /></a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deals at risk */}
          <DealsAtRisk opps={dealsAtRisk} />

          {/* EOD Reflection */}
          <EODReflection />
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <RevenueForecast stats={stats} />
          <TopOpportunities opps={topOpportunities} />
        </div>
      </div>
    </div>
  )
}
