'use client'

import { useState } from 'react'
import { useProjects } from '@/hooks/useProjects'
import { useUser } from '@/hooks/useUser'
import { getProjectStatusConfig } from '@/lib/utils'
import { Plus, FolderKanban, X, Loader2 } from 'lucide-react'
import Link from 'next/link'

const COLORS = ['#00d4ff', '#0080FF', '#00d084', '#ff9500', '#ff4444', '#a855f7', '#f59e0b']
const ICONS = ['📁', '🚀', '💼', '🏗️', '🎯', '🔧', '📊', '⚡', '🌐', '🛡️']

function CreateProjectModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: { name: string; description: string; color: string; icon: string; target_date: string | null }) => void }) {
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
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden depth-3"
        style={{ background: 'var(--melhek-bg-1)', border: '1px solid rgba(0,128,255,0.2)' }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--melhek-text-primary)' }}>New Project</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--melhek-text-tertiary)' }}>
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

          {/* Color */}
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

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'var(--melhek-bg-3)', color: 'var(--melhek-text-secondary)' }}>
              Cancel
            </button>
            <button type="submit" disabled={!name.trim() || loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-black transition-all press-scale flex items-center justify-center gap-2 disabled:opacity-50"
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

export default function ProjectsPage() {
  const { profile } = useUser()
  const { projects, loading, createProject } = useProjects()
  const [showCreate, setShowCreate] = useState(false)

  const handleCreate = async (data: { name: string; description: string; color: string; icon: string; target_date: string | null }) => {
    if (!profile) return
    await createProject({ ...data, owner_id: profile.id })
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--melhek-text-primary)' }}>Projects</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--melhek-text-tertiary)' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-black transition-all press-scale"
          style={{ background: 'linear-gradient(135deg,#0080FF,#00D4FF)' }}>
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 rounded-2xl shimmer" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="glass rounded-2xl flex flex-col items-center py-20" style={{ color: 'var(--melhek-text-tertiary)' }}>
          <FolderKanban className="w-10 h-10 mb-3 opacity-30" />
          <p className="font-medium" style={{ color: 'var(--melhek-text-secondary)' }}>No projects yet</p>
          <p className="text-sm mt-1">Create your first project to get started</p>
          <button onClick={() => setShowCreate(true)}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(0,128,255,0.15)', color: '#00D4FF' }}>
            Create a project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(proj => {
            const s = getProjectStatusConfig(proj.status)
            return (
              <Link href={`/projects/${proj.id}`} key={proj.id}
                className="glass depth-2 rounded-2xl p-5 flex flex-col gap-4 lift-on-hover relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.06] pointer-events-none"
                  style={{ background: proj.color, filter: 'blur(40px)', transform: 'translate(30%,-30%)' }} />
                <div className="flex items-start justify-between gap-2 relative">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{proj.icon}</span>
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--melhek-text-primary)' }}>{proj.name}</h3>
                      {proj.description && <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--melhek-text-tertiary)' }}>{proj.description}</p>}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg flex-shrink-0" style={{ background: s.bg, color: s.text }}>{s.label}</span>
                </div>
                <div className="relative">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: 'var(--melhek-text-tertiary)' }}>{proj.done_tasks}/{proj.total_tasks} tasks done</span>
                    <span style={{ color: proj.color }}>{proj.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--melhek-bg-3)' }}>
                    <div className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${proj.progress}%`, background: `linear-gradient(90deg, ${proj.color}, ${proj.color}aa)` }} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  )
}
