'use client'

import { useState } from 'react'
import { X, Trash2, Calendar, Flag, FolderKanban, Loader2 } from 'lucide-react'
import { getPriorityConfig, getStatusConfig, formatDate } from '@/lib/utils'
import type { Task, TaskStatus, TaskPriority, ProjectWithProgress } from '@/types'

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done', 'cancelled']
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent']

interface Props {
  task: Task
  projects: ProjectWithProgress[]
  onUpdate: (updates: Partial<Task>) => Promise<void>
  onDelete: () => void
  onClose: () => void
}

export function TaskDetail({ task, projects, onUpdate, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [dueDate, setDueDate] = useState(task.due_date ?? '')
  const [saving, setSaving] = useState(false)

  const save = async (updates: Partial<Task>) => {
    setSaving(true)
    await onUpdate(updates)
    setSaving(false)
  }

  return (
    <div
      className="w-96 flex-shrink-0 flex flex-col overflow-y-auto"
      style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,10,20,0.75)', backdropFilter: 'blur(12px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#0080FF' }} />}
          <span className="text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>Task details</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onDelete} className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--melhek-text-tertiary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ff6666')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--melhek-text-tertiary)')}>
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--melhek-text-tertiary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--melhek-text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--melhek-text-tertiary)')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 px-5 py-5 space-y-5 overflow-y-auto">
        {/* Title */}
        <textarea
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={() => { if (title.trim() && title !== task.title) save({ title: title.trim() }) }}
          rows={2}
          className="w-full bg-transparent text-base font-semibold focus:outline-none resize-none leading-snug"
          style={{ color: 'var(--melhek-text-primary)' }}
        />

        {/* Status */}
        <div>
          <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--melhek-text-tertiary)' }}>Status</label>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(s => {
              const cfg = getStatusConfig(s)
              const active = task.status === s
              return (
                <button key={s} onClick={() => save({ status: s })}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: active ? cfg.bg : 'var(--melhek-bg-3)', color: active ? cfg.text : 'var(--melhek-text-secondary)', border: active ? `1px solid ${cfg.text}40` : '1px solid transparent' }}>
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--melhek-text-tertiary)' }}>Priority</label>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map(p => {
              const cfg = getPriorityConfig(p)
              const active = task.priority === p
              return (
                <button key={p} onClick={() => save({ priority: p })}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: active ? cfg.bg : 'var(--melhek-bg-3)', color: active ? cfg.text : 'var(--melhek-text-secondary)', border: active ? `1px solid ${cfg.text}40` : '1px solid transparent' }}>
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Project */}
        <div>
          <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--melhek-text-tertiary)' }}>Project</label>
          <select value={task.project_id ?? ''} onChange={e => save({ project_id: e.target.value || null })}
            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
            style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' }}>
            <option value="">No project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
          </select>
        </div>

        {/* Due Date */}
        <div>
          <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--melhek-text-tertiary)' }}>Due Date</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
            onBlur={() => save({ due_date: dueDate || null })}
            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
            style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)', colorScheme: 'dark' }}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--melhek-text-tertiary)' }}>Notes</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            onBlur={() => { if (description !== (task.description ?? '')) save({ description: description || null }) }}
            rows={5} placeholder="Add notes…"
            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none resize-none"
            style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' }}
          />
        </div>

        {/* Meta */}
        <div className="pt-2 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex justify-between text-xs">
            <span style={{ color: 'var(--melhek-text-tertiary)' }}>Created</span>
            <span style={{ color: 'var(--melhek-text-secondary)' }}>{formatDate(task.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
