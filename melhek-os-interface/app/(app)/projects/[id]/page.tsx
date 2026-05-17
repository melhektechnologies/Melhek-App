'use client'

import { use, useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTasks } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { useUser } from '@/hooks/useUser'
import { TaskDetail } from '@/components/tasks/TaskDetail'
import { calcProgress, formatDate, getPriorityConfig, isOverdue, getProjectStatusConfig } from '@/lib/utils'
import {
  ArrowLeft, Plus, Check, Loader2, Trash2, CheckSquare,
  Edit2, Archive, MoreHorizontal, X, Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import type { Project, ProjectStatus } from '@/types'

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { profile } = useUser()
  const { projects, updateProject } = useProjects()
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask, toggleComplete } = useTasks({ projectId: id })

  const supabase = useRef(createClient()).current
  const [project, setProject] = useState<Project | null>(null)
  const [loadingProject, setLoadingProject] = useState(true)
  const [quickAdd, setQuickAdd] = useState('')
  const [adding, setAdding] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const quickAddRef = useRef<HTMLInputElement>(null)

  // Load project once
  useEffect(() => {
    supabase
      .from('projects')
      .select('*, owner:profiles!projects_owner_id_fkey(id, full_name, avatar_url), tasks(id, status)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setProject(data)
        setNameValue(data?.name ?? '')
        setLoadingProject(false)
      })
  }, [id, supabase])

  // Keyboard: N → focus quick add
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); quickAddRef.current?.focus() }
      if (e.key === 'Escape') setSelectedTaskId(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const progress = calcProgress(tasks)
  const doneTasks = tasks.filter(t => t.status === 'done').length
  const overdueTasks = tasks.filter(t => isOverdue(t.due_date) && t.status !== 'done')

  const handleQuickAdd = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickAdd.trim() || !profile) return
    setAdding(true)
    await createTask({ title: quickAdd.trim(), created_by: profile.id, project_id: id })
    setQuickAdd('')
    setAdding(false)
    quickAddRef.current?.focus()
  }, [quickAdd, profile, createTask, id])

  const handleStatusChange = async (status: ProjectStatus) => {
    if (!project) return
    setShowStatusMenu(false)
    setProject(prev => prev ? { ...prev, status } : prev)
    await updateProject(id, { status })
  }

  const saveName = async () => {
    setEditingName(false)
    if (!nameValue.trim() || nameValue === project?.name) return
    setProject(prev => prev ? { ...prev, name: nameValue } : prev)
    await updateProject(id, { name: nameValue.trim() })
    toast.success('Project renamed')
  }

  const selectedTask = tasks.find(t => t.id === selectedTaskId) ?? null

  // ─── Loading state ────────────────────────────────────────
  if (loadingProject) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-6 w-32 shimmer rounded" />
        <div className="h-40 shimmer rounded-2xl" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-12 shimmer rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-8">
        <p style={{ color: 'var(--melhek-text-secondary)' }}>Project not found.</p>
        <button onClick={() => router.push('/projects')} className="mt-4 text-sm" style={{ color: '#0080FF' }}>
          ← Back to Projects
        </button>
      </div>
    )
  }

  const s = getProjectStatusConfig(project.status as ProjectStatus)

  return (
    <div className="flex h-full overflow-hidden">
      {/* ─── Main Column ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 space-y-6 pb-12">

          {/* Back nav */}
          <button onClick={() => router.push('/projects')}
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: 'var(--melhek-text-tertiary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--melhek-text-secondary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--melhek-text-tertiary)')}>
            <ArrowLeft className="w-4 h-4" /> All Projects
          </button>

          {/* ─── Project Header Card ───────────────────── */}
          <div className="glass rounded-2xl p-6 relative overflow-hidden">
            {/* Ambient */}
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none opacity-[0.06]"
              style={{ background: project.color, filter: 'blur(60px)', transform: 'translate(30%,-30%)' }} />

            <div className="flex items-start justify-between gap-4 mb-5 relative">
              <div className="flex items-start gap-4 min-w-0">
                <span className="text-4xl flex-shrink-0">{project.icon}</span>
                <div className="min-w-0">
                  {/* Inline editable name */}
                  {editingName ? (
                    <input
                      value={nameValue}
                      onChange={e => setNameValue(e.target.value)}
                      onBlur={saveName}
                      onKeyDown={e => { if (e.key === 'Enter') saveName() }}
                      autoFocus
                      className="text-xl font-bold bg-transparent focus:outline-none w-full"
                      style={{ color: 'var(--melhek-text-primary)', borderBottom: '1px solid rgba(0,128,255,0.5)' }}
                    />
                  ) : (
                    <div className="flex items-center gap-2 group/name">
                      <h1 className="text-xl font-bold" style={{ color: 'var(--melhek-text-primary)' }}>{project.name}</h1>
                      <button onClick={() => setEditingName(true)}
                        className="opacity-0 group-hover/name:opacity-100 p-1 rounded transition-all"
                        style={{ color: 'var(--melhek-text-tertiary)' }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {project.description && (
                    <p className="text-sm mt-1" style={{ color: 'var(--melhek-text-secondary)' }}>{project.description}</p>
                  )}
                  {project.target_date && (
                    <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: 'var(--melhek-text-tertiary)' }}>
                      <Calendar className="w-3 h-3" /> Target: {formatDate(project.target_date)}
                    </p>
                  )}
                </div>
              </div>

              {/* Status button with dropdown */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowStatusMenu(v => !v)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: s.bg, color: s.text, border: `1px solid ${s.text}30` }}>
                  {s.label} <MoreHorizontal className="w-3 h-3" />
                </button>
                {showStatusMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
                    <div className="absolute right-0 top-9 w-36 rounded-xl overflow-hidden z-20 depth-3"
                      style={{ background: 'var(--melhek-bg-2)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {STATUS_OPTIONS.map(opt => {
                        const cfg = getProjectStatusConfig(opt.value)
                        return (
                          <button key={opt.value} onClick={() => handleStatusChange(opt.value)}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-white/5 transition-colors"
                            style={{ color: project.status === opt.value ? cfg.text : 'var(--melhek-text-secondary)' }}>
                            {project.status === opt.value && <Check className="w-3 h-3" />}
                            <span className={project.status === opt.value ? '' : 'ml-5'}>{opt.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span style={{ color: 'var(--melhek-text-tertiary)' }}>{doneTasks} of {tasks.length} tasks complete</span>
                <span style={{ color: project.color ?? '#00D4FF' }}>{progress}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--melhek-bg-3)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${project.color ?? '#0080FF'}, ${project.color ?? '#00D4FF'})` }} />
              </div>
            </div>

            {/* Overdue warning */}
            {overdueTasks.length > 0 && (
              <div className="mt-4 px-3 py-2 rounded-lg text-xs flex items-center gap-2"
                style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', color: '#ff6666' }}>
                <span>{overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* ─── Quick Add ────────────────────────────── */}
          <form onSubmit={handleQuickAdd} className="flex gap-2">
            <div className="flex-1 relative">
              <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--melhek-text-tertiary)' }} />
              <input
                ref={quickAddRef}
                value={quickAdd}
                onChange={e => setQuickAdd(e.target.value)}
                placeholder="Add a task to this project… (N to focus)"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                style={{ background: 'var(--melhek-bg-2)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,128,255,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
            </div>
            <button type="submit" disabled={!quickAdd.trim() || adding}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-black disabled:opacity-50 flex items-center gap-1.5 press-scale flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#0080FF,#00D4FF)' }}>
              {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Add</span>
            </button>
          </form>

          {/* ─── Task List ────────────────────────────── */}
          {tasksLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-xl shimmer" style={{ opacity: 1 - i * 0.2 }} />)}
            </div>
          ) : tasks.length === 0 ? (
            <div className="glass rounded-2xl flex flex-col items-center py-14" style={{ color: 'var(--melhek-text-tertiary)' }}>
              <CheckSquare className="w-9 h-9 mb-3 opacity-20" />
              <p className="text-sm" style={{ color: 'var(--melhek-text-secondary)' }}>No tasks in this project yet</p>
              <p className="text-xs mt-1">Press N to add the first task</p>
            </div>
          ) : (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                {tasks.map(task => {
                  const p = getPriorityConfig(task.priority)
                  const overdueCls = isOverdue(task.due_date) && task.status !== 'done'
                  const isSelected = task.id === selectedTaskId
                  return (
                    <div key={task.id} onClick={() => setSelectedTaskId(task.id)}
                      className="flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-white/[0.025] group"
                      style={{ background: isSelected ? 'rgba(0,128,255,0.06)' : undefined }}>
                      <button onClick={e => { e.stopPropagation(); toggleComplete(task.id) }}
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all border"
                        style={{
                          borderColor: task.status === 'done' ? '#00d084' : 'rgba(255,255,255,0.2)',
                          background: task.status === 'done' ? 'rgba(0,208,132,0.15)' : 'transparent',
                          color: '#00d084',
                        }}>
                        {task.status === 'done' && <Check className="w-3 h-3" />}
                      </button>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.dot }} />
                      <span className="flex-1 text-sm truncate" style={{
                        color: task.status === 'done' ? 'var(--melhek-text-tertiary)' : 'var(--melhek-text-primary)',
                        textDecoration: task.status === 'done' ? 'line-through' : 'none',
                      }}>{task.title}</span>
                      {task.assignee && (
                        <div className="hidden lg:flex w-5 h-5 rounded-full flex-shrink-0 items-center justify-center text-[9px] font-bold text-black"
                          style={{ background: 'linear-gradient(135deg,#00D4FF,#0080FF)' }}
                          title={task.assignee.full_name}>
                          {task.assignee.full_name.slice(0, 1)}
                        </div>
                      )}
                      {task.due_date && (
                        <span className="text-xs flex-shrink-0"
                          style={{ color: overdueCls ? '#ff6666' : 'var(--melhek-text-tertiary)' }}>
                          {formatDate(task.due_date)}
                        </span>
                      )}
                      <button onClick={e => { e.stopPropagation(); deleteTask(task.id) }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded flex-shrink-0 transition-all"
                        style={{ color: 'var(--melhek-text-tertiary)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#ff6666')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--melhek-text-tertiary)')}>
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

      {/* ─── Task Detail Slide-over ───────────────────── */}
      {selectedTask && (
        <TaskDetail
          key={selectedTask.id}
          task={selectedTask}
          projects={projects}
          onUpdate={updates => updateTask(selectedTask.id, updates)}
          onDelete={() => { deleteTask(selectedTask.id); setSelectedTaskId(null) }}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  )
}
