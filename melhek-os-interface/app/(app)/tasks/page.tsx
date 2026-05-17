'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTasks } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { useUser } from '@/hooks/useUser'
import { TaskDetail } from '@/components/tasks/TaskDetail'
import { formatDate, isOverdue, getPriorityConfig, getStatusConfig } from '@/lib/utils'
import {
  Plus, CheckSquare, Filter, ChevronDown, Check,
  Circle, Clock, XCircle, Loader2, Trash2
} from 'lucide-react'
import type { TaskStatus, TaskPriority } from '@/types'

const STATUS_OPTIONS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
]

const PRIORITY_OPTIONS: { value: TaskPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

function TasksContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { profile } = useUser()
  const [myTasksOnly, setMyTasksOnly] = useState(false)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all')
  const [quickAdd, setQuickAdd] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('id'))
  const [adding, setAdding] = useState(false)

  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks({
    myTasksOnly,
    userId: profile?.id,
  })
  const { projects } = useProjects()

  // Sync selectedId from URL
  useEffect(() => {
    const id = searchParams.get('id')
    if (id) setSelectedId(id)
  }, [searchParams])

  const filtered = tasks.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
    return true
  })

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickAdd.trim() || !profile) return
    setAdding(true)
    await createTask({ title: quickAdd.trim(), created_by: profile.id })
    setQuickAdd('')
    setAdding(false)
  }

  const openTask = (id: string) => {
    setSelectedId(id)
    router.push(`/tasks?id=${id}`, { scroll: false })
  }

  const closeTask = () => {
    setSelectedId(null)
    router.push('/tasks', { scroll: false })
  }

  const selectedTask = tasks.find(t => t.id === selectedId) ?? null

  return (
    <div className="flex h-full">
      {/* Main list */}
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-5 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--melhek-text-primary)' }}>Tasks</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--melhek-text-tertiary)' }}>{filtered.length} task{filtered.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Quick Add */}
        <form onSubmit={handleQuickAdd} className="flex gap-2">
          <div className="flex-1 relative">
            <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--melhek-text-tertiary)' }} />
            <input
              type="text"
              value={quickAdd}
              onChange={e => setQuickAdd(e.target.value)}
              placeholder="Add a task… press Enter to create"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
              style={{ background: 'var(--melhek-bg-2)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,128,255,0.5)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            />
          </div>
          <button type="submit" disabled={!quickAdd.trim() || adding}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-black disabled:opacity-50 transition-all press-scale flex items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg,#0080FF,#00D4FF)' }}>
            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add
          </button>
        </form>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* My tasks toggle */}
          <button
            onClick={() => setMyTasksOnly(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: myTasksOnly ? 'rgba(0,128,255,0.15)' : 'var(--melhek-bg-2)',
              border: `1px solid ${myTasksOnly ? 'rgba(0,128,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: myTasksOnly ? '#00D4FF' : 'var(--melhek-text-secondary)',
            }}>
            {myTasksOnly ? <Check className="w-3 h-3" /> : <Filter className="w-3 h-3" />}
            My Tasks
          </button>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as TaskStatus | 'all')}
            className="px-3 py-1.5 rounded-lg text-xs focus:outline-none transition-all"
            style={{ background: 'var(--melhek-bg-2)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-secondary)' }}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as TaskPriority | 'all')}
            className="px-3 py-1.5 rounded-lg text-xs focus:outline-none transition-all"
            style={{ background: 'var(--melhek-bg-2)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-secondary)' }}>
            {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Task List */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-xl shimmer" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl flex flex-col items-center py-16"
            style={{ color: 'var(--melhek-text-tertiary)' }}>
            <CheckSquare className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-medium" style={{ color: 'var(--melhek-text-secondary)' }}>No tasks found</p>
            <p className="text-sm mt-1">Add a task using the input above</p>
          </div>
        ) : (
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
                    onClick={() => openTask(task.id)}
                    className="flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all hover:bg-white/[0.03] group"
                    style={{ background: isSelected ? 'rgba(0,128,255,0.06)' : undefined }}
                  >
                    {/* Status toggle */}
                    <button
                      onClick={e => { e.stopPropagation(); updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' }) }}
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all border"
                      style={{
                        borderColor: task.status === 'done' ? '#00d084' : 'rgba(255,255,255,0.2)',
                        background: task.status === 'done' ? 'rgba(0,208,132,0.15)' : 'transparent',
                        color: '#00d084',
                      }}>
                      {task.status === 'done' && <Check className="w-3 h-3" />}
                    </button>

                    {/* Priority dot */}
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.dot }} />

                    {/* Title */}
                    <span className="flex-1 text-sm truncate transition-colors" style={{
                      color: task.status === 'done' ? 'var(--melhek-text-tertiary)' : 'var(--melhek-text-primary)',
                      textDecoration: task.status === 'done' ? 'line-through' : 'none',
                    }}>{task.title}</span>

                    {/* Project */}
                    {task.project && (
                      <span className="hidden sm:flex items-center gap-1.5 text-xs flex-shrink-0"
                        style={{ color: 'var(--melhek-text-tertiary)' }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: task.project.color }} />
                        {task.project.name}
                      </span>
                    )}

                    {/* Status badge */}
                    <span className="hidden md:inline text-xs px-2 py-0.5 rounded flex-shrink-0"
                      style={{ background: s.bg, color: s.text }}>{s.label}</span>

                    {/* Due date */}
                    {task.due_date && (
                      <span className="text-xs flex-shrink-0" style={{ color: overdueCls ? '#ff6666' : 'var(--melhek-text-tertiary)' }}>
                        {formatDate(task.due_date)}
                      </span>
                    )}

                    {/* Delete */}
                    <button
                      onClick={e => { e.stopPropagation(); deleteTask(task.id) }}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded transition-all"
                      style={{ color: 'var(--melhek-text-tertiary)' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ff6666'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--melhek-text-tertiary)'}
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

      {/* Slide-over Task Detail */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          projects={projects}
          onUpdate={(updates) => updateTask(selectedTask.id, updates)}
          onDelete={() => { deleteTask(selectedTask.id); closeTask() }}
          onClose={closeTask}
        />
      )}
    </div>
  )
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="p-8"><div className="h-8 w-48 shimmer rounded" /></div>}>
      <TasksContent />
    </Suspense>
  )
}
