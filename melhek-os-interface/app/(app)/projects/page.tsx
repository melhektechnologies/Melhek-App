'use client'

import { useState } from 'react'
import { useProjects } from '@/hooks/useProjects'
import { useUser } from '@/hooks/useUser'
import { getProjectStatusConfig } from '@/lib/utils'
import { Plus, FolderKanban, X, Loader2, MoreHorizontal, Archive, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { ProjectStatus } from '@/types'

const COLORS = ['#00d4ff', '#0080FF', '#00d084', '#ff9500', '#ff4444', '#a855f7', '#f59e0b', '#06b6d4']
const ICONS = ['📁', '🚀', '💼', '🏗️', '🎯', '🔧', '📊', '⚡', '🌐', '🛡️', '🧠', '🎨']

// ─── Create Modal ─────────────────────────────────────────────
function CreateProjectModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (data: { name: string; description: string; color: string; icon: string; target_date: string | null }) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#00d4ff')
  const [icon, setIcon] = useState('📁')
  const [targetDate, setTargetDate] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await onCreate({ name: name.trim(), description, color, icon, target_date: targetDate || null })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden depth-3"
        style={{ background: 'var(--melhek-bg-1)', border: '1px solid rgba(0,128,255,0.2)' }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--melhek-text-primary)' }}>New Project</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--melhek-text-tertiary)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {/* Icon + Name */}
          <div className="flex gap-3">
            <select value={icon} onChange={e => setIcon(e.target.value)}
              className="w-16 px-2 py-2.5 rounded-xl text-center text-xl focus:outline-none"
              style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              placeholder="Project name" autoFocus
              className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' }}
            />
          </div>
          {/* Description */}
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Short description (optional)" rows={2}
            className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none resize-none"
            style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' }}
          />
          {/* Color picker */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--melhek-text-tertiary)' }}>Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button type="button" key={c} onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{ background: c, outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }} />
              ))}
            </div>
          </div>
          {/* Target date */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--melhek-text-tertiary)' }}>Target date (optional)</label>
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)', colorScheme: 'dark' }}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: 'var(--melhek-bg-3)', color: 'var(--melhek-text-secondary)' }}>
              Cancel
            </button>
            <button type="submit" disabled={!name.trim() || loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-black press-scale flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#0080FF,#00D4FF)' }}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Project Card Menu ────────────────────────────────────────
function ProjectMenu({ onArchive, onDelete }: { onArchive: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={e => { e.preventDefault(); setOpen(v => !v) }}
        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
        style={{ color: 'var(--melhek-text-tertiary)', background: 'rgba(255,255,255,0.05)' }}>
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 w-40 rounded-xl overflow-hidden z-20 depth-3"
            style={{ background: 'var(--melhek-bg-2)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button onClick={e => { e.preventDefault(); onArchive(); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-white/5 transition-colors"
              style={{ color: 'var(--melhek-text-secondary)' }}>
              <Archive className="w-3.5 h-3.5" /> Archive
            </button>
            <button onClick={e => { e.preventDefault(); onDelete(); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-white/5 transition-colors"
              style={{ color: '#ff6666' }}>
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Status filter tabs ───────────────────────────────────────
const STATUS_TABS: { value: ProjectStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

// ─── Projects Page ────────────────────────────────────────────
export default function ProjectsPage() {
  const { profile } = useUser()
  const { projects, loading, createProject, updateProject, deleteProject } = useProjects()
  const [showCreate, setShowCreate] = useState(false)
  const [statusTab, setStatusTab] = useState<ProjectStatus | 'all'>('all')

  const filtered = projects.filter(p => statusTab === 'all' || p.status === statusTab)

  const handleCreate = async (data: { name: string; description: string; color: string; icon: string; target_date: string | null }) => {
    if (!profile) return
    await createProject({ ...data, owner_id: profile.id })
  }

  const handleArchive = async (id: string) => {
    await updateProject(id, { status: 'archived' })
    toast.success('Project archived')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project? Tasks will be unlinked.')) return
    await deleteProject(id)
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 pb-12 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--melhek-text-primary)' }}>Projects</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--melhek-text-tertiary)' }}>
            {filtered.length} project{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-black press-scale flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#0080FF,#00D4FF)' }}>
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: 'var(--melhek-bg-2)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {STATUS_TABS.map(tab => (
          <button key={tab.value} onClick={() => setStatusTab(tab.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: statusTab === tab.value ? 'rgba(0,128,255,0.2)' : 'transparent',
              color: statusTab === tab.value ? '#00D4FF' : 'var(--melhek-text-secondary)',
              border: statusTab === tab.value ? '1px solid rgba(0,128,255,0.3)' : '1px solid transparent',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 rounded-2xl shimmer" style={{ opacity: 1 - i * 0.1 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl flex flex-col items-center py-20" style={{ color: 'var(--melhek-text-tertiary)' }}>
          <FolderKanban className="w-10 h-10 mb-3 opacity-20" />
          <p className="font-medium" style={{ color: 'var(--melhek-text-secondary)' }}>
            {statusTab !== 'all' ? `No ${statusTab} projects` : 'No projects yet'}
          </p>
          <p className="text-sm mt-1">
            {statusTab !== 'all' ? 'Try a different filter' : 'Create your first project to get started'}
          </p>
          {statusTab === 'all' && (
            <button onClick={() => setShowCreate(true)}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: 'rgba(0,128,255,0.12)', color: '#00D4FF', border: '1px solid rgba(0,128,255,0.2)' }}>
              Create a project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(proj => {
            const s = getProjectStatusConfig(proj.status)
            return (
              <Link href={`/projects/${proj.id}`} key={proj.id}
                className="glass depth-2 rounded-2xl p-5 flex flex-col gap-4 lift-on-hover relative overflow-hidden group">
                {/* Ambient color glow */}
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.07] pointer-events-none"
                  style={{ background: proj.color, filter: 'blur(40px)', transform: 'translate(30%,-30%)' }} />
                <div className="flex items-start justify-between gap-2 relative">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{proj.icon}</span>
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--melhek-text-primary)' }}>{proj.name}</h3>
                      {proj.description && (
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--melhek-text-tertiary)' }}>{proj.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs px-2 py-1 rounded-lg" style={{ background: s.bg, color: s.text }}>{s.label}</span>
                    <ProjectMenu
                      onArchive={() => handleArchive(proj.id)}
                      onDelete={() => handleDelete(proj.id)}
                    />
                  </div>
                </div>
                <div className="relative">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: 'var(--melhek-text-tertiary)' }}>{proj.done_tasks}/{proj.total_tasks} tasks done</span>
                    <span style={{ color: proj.color }}>{proj.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--melhek-bg-3)' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${proj.progress}%`, background: `linear-gradient(90deg, ${proj.color}, ${proj.color}aa)` }} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  )
}
