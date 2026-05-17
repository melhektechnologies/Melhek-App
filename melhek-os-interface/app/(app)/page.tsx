'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { useTasks } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { formatDate, isOverdue, isDueToday, getPriorityConfig, getStatusConfig, getProjectStatusConfig } from '@/lib/utils'
import { CheckSquare, FolderKanban, AlertCircle, TrendingUp, ArrowRight, Zap } from 'lucide-react'
import type { Profile } from '@/types'

function KPICard({ title, value, sub, color, icon }: { title: string; value: number | string; sub?: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="glass depth-2 rounded-2xl p-5 relative overflow-hidden lift-on-hover">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${color}, transparent 70%)` }} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--melhek-text-secondary)' }}>{title}</p>
          <div className="opacity-50" style={{ color }}>{icon}</div>
        </div>
        <div className="text-3xl font-bold" style={{ color: 'var(--melhek-text-primary)' }}>{value}</div>
        {sub && <p className="text-xs mt-1" style={{ color: 'var(--melhek-text-tertiary)' }}>{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { profile } = useUser()
  const { tasks, loading: tasksLoading } = useTasks()
  const { projects, loading: projectsLoading } = useProjects()

  const overdue = tasks.filter(t => isOverdue(t.due_date) && t.status !== 'done')
  const dueToday = tasks.filter(t => isDueToday(t.due_date) && t.status !== 'done')
  const activeProjects = projects.filter(p => p.status === 'active')
  const recentTasks = tasks.slice(0, 5)
  const recentProjects = projects.slice(0, 4)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const aiBrief = profile
    ? `${greeting()}, ${profile.full_name.split(' ')[0]}. You have ${overdue.length} overdue task${overdue.length !== 1 ? 's' : ''} and ${dueToday.length} due today. ${activeProjects.length} project${activeProjects.length !== 1 ? 's' : ''} currently active.`
    : ''

  return (
    <div className="p-6 lg:p-8 space-y-8 pb-12">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--melhek-text-primary)' }}>
          Dashboard
        </h1>
        {aiBrief && (
          <div className="flex items-start gap-2 mt-2 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(0,128,255,0.06)', border: '1px solid rgba(0,128,255,0.15)', color: 'var(--melhek-text-secondary)' }}>
            <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#00D4FF' }} />
            <span>{aiBrief}</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Due Today" value={dueToday.length} sub="tasks" color="#0080FF" icon={<CheckSquare className="w-5 h-5" />} />
        <KPICard title="Overdue" value={overdue.length} sub="need attention" color="#ff4444" icon={<AlertCircle className="w-5 h-5" />} />
        <KPICard title="Active Projects" value={activeProjects.length} sub="in progress" color="#00D4FF" icon={<FolderKanban className="w-5 h-5" />} />
        <KPICard title="Total Tasks" value={tasks.length} sub="across all projects" color="#00d084" icon={<TrendingUp className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Tasks */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--melhek-text-secondary)' }}>
              Recent Tasks
            </h2>
            <Link href="/tasks" className="text-xs flex items-center gap-1 transition-colors"
              style={{ color: '#0080FF' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#00D4FF'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#0080FF'}>
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="glass rounded-2xl overflow-hidden">
            {tasksLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 rounded-lg shimmer" />
                ))}
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="flex flex-col items-center py-12" style={{ color: 'var(--melhek-text-tertiary)' }}>
                <CheckSquare className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No tasks yet</p>
                <Link href="/tasks" className="text-xs mt-2" style={{ color: '#0080FF' }}>Create your first task →</Link>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                {recentTasks.map((task) => {
                  const p = getPriorityConfig(task.priority)
                  const s = getStatusConfig(task.status)
                  const overdueCls = isOverdue(task.due_date) && task.status !== 'done'
                  return (
                    <Link href={`/tasks?id=${task.id}`} key={task.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.dot }} />
                      <span className="flex-1 text-sm truncate" style={{
                        color: task.status === 'done' ? 'var(--melhek-text-tertiary)' : 'var(--melhek-text-primary)',
                        textDecoration: task.status === 'done' ? 'line-through' : 'none'
                      }}>{task.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: s.bg, color: s.text }}>{s.label}</span>
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

        {/* Active Projects */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--melhek-text-secondary)' }}>
              Projects
            </h2>
            <Link href="/projects" className="text-xs flex items-center gap-1 transition-colors"
              style={{ color: '#0080FF' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#00D4FF'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#0080FF'}>
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {projectsLoading ? (
              [...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl shimmer" />)
            ) : recentProjects.length === 0 ? (
              <div className="glass rounded-2xl flex flex-col items-center py-10" style={{ color: 'var(--melhek-text-tertiary)' }}>
                <FolderKanban className="w-7 h-7 mb-2 opacity-40" />
                <p className="text-sm">No projects yet</p>
                <Link href="/projects" className="text-xs mt-2" style={{ color: '#0080FF' }}>Create a project →</Link>
              </div>
            ) : (
              recentProjects.map((proj) => {
                const s = getProjectStatusConfig(proj.status)
                return (
                  <Link href={`/projects/${proj.id}`} key={proj.id}
                    className="glass rounded-2xl p-4 flex flex-col gap-3 lift-on-hover block">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{proj.icon}</span>
                        <span className="text-sm font-medium truncate" style={{ color: 'var(--melhek-text-primary)' }}>{proj.name}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded flex-shrink-0" style={{ background: s.bg, color: s.text }}>{s.label}</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: 'var(--melhek-text-tertiary)' }}>{proj.done_tasks}/{proj.total_tasks} tasks</span>
                        <span style={{ color: '#0080FF' }}>{proj.progress}%</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--melhek-bg-3)' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${proj.progress}%`, background: 'linear-gradient(90deg,#0080FF,#00D4FF)' }} />
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
