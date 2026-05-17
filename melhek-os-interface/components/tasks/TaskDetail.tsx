'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Trash2, Calendar, Flag, FolderKanban, Loader2, User } from 'lucide-react'
import { getPriorityConfig, getStatusConfig, formatDate, formatDateTime, isOverdue } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Task, TaskStatus, TaskPriority, ProjectWithProgress, Profile } from '@/types'

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
  const supabase = createClient()

  // Local editable state — synced from task prop
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [dueDate, setDueDate] = useState(task.due_date ?? '')
  const [saving, setSaving] = useState(false)
  const [teamMembers, setTeamMembers] = useState<Pick<Profile, 'id' | 'full_name'>[]>([])

  // Sync local state when task prop changes (switching tasks)
  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description ?? '')
    setDueDate(task.due_date ?? '')
  }, [task.id, task.title, task.description, task.due_date])

  // Load team members for assignee dropdown
  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name')
      .order('full_name')
      .then(({ data }) => { if (data) setTeamMembers(data) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard: Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const save = useCallback(async (updates: Partial<Task>) => {
    setSaving(true)
    await onUpdate(updates)
    setSaving(false)
  }, [onUpdate])

  const saveTitle = useCallback(() => {
    const trimmed = title.trim()
    if (trimmed && trimmed !== task.title) save({ title: trimmed })
  }, [title, task.title, save])

  const saveDescription = useCallback(() => {
    const val = description.trim() || null
    if (val !== (task.description ?? null)) save({ description: val })
  }, [description, task.description, save])

  const saveDueDate = useCallback(() => {
    const val = dueDate || null
    if (val !== task.due_date) save({ due_date: val })
  }, [dueDate, task.due_date, save])

  const overdueTask = isOverdue(task.due_date) && task.status !== 'done'

  return (
    <div
      className="w-full sm:w-96 flex-shrink-0 flex flex-col"
      style={{
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(8,8,18,0.85)',
        backdropFilter: 'blur(16px)',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {/* ─── Header ──────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 py-4 flex-shrink-0 sticky top-0 z-10"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(8,8,18,0.95)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex items-center gap-2">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#0080FF' }} />}
          {overdueTask && (
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(255,68,68,0.15)', color: '#ff6666' }}>
              Overdue
            </span>
          )}
          <span className="text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>
            Task details
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--melhek-text-tertiary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ff6666')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--melhek-text-tertiary)')}
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--melhek-text-tertiary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--melhek-text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--melhek-text-tertiary)')}
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── Body ────────────────────────────────────────── */}
      <div className="flex-1 px-5 py-5 space-y-6">

        {/* Title — inline editable */}
        <textarea
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); (e.target as HTMLTextAreaElement).blur() } }}
          rows={2}
          className="w-full bg-transparent text-base font-semibold focus:outline-none resize-none leading-snug"
          style={{ color: 'var(--melhek-text-primary)' }}
          placeholder="Task title"
        />

        {/* ─── Status ───────────────────────────────────── */}
        <div>
          <label className="text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--melhek-text-tertiary)' }}>
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(s => {
              const cfg = getStatusConfig(s)
              const active = task.status === s
              return (
                <button
                  key={s}
                  onClick={() => save({ status: s })}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: active ? cfg.bg : 'rgba(255,255,255,0.04)',
                    color: active ? cfg.text : 'var(--melhek-text-secondary)',
                    border: active ? `1px solid ${cfg.text}40` : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ─── Priority ─────────────────────────────────── */}
        <div>
          <label className="text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--melhek-text-tertiary)' }}>
            <Flag className="w-3 h-3" /> Priority
          </label>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map(p => {
              const cfg = getPriorityConfig(p)
              const active = task.priority === p
              return (
                <button
                  key={p}
                  onClick={() => save({ priority: p })}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: active ? cfg.bg : 'rgba(255,255,255,0.04)',
                    color: active ? cfg.text : 'var(--melhek-text-secondary)',
                    border: active ? `1px solid ${cfg.text}40` : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ─── Project ──────────────────────────────────── */}
        <div>
          <label className="text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--melhek-text-tertiary)' }}>
            <FolderKanban className="w-3 h-3" /> Project
          </label>
          <select
            value={task.project_id ?? ''}
            onChange={e => save({ project_id: e.target.value || null })}
            className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--melhek-text-primary)',
            }}
          >
            <option value="">No project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
            ))}
          </select>
        </div>

        {/* ─── Assignee ─────────────────────────────────── */}
        <div>
          <label className="text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--melhek-text-tertiary)' }}>
            <User className="w-3 h-3" /> Assignee
          </label>
          <select
            value={task.assignee_id ?? ''}
            onChange={e => save({ assignee_id: e.target.value || null })}
            className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--melhek-text-primary)',
            }}
          >
            <option value="">Unassigned</option>
            {teamMembers.map(m => (
              <option key={m.id} value={m.id}>{m.full_name}</option>
            ))}
          </select>
        </div>

        {/* ─── Due Date ─────────────────────────────────── */}
        <div>
          <label className="text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--melhek-text-tertiary)' }}>
            <Calendar className="w-3 h-3" /> Due Date
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              onBlur={saveDueDate}
              className="flex-1 px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${overdueTask ? 'rgba(255,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: overdueTask ? '#ff6666' : 'var(--melhek-text-primary)',
                colorScheme: 'dark',
              }}
            />
            {dueDate && (
              <button
                onClick={() => { setDueDate(''); save({ due_date: null }) }}
                className="px-3 py-2 rounded-xl text-xs transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-tertiary)' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ─── Notes / Description ──────────────────────── */}
        <div>
          <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--melhek-text-tertiary)' }}>
            Notes
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            onBlur={saveDescription}
            rows={5}
            placeholder="Add notes, context, or links…"
            className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none leading-relaxed transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--melhek-text-primary)',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,128,255,0.4)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          />
        </div>

        {/* ─── Metadata ─────────────────────────────────── */}
        <div
          className="space-y-2 pt-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex justify-between text-xs">
            <span style={{ color: 'var(--melhek-text-tertiary)' }}>Created</span>
            <span style={{ color: 'var(--melhek-text-secondary)' }}>{formatDateTime(task.created_at)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: 'var(--melhek-text-tertiary)' }}>Updated</span>
            <span style={{ color: 'var(--melhek-text-secondary)' }}>{formatDateTime(task.updated_at)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: 'var(--melhek-text-tertiary)' }}>ID</span>
            <span className="font-mono text-[10px]" style={{ color: 'var(--melhek-text-tertiary)' }}>{task.id.slice(0, 8)}…</span>
          </div>
        </div>
      </div>
    </div>
  )
}
