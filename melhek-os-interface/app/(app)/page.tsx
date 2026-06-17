'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import { useTasks } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { useOpportunities } from '@/hooks/useOpportunities'
import { useRevenue, formatETB } from '@/hooks/useRevenue'
import { formatDate, isOverdue, isDueToday, getPriorityConfig, getStatusConfig, getProjectStatusConfig } from '@/lib/utils'
import {
  CheckSquare, FolderKanban, AlertCircle, TrendingUp, ArrowRight, Zap, Clock,
  Target, Flame, DollarSign, Calendar, ChevronRight, Phone, MessageCircle, AlertTriangle
} from 'lucide-react'

// ─── KPI Card ─────────────────────────────────────────────────
function KPICard({ title, value, sub, color, icon, href, loading }: {
  title: string; value: number; sub?: string; color: string
  icon: React.ReactNode; href?: string; loading?: boolean
}) {
  const card = (
    <div className="glass depth-2 rounded-2xl p-5 relative overflow-hidden lift-on-hover">
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${color}, transparent 65%)` }} />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--melhek-text-secondary)' }}>{title}</p>
          <div className="opacity-40" style={{ color }}>{icon}</div>
        </div>
        {loading
          ? <div className="h-8 w-12 rounded shimmer" />
          : <div className="text-3xl font-bold tabular-nums" style={{ color: 'var(--melhek-text-primary)' }}>{value}</div>
        }
        {sub && <p className="text-xs mt-1" style={{ color: 'var(--melhek-text-tertiary)' }}>{sub}</p>}
      </div>
    </div>
  )
  return href ? <Link href={href}>{card}</Link> : card
}

// ─── Revenue Command Center ───────────────────────────────────
function RevenueCommandCenter() {
  const { opportunities, loading } = useOpportunities()
  const { stats, dealsAtRisk, followUpsOverdue, pipelineValue } = useRevenue(opportunities)

  const statusConfig = {
    ahead:    { label: 'Ahead of Pace', color: '#00d084', bg: 'rgba(0,208,132,0.08)', ring: 'rgba(0,208,132,0.3)', glow: '#00d084' },
    on_pace:  { label: 'On Pace',       color: '#ffcc00', bg: 'rgba(255,204,0,0.08)', ring: 'rgba(255,204,0,0.3)',   glow: '#ffcc00' },
    behind:   { label: 'Behind Pace',   color: '#ff4444', bg: 'rgba(255,68,68,0.08)', ring: 'rgba(255,68,68,0.3)',   glow: '#ff4444' },
  }[stats.status]

  const circumference = 2 * Math.PI * 54 // r=54
  const dashOffset = circumference * (1 - stats.progressPercent / 100)

  return (
    <div className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.6), rgba(1,42,45,0.4))',
        border: '1px solid rgba(0,128,255,0.2)',
      }}>
      {/* Ambient glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${statusConfig.glow}30, transparent 70%)` }} />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4" style={{ color: '#0080FF' }} />
              <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--melhek-text-secondary)' }}>
                Revenue Command Center
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: statusConfig.bg, color: statusConfig.color, border: `1px solid ${statusConfig.ring}` }}>
                {statusConfig.label}
              </span>
              {stats.daysRemaining > 0 && (
                <span className="text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>
                  {stats.daysRemaining} days remaining
                </span>
              )}
            </div>
          </div>
          <Link href="/pipeline"
            className="flex items-center gap-1 text-xs font-medium transition-colors"
            style={{ color: '#0080FF' }}
            onMouseEnter={e => e.currentTarget.style.color = '#00D4FF'}
            onMouseLeave={e => e.currentTarget.style.color = '#0080FF'}>
            Pipeline <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex items-center gap-6 lg:gap-10">
          {/* Circular Progress */}
          <div className="relative flex-shrink-0 w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
              {/* Track */}
              <circle cx="64" cy="64" r="54" fill="none"
                stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              {/* Progress */}
              <circle cx="64" cy="64" r="54" fill="none"
                stroke={statusConfig.color} strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={loading ? circumference : dashOffset}
                className="transition-all duration-1000 ease-out"
                style={{ filter: `drop-shadow(0 0 6px ${statusConfig.color}80)` }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {loading ? (
                <div className="w-10 h-3 rounded shimmer" />
              ) : (
                <>
                  <span className="text-2xl font-black tabular-nums" style={{ color: statusConfig.color }}>
                    {Math.round(stats.progressPercent)}%
                  </span>
                  <span className="text-[10px] font-medium" style={{ color: 'var(--melhek-text-tertiary)' }}>
                    of goal
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Goal',         value: formatETB(stats.goal),              color: 'var(--melhek-text-secondary)' },
              { label: 'Closed',       value: formatETB(stats.closed),            color: '#00d084' },
              { label: 'Remaining',    value: formatETB(stats.remaining),         color: stats.remaining > 0 ? '#ff9500' : '#00d084' },
              { label: 'Daily Pace',   value: formatETB(Math.round(stats.dailyPaceRequired)), color: '#0080FF' },
              { label: 'Weekly Target',value: formatETB(Math.round(stats.weeklyTarget)),       color: '#00D4FF' },
              { label: 'Pipeline',     value: formatETB(Math.round(pipelineValue)), color: '#8b8bff' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl p-2.5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--melhek-text-tertiary)' }}>{label}</p>
                <p className="text-sm font-bold tabular-nums leading-tight" style={{ color }}>
                  {loading ? <span className="w-12 h-3 rounded shimmer inline-block" /> : value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts row */}
        {!loading && (dealsAtRisk.length > 0 || followUpsOverdue.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {followUpsOverdue.length > 0 && (
              <Link href="/pipeline"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors hover:opacity-80"
                style={{ background: 'rgba(255,68,68,0.1)', color: '#ff6666', border: '1px solid rgba(255,68,68,0.2)' }}>
                <AlertTriangle className="w-3 h-3 animate-pulse" />
                {followUpsOverdue.length} overdue follow-up{followUpsOverdue.length > 1 ? 's' : ''}
              </Link>
            )}
            {dealsAtRisk.length > 0 && (
              <Link href="/ceo"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors hover:opacity-80"
                style={{ background: 'rgba(255,149,0,0.1)', color: '#ff9500', border: '1px solid rgba(255,149,0,0.2)' }}>
                <Clock className="w-3 h-3" />
                {dealsAtRisk.length} deal{dealsAtRisk.length > 1 ? 's' : ''} at risk
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Dashboard Page ───────────────────────────────────────────
export default function DashboardPage() {
  const { profile } = useUser()
  const { tasks, loading: tasksLoading } = useTasks()
  const { projects, loading: projectsLoading } = useProjects()

  const stats = useMemo(() => ({
    overdue: tasks.filter(t => isOverdue(t.due_date) && t.status !== 'done'),
    dueToday: tasks.filter(t => isDueToday(t.due_date) && t.status !== 'done'),
    activeProjects: projects.filter(p => p.status === 'active'),
    inProgress: tasks.filter(t => t.status === 'in_progress'),
  }), [tasks, projects])

  const recentTasks = useMemo(() =>
    [...tasks].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 6),
    [tasks])

  const recentProjects = useMemo(() => projects.slice(0, 4), [projects])

  const greeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  }
  const brief = profile
    ? [
        `${greeting()}, ${profile.full_name.split(' ')[0]}.`,
        stats.overdue.length > 0 ? `${stats.overdue.length} overdue task${stats.overdue.length > 1 ? 's' : ''}.` : null,
        stats.dueToday.length > 0 ? `${stats.dueToday.length} due today.` : null,
        `${stats.activeProjects.length} active project${stats.activeProjects.length !== 1 ? 's' : ''}.`,
      ].filter(Boolean).join(' ')
    : ''

  return (
    <div className="p-6 lg:p-8 space-y-8 pb-12 overflow-y-auto h-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--melhek-text-primary)' }}>Dashboard</h1>
        {brief && (
          <div className="flex items-start gap-2.5 mt-3 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(0,128,255,0.06)', border: '1px solid rgba(0,128,255,0.15)', color: 'var(--melhek-text-secondary)' }}>
            <div className="w-5 h-5 flex-shrink-0 mt-0.5">
              <img src="/logo.jpg" alt="Melhek Logo" className="w-full h-full object-contain" />
            </div>
            <span>{brief}</span>
          </div>
        )}
      </div>

      {/* ── REVENUE COMMAND CENTER (above all KPIs) ── */}
      <RevenueCommandCenter />

      {/* Quick nav to revenue modules */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: '/pipeline', label: 'Pipeline', icon: TrendingUp, color: '#0080FF', desc: 'Manage deals' },
          { href: '/ceo',      label: 'CEO Mode', icon: Flame,       color: '#ff6b35', desc: 'Daily mission' },
          { href: '/proposals',label: 'Proposals',icon: Zap,          color: '#8b8bff', desc: 'Templates' },
        ].map(({ href, label, icon: Icon, color, desc }) => (
          <Link key={href} href={href}
            className="glass rounded-2xl p-4 flex flex-col gap-2 lift-on-hover"
            style={{ border: `1px solid ${color}20` }}>
            <Icon className="w-5 h-5" style={{ color }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--melhek-text-primary)' }}>{label}</p>
              <p className="text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Due Today" value={stats.dueToday.length} sub="tasks" color="#0080FF" icon={<CheckSquare className="w-5 h-5" />} href="/tasks" loading={tasksLoading} />
        <KPICard title="Overdue" value={stats.overdue.length} sub="need attention" color="#ff4444" icon={<AlertCircle className="w-5 h-5" />} href="/tasks" loading={tasksLoading} />
        <KPICard title="Active Projects" value={stats.activeProjects.length} sub="in progress" color="#00D4FF" icon={<FolderKanban className="w-5 h-5" />} href="/projects" loading={projectsLoading} />
        <KPICard title="In Progress" value={stats.inProgress.length} sub="tasks active" color="#00d084" icon={<TrendingUp className="w-5 h-5" />} loading={tasksLoading} />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Tasks */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--melhek-text-secondary)' }}>Recent Tasks</h2>
            <Link href="/tasks" className="text-xs flex items-center gap-1" style={{ color: '#0080FF' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#00D4FF')} onMouseLeave={e => (e.currentTarget.style.color = '#0080FF')}>
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="glass rounded-2xl overflow-hidden">
            {tasksLoading ? (
              <div className="p-4 space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 rounded-lg shimmer" />)}</div>
            ) : recentTasks.length === 0 ? (
              <div className="flex flex-col items-center py-12" style={{ color: 'var(--melhek-text-tertiary)' }}>
                <CheckSquare className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No tasks yet</p>
                <Link href="/tasks" className="text-xs mt-2" style={{ color: '#0080FF' }}>Create your first task →</Link>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                {recentTasks.map(task => {
                  const p = getPriorityConfig(task.priority)
                  const s = getStatusConfig(task.status)
                  const overdueCls = isOverdue(task.due_date) && task.status !== 'done'
                  return (
                    <Link href={`/tasks?id=${task.id}`} key={task.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.025] transition-colors">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.dot }} />
                      <span className="flex-1 text-sm truncate" style={{
                        color: task.status === 'done' ? 'var(--melhek-text-tertiary)' : 'var(--melhek-text-primary)',
                        textDecoration: task.status === 'done' ? 'line-through' : 'none',
                      }}>{task.title}</span>
                      {task.project && (
                        <span className="hidden md:flex items-center gap-1 text-xs flex-shrink-0" style={{ color: 'var(--melhek-text-tertiary)' }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: task.project.color }} />
                          <span className="max-w-[80px] truncate">{task.project.name}</span>
                        </span>
                      )}
                      <span className="hidden sm:inline text-xs px-2 py-0.5 rounded flex-shrink-0" style={{ background: s.bg, color: s.text }}>{s.label}</span>
                      {task.due_date && (
                        <span className="text-xs flex-shrink-0" style={{ color: overdueCls ? '#ff6666' : 'var(--melhek-text-tertiary)' }}>
                          {formatDate(task.due_date)}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Projects */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--melhek-text-secondary)' }}>Projects</h2>
            <Link href="/projects" className="text-xs flex items-center gap-1" style={{ color: '#0080FF' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#00D4FF')} onMouseLeave={e => (e.currentTarget.style.color = '#0080FF')}>
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {projectsLoading
              ? [...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl shimmer" style={{ opacity: 1 - i * 0.25 }} />)
              : recentProjects.length === 0
                ? (
                  <div className="glass rounded-2xl flex flex-col items-center py-10" style={{ color: 'var(--melhek-text-tertiary)' }}>
                    <FolderKanban className="w-7 h-7 mb-2 opacity-30" />
                    <p className="text-sm">No projects yet</p>
                    <Link href="/projects" className="text-xs mt-2" style={{ color: '#0080FF' }}>Create a project →</Link>
                  </div>
                )
                : recentProjects.map(proj => {
                    const s = getProjectStatusConfig(proj.status)
                    return (
                      <Link href={`/projects/${proj.id}`} key={proj.id}
                        className="glass rounded-2xl p-4 flex flex-col gap-3 lift-on-hover block relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none opacity-[0.07]"
                          style={{ background: proj.color, filter: 'blur(20px)', transform: 'translate(30%,-30%)' }} />
                        <div className="flex items-center justify-between gap-2 relative">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-lg">{proj.icon}</span>
                            <span className="text-sm font-medium truncate" style={{ color: 'var(--melhek-text-primary)' }}>{proj.name}</span>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded flex-shrink-0" style={{ background: s.bg, color: s.text }}>{s.label}</span>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span style={{ color: 'var(--melhek-text-tertiary)' }}>{proj.done_tasks}/{proj.total_tasks} tasks</span>
                            <span style={{ color: proj.color }}>{proj.progress}%</span>
                          </div>
                          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--melhek-bg-3)' }}>
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${proj.progress}%`, background: `linear-gradient(90deg, ${proj.color}, ${proj.color}bb)` }} />
                          </div>
                        </div>
                      </Link>
                    )
                  })
            }
          </div>
        </div>
      </div>

      {/* Overdue Spotlight */}
      {!tasksLoading && stats.overdue.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: '#ff6666' }}>
              <Clock className="w-3.5 h-3.5" /> Overdue ({stats.overdue.length})
            </h2>
            <Link href="/tasks" className="text-xs" style={{ color: '#ff6666' }}>View all →</Link>
          </div>
          <div className="glass rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,68,68,0.15)' }}>
            <div className="divide-y" style={{ borderColor: 'rgba(255,68,68,0.08)' }}>
              {stats.overdue.slice(0, 4).map(task => {
                const p = getPriorityConfig(task.priority)
                return (
                  <Link href={`/tasks?id=${task.id}`} key={task.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.dot }} />
                    <span className="flex-1 text-sm truncate" style={{ color: 'var(--melhek-text-primary)' }}>{task.title}</span>
                    {task.project && <span className="text-xs hidden sm:block" style={{ color: 'var(--melhek-text-tertiary)' }}>{task.project.name}</span>}
                    <span className="text-xs flex-shrink-0" style={{ color: '#ff6666' }}>{formatDate(task.due_date)}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
