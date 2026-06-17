'use client'

import { useState } from 'react'
import { FileText, Plus, Copy, Trash2, Edit3, Download, Search, X, Tag, CheckCircle2 } from 'lucide-react'
import { useProposals } from '@/hooks/useProposals'
import type { ProposalTemplate } from '@/types'
import { toast } from 'sonner'

const CATEGORY_COLORS: Record<string, { color: string; bg: string; icon: string }> = {
  web:        { color: '#0080FF', bg: 'rgba(0,128,255,0.12)',   icon: '🌐' },
  hotel:      { color: '#8b8bff', bg: 'rgba(139,139,255,0.12)', icon: '🏨' },
  menu:       { color: '#ff9500', bg: 'rgba(255,149,0,0.12)',   icon: '📋' },
  automation: { color: '#00D4FF', bg: 'rgba(0,212,255,0.12)',   icon: '⚡' },
  software:   { color: '#00d084', bg: 'rgba(0,208,132,0.12)',   icon: '💻' },
  custom:     { color: '#ffcc00', bg: 'rgba(255,204,0,0.12)',   icon: '📄' },
}

// ─── Template Editor ──────────────────────────────────────────
function TemplateEditor({
  template,
  onClose,
  onSave,
}: {
  template: Partial<ProposalTemplate> | null
  onClose: () => void
  onSave: (data: Partial<ProposalTemplate>) => void
}) {
  const isNew = !template?.id
  const [form, setForm] = useState({
    title: template?.title ?? '',
    category: template?.category ?? 'custom',
    content: template?.content ?? '',
    tags: template?.tags?.join(', ') ?? '',
  })

  const save = () => {
    if (!form.title.trim()) return
    onSave({
      title: form.title,
      category: form.category,
      content: form.content,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      is_default: template?.is_default ?? false,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl glass depth-3 border border-white/10 p-6"
        style={{ background: 'rgba(10,10,24,0.97)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: 'var(--melhek-text-primary)' }}>
            {isNew ? '+ New Template' : 'Edit Template'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" style={{ color: 'var(--melhek-text-tertiary)' }} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--melhek-text-secondary)' }}>Title</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Website Proposal"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--melhek-text-secondary)' }}>Category</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' }}>
              {Object.entries(CATEGORY_COLORS).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {k.charAt(0).toUpperCase() + k.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--melhek-text-secondary)' }}>
            Content (Markdown supported)
          </label>
          <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
            placeholder="# Proposal Title&#10;&#10;Write your proposal content here..."
            rows={18}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none font-mono"
            style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' }} />
        </div>

        <div className="mb-5">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--melhek-text-secondary)' }}>
            Tags (comma-separated)
          </label>
          <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
            placeholder="website, development, landing-page"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' }} />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--melhek-text-secondary)' }}>Cancel</button>
          <button onClick={save} disabled={!form.title.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #0080FF, #00D4FF)', color: '#000' }}>
            {isNew ? 'Create Template' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Template Card ────────────────────────────────────────────
function TemplateCard({
  t,
  onEdit,
  onDuplicate,
  onDelete,
  onExport,
}: {
  t: ProposalTemplate
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onExport: () => void
}) {
  const cat = CATEGORY_COLORS[t.category] ?? CATEGORY_COLORS.custom
  const wordCount = t.content.split(/\s+/).filter(Boolean).length

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-4 lift-on-hover relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none opacity-[0.06]"
        style={{ background: cat.color, filter: 'blur(20px)', transform: 'translate(40%,-40%)' }} />

      <div className="relative flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: cat.bg }}>
          {cat.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--melhek-text-primary)' }}>{t.title}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: cat.bg, color: cat.color }}>
              {t.category}
            </span>
            {t.is_default && (
              <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(0,128,255,0.1)', color: '#0080FF' }}>
                Default
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="text-xs leading-relaxed line-clamp-3 flex-1" style={{ color: 'var(--melhek-text-tertiary)' }}>
        {t.content.replace(/[#*`]/g, '').slice(0, 140)}…
      </div>

      {/* Tags */}
      {t.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {t.tags.slice(0, 4).map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--melhek-text-tertiary)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>{wordCount} words</p>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-white/5"
          style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-secondary)' }}>
          <Edit3 className="w-3 h-3" /> Edit
        </button>
        <button onClick={onDuplicate}
          className="flex items-center justify-center p-2 rounded-xl transition-colors hover:bg-white/5"
          style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-secondary)' }}
          title="Duplicate">
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button onClick={onExport}
          className="flex items-center justify-center p-2 rounded-xl transition-colors hover:bg-white/5"
          style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-secondary)' }}
          title="Copy to clipboard">
          <Download className="w-3.5 h-3.5" />
        </button>
        {!t.is_default && (
          <button onClick={onDelete}
            className="flex items-center justify-center p-2 rounded-xl transition-colors hover:bg-red-500/10"
            style={{ border: '1px solid rgba(255,68,68,0.15)', color: '#ff6666' }}
            title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Proposals Page ───────────────────────────────────────────
export default function ProposalsPage() {
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate } = useProposals()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editor, setEditor] = useState<Partial<ProposalTemplate> | null | undefined>(undefined)
  // undefined = closed, null = new, Partial = edit

  const filtered = templates.filter(t => {
    const matchesSearch = !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    const matchesCat = categoryFilter === 'all' || t.category === categoryFilter
    return matchesSearch && matchesCat
  })

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))]

  const handleExport = (t: ProposalTemplate) => {
    navigator.clipboard.writeText(t.content)
    toast.success('Proposal copied to clipboard!')
  }

  const handleSave = async (data: Partial<ProposalTemplate>) => {
    if (editor?.id) {
      await updateTemplate(editor.id, data)
    } else {
      await createTemplate({
        title: data.title ?? 'Untitled',
        category: data.category ?? 'custom',
        content: data.content ?? '',
        tags: data.tags ?? [],
        is_default: false,
      })
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--melhek-text-primary)' }}>
              <FileText className="w-5 h-5" style={{ color: '#0080FF' }} />
              Proposal Library
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--melhek-text-tertiary)' }}>
              {templates.length} templates ready to deploy
            </p>
          </div>
          <button onClick={() => setEditor(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #0080FF, #00D4FF)', color: '#000' }}>
            <Plus className="w-4 h-4" /> New Template
          </button>
        </div>

        {/* Search + Category filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--melhek-text-tertiary)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--melhek-text-primary)' }} />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: categoryFilter === cat ? 'rgba(0,128,255,0.2)' : 'rgba(255,255,255,0.04)',
                  color: categoryFilter === cat ? '#0080FF' : 'var(--melhek-text-tertiary)',
                  border: `1px solid ${categoryFilter === cat ? 'rgba(0,128,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                {cat === 'all' ? 'All' : `${CATEGORY_COLORS[cat]?.icon ?? '📄'} ${cat}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-64 rounded-2xl shimmer" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <FileText className="w-10 h-10 opacity-20" style={{ color: 'var(--melhek-text-secondary)' }} />
            <p className="text-sm" style={{ color: 'var(--melhek-text-tertiary)' }}>No templates found</p>
            <button onClick={() => setEditor(null)}
              className="text-xs px-4 py-2 rounded-xl"
              style={{ background: 'rgba(0,128,255,0.15)', color: '#0080FF' }}>
              Create your first template →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t => (
              <TemplateCard key={t.id} t={t}
                onEdit={() => setEditor(t)}
                onDuplicate={() => duplicateTemplate(t.id)}
                onDelete={() => deleteTemplate(t.id)}
                onExport={() => handleExport(t)} />
            ))}
          </div>
        )}
      </div>

      {/* Editor modal */}
      {editor !== undefined && (
        <TemplateEditor
          template={editor}
          onClose={() => setEditor(undefined)}
          onSave={handleSave} />
      )}
    </div>
  )
}
