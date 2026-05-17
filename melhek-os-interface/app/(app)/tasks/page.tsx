'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTasks } from '@/hooks/useTasks'
import { useTaskFilters } from '@/hooks/useTaskFilters'
import { useProjects } from '@/hooks/useProjects'
import { useUser } from '@/hooks/useUser'
import { TaskDetail } from '@/components/tasks/TaskDetail'
import { formatDate, isOverdue, getPriorityConfig, getStatusConfig } from '@/lib/utils'
import {
  Plus, CheckSquare, Check, Loader2, Trash2,
  Search, X, SlidersHorizontal, RefreshCw,
} from 'lucide-react'
import type { TaskStatus, TaskPriority } from '@/types'

// ─── Status + Priority constants ─────────────────────────────
const STATUS_OPTS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
]

const PRIORITY_OPTS: { value: TaskPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const DUE_OPTS = [
  { value: 'all', label: 'Any Date' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Due Today' },
  { value: 'this_week', label: 'This Week' },
]

// ─── Main content (wrapped in Suspense for useSearchParams) ──
function TasksContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { profile } = useUser()
  const quickAddRef = useRef<HTMLInputElement>(null)

  // Fetch
  const { tasks, loading, error, refetch, createTask, updateTask, deleteTask, toggleComplete } = useTasks()
  const { projects } = useProjects()
  const { filters, setFilter, resetFilters, filtered, counts, hasActiveFilters } = useTaskFilters(tasks, profile?.id)

  // UI state
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('id'))
  const [quickAdd, setQuickAdd] = useState('')
  const [adding, setAdding] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Sync URL param → selectedId
  useEffect(() => {
    const id = searchParams.get('id')
    setSelectedId(id)
  }, [searchParams])

  // Keyboard shortcut: N → focus quick-add
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        quickAddRef.current?.focus()
      }
      if (e.key === 'Escape') {
        closeDetail()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handlers
  const handleQuickAdd = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickAdd.trim() || !profile) return
    setAdding(true)
    await createTask({ title: quickAdd.trim(), created_by: profile.id })
    setQuickAdd('')
    setAdding(false)
    quickAddRef.current?.focus()
  }, [quickAdd, profile, createTask])

  const openDetail = useCallback((id: string) => {
    setSelectedId(id)
    router.push(`/tasks?id=${id}`, { scroll: false })
  }, [router])

  const closeDetail = useCallback(() => {
    setSelectedId(null)
    router.push('/tasks', { scroll: false })
  }, [router])

  const selectedTask = tasks.find(t => t.id === selectedId) ?? null

  return (
    <div className="flex h-full overflow-hidden">
      {/* ─── Main Column ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="px-6 lg:px-8 pt-6 pb-4 flex-shrink-0 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--melhek-text-primary)' }}>
                Tasks
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--melhek-text-tertiary)' }}>
                {filtered.length} of {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                {counts.overdue > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(255,68,68,0.15)', color: '#ff6666' }}>
                    {counts.overdue} overdue
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--melhek-text-tertiary)' }}
                title="Refresh tasks"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowFilters(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: showFilters || hasActiveFilters ? 'rgba(0,128,255,0.15)' : 'var(--melhek-bg-2)',
                  border: `1px solid ${showFilters || hasActiveFilters ? 'rgba(0,128,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  color: showFilters || hasActiveFilters ? '#00D4FF' : 'var(--melhek-text-secondary)',
                }}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {hasActiveFilters && (
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                )}
              </button>
            </div>
          </div>

          {/* Quick Add */}
          <form onSubmit={handleQuickAdd} className="flex gap-2">
            <div className="flex-1 relative">
              <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--melhek-text-tertiary)' }} />
              <input
                ref={quickAddRef}
                type="text"
                value={quickAdd}
                onChange={e => setQuickAdd(e.target.value)}
                placeholder="Add a task… (press N to focus, Enter to save)"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                style={{
                  background: 'var(--melhek-bg-2)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--melhek-text-primary)',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,128,255,0.5)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
              />
            </div>
            <button
              type="submit"
              disabled={!quickAdd.trim() || adding}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-black disabled:opacity-50 transition-all press-scale flex items-center gap-1.5 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#0080FF,#00D4FF)' }}
            >
              {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Add</span>
            </button>
          </form>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--melhek-text-tertiary)' }} />
            <input
              type="text"
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              placeholder="Search tasks by title or description…"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
              style={{
                background: 'var(--melhek-bg-2)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'var(--melhek-text-primary)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,128,255,0.4)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
            />
            {filters.search && (
              <button
                onClick={() => setFilter('search', '')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--melhek-text-tertiary)' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 pt-1">
              {/* My Tasks */}
              <button
                onClick={() => setFilter('myTasksOnly', !filters.myTasksOnly)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: filters.myTasksOnly ? 'rgba(0,128,255,0.15)' : 'var(--melhek-bg-2)',
                  border: `1px solid ${filters.myTasksOnly ? 'rgba(0,128,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: filters.myTasksOnly ? '#00D4FF' : 'var(--melhek-text-secondary)',
                }}
              >
                {filters.myTasksOnly && <Check className="w-3 h-3" />}
                My Tasks
              </button>

              {/* Status */}
              <select
                value={filters.status}
                onChange={e => setFilter('status', e.target.value as TaskStatus | 'all')}
                className="px-3 py-1.5 rounded-lg text-xs focus:outline-none"
                style={{
                  background: 'var(--melhek-bg-2)',
                  border: `1px solid ${filters.status !== 'all' ? 'rgba(0,128,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: 'var(--melhek-text-secondary)',
                }}
              >
                {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              {/* Priority */}
              <select
                value={filters.priority}
                onChange={e => setFilter('priority', e.target.value as TaskPriority | 'all')}
                className="px-3 py-1.5 rounded-lg text-xs focus:outline-none"
                style={{
                  background: 'var(--melhek-bg-2)',
                  border: `1px solid ${filters.priority !== 'all' ? 'rgba(0,128,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: 'var(--melhek-text-secondary)',
                }}
              >
                {PRIORITY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              {/* Project */}
              <select
                value={filters.projectId}
                onChange={e => setFilter('projectId', e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs focus:outline-none"
                style={{
                  background: 'var(--melhek-bg-2)',
                  border: `1px solid ${filters.projectId !== 'all' ? 'rgba(0,128,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: 'var(--melhek-text-secondary)',
                }}
              >
                <option value="all">All Projects</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
              </select>

              {/* Due Date Range */}
              <select
                value={filters.dueDateRange}
                onChange={e => setFilter('dueDateRange', e.target.value as 'all' | 'overdue' | 'today' | 'this_week')}
                className="px-3 py-1.5 rounded-lg text-xs focus:outline-none"
                style={{
                  background: 'var(--melhek-bg-2)',
                  border: `1px solid ${filters.dueDateRange !== 'all' ? 'rgba(0,128,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: 'var(--melhek-text-secondary)',
                }}
              >
                {DUE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ color: '#ff6666', border: '1px solid rgba(255,68,68,0.3)', background: 'rgba(255,68,68,0.08)' }}
                >
                  <X className="w-3 h-3" />
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {/* ─── Task List ─────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-8 pb-8">
          {/* Error state */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-3"
              style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', color: '#ff6666' }}>
              <span>{error}</span>
              <button onClick={() => refetch()} className="ml-auto underline text-xs">Retry</button>
            </div>
          )}

          {/* Loading skeletons */}
          {loading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl shimmer" style={{ opacity: 1 - i * 0.12 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            /* Empty state */
            <div
              className="glass rounded-2xl flex flex-col items-center py-20 mt-2"
              style={{ color: 'var(--melhek-text-tertiary)' }}
            >
              <CheckSquare className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-base" style={{ color: 'var(--melhek-text-secondary)' }}>
                {hasActiveFilters ? 'No matching tasks' : 'No tasks yet'}
              </p>
              <p className="text-sm mt-1">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'Press N to create your first task'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{ background: 'rgba(0,128,255,0.12)', color: '#00D4FF', border: '1px solid rgba(0,128,255,0.2)' }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            /* Task rows */
            <div className="glass rounded-2xl overflow-hidden">
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                {filtered.map(task => {
                  const p = getPriorityConfig(task.priority)
                  const s = getStatusConfig(task.status)
                  const overdueCls = isOverdue(task.due_date) && task.status !== 'done'
                  const isSelected = task.id === selectedId

                  return (
                    <div
                      key={task.id}
                      onClick={() => openDetail(task.id)}
                      className="flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-white/[0.03] group"
                      style={{ background: isSelected ? 'rgba(0,128,255,0.07)' : undefined }}
                    >
                      {/* Complete toggle */}
                      <button
                        onClick={e => { e.stopPropagation(); toggleComplete(task.id) }}
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all border"
                        style={{
                          borderColor: task.status === 'done' ? '#00d084' : 'rgba(255,255,255,0.2)',
                          background: task.status === 'done' ? 'rgba(0,208,132,0.15)' : 'transparent',
                          color: '#00d084',
                        }}
                        title={task.status === 'done' ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {task.status === 'done' && <Check className="w-3 h-3" />}
                      </button>

                      {/* Priority dot */}
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: p.dot }}
                        title={p.label}
                      />

                      {/* Title */}
                      <span
                        className="flex-1 text-sm truncate"
                        style={{
                          color: task.status === 'done' ? 'var(--melhek-text-tertiary)' : 'var(--melhek-text-primary)',
                          textDecoration: task.status === 'done' ? 'line-through' : 'none',
                        }}
                      >
                        {task.title}
                      </span>

                      {/* Assignee avatar */}
                      {task.assignee && (
                        <div
                          className="hidden lg:flex w-5 h-5 rounded-full flex-shrink-0 items-center justify-center text-[9px] font-bold text-black"
                          style={{ background: 'linear-gradient(135deg,#00D4FF,#0080FF)' }}
                          title={task.assignee.full_name}
                        >
                          {task.assignee.full_name.slice(0, 1)}
                        </div>
                      )}

                      {/* Project badge */}
                      {task.project && (
                        <span
                          className="hidden sm:flex items-center gap-1.5 text-xs flex-shrink-0"
                          style={{ color: 'var(--melhek-text-tertiary)' }}
                        >
                          <div className="w-2 h-2 rounded-full" style={{ background: task.project.color }} />
                          <span className="hidden md:inline max-w-[100px] truncate">{task.project.name}</span>
                        </span>
                      )}

                      {/* Status badge */}
                      <span
                        className="hidden lg:inline text-xs px-2 py-0.5 rounded flex-shrink-0"
                        style={{ background: s.bg, color: s.text }}
                      >
                        {s.label}
                      </span>

                      {/* Due date */}
                      {task.due_date && (
                        <span
                          className="text-xs flex-shrink-0"
                          style={{ color: overdueCls ? '#ff6666' : 'var(--melhek-text-tertiary)' }}
                        >
                          {formatDate(task.due_date)}
                        </span>
                      )}

                      {/* Delete */}
                      <button
                        onClick={e => { e.stopPropagation(); deleteTask(task.id) }}
                        className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded transition-all"
                        style={{ color: 'var(--melhek-text-tertiary)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#ff6666')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--melhek-text-tertiary)')}
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Task Detail Slide-over ─────────────────────── */}
      {selectedTask && (
        <TaskDetail
          key={selectedTask.id}
          task={selectedTask}
          projects={projects}
          onUpdate={updates => updateTask(selectedTask.id, updates)}
          onDelete={() => { deleteTask(selectedTask.id); closeDetail() }}
          onClose={closeDetail}
        />
      )}
    </div>
  )
}

export default function TasksPage() {
  return (
    <Suspense fallback={
      <div className="p-8 space-y-3">
        {[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-xl shimmer" />)}
      </div>
    }>
      <TasksContent />
    </Suspense>
  )
}
