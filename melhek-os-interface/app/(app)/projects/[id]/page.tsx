'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTasks } from '@/hooks/useTasks'
import { useUser } from '@/hooks/useUser'
import { TaskDetail } from '@/components/tasks/TaskDetail'
import { useProjects } from '@/hooks/useProjects'
import { calcProgress, formatDate, getStatusConfig, getPriorityConfig, isOverdue, getProjectStatusConfig } from '@/lib/utils'
import { ArrowLeft, Plus, Check, Loader2, Trash2, CheckSquare } from 'lucide-react'
import type { Project } from '@/types'

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { profile } = useUser()
  const { projects, updateProject } = useProjects()
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask } = useTasks({ projectId: id })
  const [project, setProject] = useState<Project | null>(null)
  const [loadingProject, setLoadingProject] = useState(true)
  const [quickAdd, setQuickAdd] = useState('')
  const [adding, setAdding] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('projects').select('*, owner:profiles!projects_owner_id_fkey(id, full_name, avatar_url), tasks(id, status)')
      .eq('id', id).single().then(({ data }) => { setProject(data); setLoadingProject(false) })
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const progress = calcProgress(tasks)
  const doneTasks = tasks.filter(t => t.status === 'done').length

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickAdd.trim() || !profile) return
    setAdding(true)
    await createTask({ title: quickAdd.trim(), created_by: profile.id, project_id: id })
    setQuickAdd('')
    setAdding(false)
  }

  const selectedTask = tasks.find(t => t.id === selectedTaskId) ?? null

  if (loadingProject) {
    return (
      <div className="p-8 flex items-center gap-3" style={{ color: 'var(--melhek-text-tertiary)' }}>
        <Loader2 className="w-5 h-5 animate-spin" /> Loading project…
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-8">
        <p style={{ color: 'var(--melhek-text-secondary)' }}>Project not found.</p>
        <button onClick={() => router.push('/projects')} className="mt-4 text-sm" style={{ color: '#0080FF' }}>← Back to Projects</button>
      </div>
    )
  }

  const s = getProjectStatusConfig(project.status as 'active')

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto pb-12">
        {/* Back */}
        <button onClick={() => router.push('/projects')}
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: 'var(--melhek-text-tertiary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--melhek-text-secondary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--melhek-text-tertiary)')}>
          <ArrowLeft className="w-4 h-4" /> All Projects
        </button>

        {/* Project header */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{project.icon}</span>
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--melhek-text-primary)' }}>{project.name}</h1>
                {project.description && <p className="text-sm mt-1" style={{ color: 'var(--melhek-text-secondary)' }}>{project.description}</p>}
              </div>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-lg flex-shrink-0" style={{ background: s.bg, color: s.text }}>{s.label}</span>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span style={{ color: 'var(--melhek-text-tertiary)' }}>{doneTasks} of {tasks.length} tasks complete</span>
              <span style={{ color: project.color ?? '#00D4FF' }}>{progress}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--melhek-bg-3)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${project.color ?? '#0080FF'}, ${project.color ?? '#00D4FF'})` }} />
            </div>
          </div>
          {project.target_date && (
            <p className="text-xs mt-3" style={{ color: 'var(--melhek-text-tertiary)' }}>
              Target: {formatDate(project.target_date)}
            </p>
          )}
        </div>

        {/* Quick Add */}
        <form onSubmit={handleQuickAdd} className="flex gap-2">
          <div className="flex-1 relative">
            <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--melhek-text-tertiary)' }} />
            <input value={quickAdd} onChange={e => setQuickAdd(e.target.value)}
              placeholder="Add a task to this project…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--melhek-bg-2)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' }}
            />
          </div>
          <button type="submit" disabled={!quickAdd.trim() || adding}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-black disabled:opacity-50 flex items-center gap-1.5 press-scale"
            style={{ background: 'linear-gradient(135deg,#0080FF,#00D4FF)' }}>
            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add
          </button>
        </form>

        {/* Task list */}
        {tasksLoading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-xl shimmer" />)}</div>
        ) : tasks.length === 0 ? (
          <div className="glass rounded-2xl flex flex-col items-center py-12" style={{ color: 'var(--melhek-text-tertiary)' }}>
            <CheckSquare className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No tasks in this project yet</p>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {tasks.map(task => {
                const p = getPriorityConfig(task.priority)
                const overdueCls = isOverdue(task.due_date) && task.status !== 'done'
                return (
                  <div key={task.id} onClick={() => setSelectedTaskId(task.id)}
                    className="flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all hover:bg-white/[0.025] group"
                    style={{ background: selectedTaskId === task.id ? 'rgba(0,128,255,0.06)' : undefined }}>
                    <button onClick={e => { e.stopPropagation(); updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' }) }}
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all border"
                      style={{ borderColor: task.status === 'done' ? '#00d084' : 'rgba(255,255,255,0.2)', background: task.status === 'done' ? 'rgba(0,208,132,0.15)' : 'transparent', color: '#00d084' }}>
                      {task.status === 'done' && <Check className="w-3 h-3" />}
                    </button>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.dot }} />
                    <span className="flex-1 text-sm truncate" style={{
                      color: task.status === 'done' ? 'var(--melhek-text-tertiary)' : 'var(--melhek-text-primary)',
                      textDecoration: task.status === 'done' ? 'line-through' : 'none',
                    }}>{task.title}</span>
                    {task.due_date && (
                      <span className="text-xs flex-shrink-0" style={{ color: overdueCls ? '#ff6666' : 'var(--melhek-text-tertiary)' }}>{formatDate(task.due_date)}</span>
                    )}
                    <button onClick={e => { e.stopPropagation(); deleteTask(task.id) }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded flex-shrink-0"
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

      {/* Task detail panel */}
      {selectedTask && (
        <TaskDetail
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
