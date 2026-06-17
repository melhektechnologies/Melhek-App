'use client'

import { useState, useMemo, useRef } from 'react'
import {
  TrendingUp, Plus, Search, LayoutGrid, List, Phone, MessageCircle, Mail,
  FileText, Edit2, Trash2, X, ChevronDown, ExternalLink, Target, DollarSign,
  Calendar, User, Building, Percent, StickyNote, MoreHorizontal
} from 'lucide-react'
import { useOpportunities } from '@/hooks/useOpportunities'
import { useNotes } from '@/hooks/useNotes'
import { useRevenue, formatETB, noContactLabel } from '@/hooks/useRevenue'
import type { Opportunity, OpportunityStage, Note } from '@/types'

// ─── Stage config ─────────────────────────────────────────────
const STAGES: { key: OpportunityStage; label: string; color: string; bg: string }[] = [
  { key: 'lead',          label: 'Lead',          color: '#8b8bff', bg: 'rgba(139,139,255,0.12)' },
  { key: 'contacted',     label: 'Contacted',     color: '#00D4FF', bg: 'rgba(0,212,255,0.12)' },
  { key: 'proposal_sent', label: 'Proposal Sent', color: '#ff9500', bg: 'rgba(255,149,0,0.12)' },
  { key: 'follow_up',     label: 'Follow-Up',     color: '#ffcc00', bg: 'rgba(255,204,0,0.12)' },
  { key: 'negotiation',   label: 'Negotiation',   color: '#ff6b35', bg: 'rgba(255,107,53,0.12)' },
  { key: 'won',           label: 'Won',           color: '#00d084', bg: 'rgba(0,208,132,0.12)' },
  { key: 'lost',          label: 'Lost',          color: '#ff4444', bg: 'rgba(255,68,68,0.12)' },
]

const stageMap = Object.fromEntries(STAGES.map(s => [s.key, s]))

const INDUSTRIES = ['Technology', 'Hospitality', 'Restaurant', 'Retail', 'Healthcare', 'Education', 'Real Estate', 'Finance', 'Manufacturing', 'Other']

// ─── Opportunity Form ─────────────────────────────────────────
function OpportunityDrawer({
  opp,
  onClose,
  onSave,
  linkedNotes,
}: {
  opp: Partial<Opportunity> | null
  onClose: () => void
  onSave: (data: Partial<Opportunity>) => void
  linkedNotes?: Note[]
}) {
  const isNew = !opp?.id
  const [form, setForm] = useState({
    company_name: opp?.company_name ?? '',
    contact_name: opp?.contact_name ?? '',
    phone: opp?.phone ?? '',
    industry: opp?.industry ?? '',
    potential_revenue: opp?.potential_revenue?.toString() ?? '',
    probability: opp?.probability?.toString() ?? '50',
    stage: opp?.stage ?? 'lead' as OpportunityStage,
    last_contact_date: opp?.last_contact_date ?? '',
    next_action: opp?.next_action ?? '',
    next_action_date: opp?.next_action_date ?? '',
    notes: opp?.notes ?? '',
    proposal_link: opp?.proposal_link ?? '',
  })

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = () => {
    if (!form.company_name.trim()) return
    onSave({
      ...form,
      potential_revenue: parseFloat(form.potential_revenue) || 0,
      probability: parseInt(form.probability) || 50,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl glass depth-3 border border-white/10 p-6 space-y-5"
        style={{ background: 'rgba(10,10,24,0.97)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'var(--melhek-text-primary)' }}>
            {isNew ? '+ New Opportunity' : 'Edit Opportunity'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" style={{ color: 'var(--melhek-text-tertiary)' }} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Company */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--melhek-text-secondary)' }}>
              Company Name *
            </label>
            <input value={form.company_name} onChange={e => set('company_name', e.target.value)}
              placeholder="Acme Hotel Group"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' }} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--melhek-text-secondary)' }}>Contact Name</label>
            <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
              placeholder="Abebe Girma"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' }} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--melhek-text-secondary)' }}>Phone</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="+251 9XX XXX XXX"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' }} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--melhek-text-secondary)' }}>Industry</label>
            <select value={form.industry} onChange={e => set('industry', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' }}>
              <option value="">Select industry</option>
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--melhek-text-secondary)' }}>Stage</label>
            <select value={form.stage} onChange={e => set('stage', e.target.value as OpportunityStage)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: stageMap[form.stage]?.color ?? 'var(--melhek-text-primary)' }}>
              {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--melhek-text-secondary)' }}>
              Potential Revenue (ETB)
            </label>
            <input type="number" value={form.potential_revenue} onChange={e => set('potential_revenue', e.target.value)}
              placeholder="25000"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' }} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--melhek-text-secondary)' }}>
              Probability: {form.probability}%
            </label>
            <input type="range" min="0" max="100" value={form.probability} onChange={e => set('probability', e.target.value)}
              className="w-full h-2 rounded-full outline-none cursor-pointer"
              style={{ accentColor: '#0080FF' }} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--melhek-text-secondary)' }}>Last Contact</label>
            <input type="date" value={form.last_contact_date} onChange={e => set('last_contact_date', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)', colorScheme: 'dark' }} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--melhek-text-secondary)' }}>Next Action Date</label>
            <input type="date" value={form.next_action_date} onChange={e => set('next_action_date', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)', colorScheme: 'dark' }} />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--melhek-text-secondary)' }}>Next Action</label>
            <input value={form.next_action} onChange={e => set('next_action', e.target.value)}
              placeholder="Send updated proposal, call to follow up..."
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' }} />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--melhek-text-secondary)' }}>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Meeting notes, requirements, context..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' }} />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--melhek-text-secondary)' }}>Proposal Link</label>
            <input value={form.proposal_link} onChange={e => set('proposal_link', e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' }} />
          </div>
        </div>

        {/* Expected revenue preview */}
        <div className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: 'rgba(0,128,255,0.08)', border: '1px solid rgba(0,128,255,0.15)' }}>
          <span className="text-xs" style={{ color: 'var(--melhek-text-secondary)' }}>Expected Revenue</span>
          <span className="text-sm font-bold" style={{ color: '#00D4FF' }}>
            {formatETB((parseFloat(form.potential_revenue) || 0) * (parseInt(form.probability) || 0) / 100)}
          </span>
        </div>

        {/* Linked Notes Timeline */}
        {!isNew && linkedNotes && linkedNotes.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--melhek-text-secondary)' }}>
              <StickyNote className="w-3.5 h-3.5" style={{ color: '#0080FF' }} /> Linked Notes & Timeline
            </h3>
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {linkedNotes.map(note => (
                <div key={note.id} className="p-3 rounded-xl border border-white/5 space-y-1 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold truncate" style={{ color: 'var(--melhek-text-primary)' }}>
                      {note.title || 'Untitled Note'}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--melhek-text-tertiary)' }}>
                      {new Date(note.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] line-clamp-2" style={{ color: 'var(--melhek-text-secondary)' }}>
                    {note.content.replace(/[#*`>\-]/g, '').trim() || 'No content...'}
                  </p>
                  <div className="flex justify-end pt-1">
                    <a href={`/notes?id=${note.id}`} className="text-[10px] flex items-center gap-1 hover:underline" style={{ color: '#0080FF' }}>
                      Open Note →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--melhek-text-secondary)' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={!form.company_name.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #0080FF, #00D4FF)', color: '#000' }}>
            {isNew ? 'Add to Pipeline' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Kanban Card ──────────────────────────────────────────────
function KanbanCard({
  opp, onEdit, onDelete, onMoveStage,
}: {
  opp: Opportunity
  onEdit: () => void
  onDelete: () => void
  onMoveStage: (stage: OpportunityStage) => void
}) {
  const [showActions, setShowActions] = useState(false)
  const stage = stageMap[opp.stage]
  const noContact = noContactLabel(opp.last_contact_date)

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('opportunityId', opp.id)
  }

  return (
    <div draggable onDragStart={handleDragStart}
      className="glass rounded-xl p-3 cursor-grab active:cursor-grabbing lift-on-hover relative group"
      style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--melhek-text-primary)' }}>
            {opp.company_name}
          </p>
          {opp.contact_name && (
            <p className="text-xs truncate" style={{ color: 'var(--melhek-text-tertiary)' }}>{opp.contact_name}</p>
          )}
        </div>
        <button onClick={() => setShowActions(!showActions)} className="p-1 rounded-lg flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-3.5 h-3.5" style={{ color: 'var(--melhek-text-tertiary)' }} />
        </button>
      </div>

      {/* Expected revenue */}
      <div className="text-base font-bold mb-2" style={{ color: '#00D4FF' }}>
        {formatETB(opp.expected_revenue ?? 0)}
        <span className="text-xs font-normal ml-1" style={{ color: 'var(--melhek-text-tertiary)' }}>
          ({opp.probability}%)
        </span>
      </div>

      {opp.next_action && (
        <p className="text-xs truncate mb-2" style={{ color: 'var(--melhek-text-secondary)' }}>
          → {opp.next_action}
        </p>
      )}

      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>{noContact}</span>
        {opp.phone && (
          <a href={`tel:${opp.phone}`} className="p-1 rounded hover:bg-white/5 transition-colors ml-auto">
            <Phone className="w-3 h-3" style={{ color: '#00d084' }} />
          </a>
        )}
        {opp.phone && (
          <a href={`https://wa.me/${opp.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
            className="p-1 rounded hover:bg-white/5 transition-colors">
            <MessageCircle className="w-3 h-3" style={{ color: '#25d366' }} />
          </a>
        )}
      </div>

      {/* Actions dropdown */}
      {showActions && (
        <div className="absolute top-10 right-2 z-10 glass rounded-xl p-1 min-w-[130px] depth-3 border border-white/10"
          style={{ background: 'rgba(10,10,24,0.97)' }}>
          <button onClick={() => { onEdit(); setShowActions(false) }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-white/5 transition-colors text-left"
            style={{ color: 'var(--melhek-text-secondary)' }}>
            <Edit2 className="w-3 h-3" /> Edit
          </button>
          {opp.proposal_link && (
            <a href={opp.proposal_link} target="_blank" rel="noreferrer"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-white/5 transition-colors"
              style={{ color: 'var(--melhek-text-secondary)' }}>
              <ExternalLink className="w-3 h-3" /> Proposal
            </a>
          )}
          <button onClick={() => { onDelete(); setShowActions(false) }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-red-500/10 transition-colors text-left"
            style={{ color: '#ff6666' }}>
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Kanban Column ────────────────────────────────────────────
function KanbanColumn({
  stage, opportunities, onAdd, onEdit, onDelete, onMoveStage,
}: {
  stage: typeof STAGES[0]
  opportunities: Opportunity[]
  onAdd: () => void
  onEdit: (opp: Opportunity) => void
  onDelete: (id: string) => void
  onMoveStage: (id: string, stage: OpportunityStage) => void
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const totalValue = opportunities.reduce((s, o) => s + (o.expected_revenue ?? 0), 0)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }
  const handleDragLeave = () => setIsDragOver(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const id = e.dataTransfer.getData('opportunityId')
    if (id) onMoveStage(id, stage.key)
  }

  return (
    <div className="flex-shrink-0 w-64 flex flex-col gap-2"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl"
        style={{ background: stage.bg, border: `1px solid ${stage.color}30` }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
          <span className="text-xs font-semibold" style={{ color: stage.color }}>{stage.label}</span>
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: `${stage.color}25`, color: stage.color }}>
            {opportunities.length}
          </span>
        </div>
        {totalValue > 0 && (
          <span className="text-xs font-medium" style={{ color: 'var(--melhek-text-tertiary)' }}>
            {formatETB(totalValue)}
          </span>
        )}
      </div>

      {/* Cards */}
      <div className={`flex flex-col gap-2 min-h-[80px] p-1.5 rounded-xl transition-all ${isDragOver ? 'bg-white/[0.03] ring-1 ring-blue-500/30' : ''}`}>
        {opportunities.map(opp => (
          <KanbanCard key={opp.id} opp={opp}
            onEdit={() => onEdit(opp)}
            onDelete={() => onDelete(opp.id)}
            onMoveStage={(s) => onMoveStage(opp.id, s)} />
        ))}
        {stage.key !== 'won' && stage.key !== 'lost' && (
          <button onClick={onAdd}
            className="w-full py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1"
            style={{ border: `1px dashed ${stage.color}30`, color: 'var(--melhek-text-tertiary)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = stage.color}
            onMouseLeave={e => e.currentTarget.style.borderColor = `${stage.color}30`}>
            <Plus className="w-3 h-3" /> Add
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Table Row ────────────────────────────────────────────────
function TableRow({ opp, onEdit, onDelete }: { opp: Opportunity; onEdit: () => void; onDelete: () => void }) {
  const stage = stageMap[opp.stage]
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = opp.next_action_date && opp.next_action_date < today

  return (
    <tr className="group transition-colors hover:bg-white/[0.025]"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--melhek-text-primary)' }}>{opp.company_name}</p>
          {opp.contact_name && <p className="text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>{opp.contact_name}</p>}
        </div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-xs px-2 py-1 rounded-lg" style={{ background: stage.bg, color: stage.color }}>
          {stage.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-bold" style={{ color: '#00D4FF' }}>
          {formatETB(opp.expected_revenue ?? 0)}
        </span>
        <span className="text-xs ml-1" style={{ color: 'var(--melhek-text-tertiary)' }}>({opp.probability}%)</span>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className="text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>{noContactLabel(opp.last_contact_date)}</span>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        {opp.next_action_date && (
          <span className="text-xs" style={{ color: isOverdue ? '#ff6666' : 'var(--melhek-text-tertiary)' }}>
            {isOverdue ? '⚠ ' : ''}{opp.next_action_date}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {opp.phone && (
            <a href={`tel:${opp.phone}`} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <Phone className="w-3.5 h-3.5" style={{ color: '#00d084' }} />
            </a>
          )}
          {opp.phone && (
            <a href={`https://wa.me/${opp.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <MessageCircle className="w-3.5 h-3.5" style={{ color: '#25d366' }} />
            </a>
          )}
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <Edit2 className="w-3.5 h-3.5" style={{ color: 'var(--melhek-text-tertiary)' }} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" style={{ color: '#ff6666' }} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Main Pipeline Page ───────────────────────────────────────
export default function PipelinePage() {
  const { opportunities, loading, createOpportunity, updateOpportunity, deleteOpportunity, moveStage } = useOpportunities()
  const { notes } = useNotes()
  const { stats, pipelineValue } = useRevenue(opportunities)
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<OpportunityStage | 'all'>('all')
  const [drawerOpp, setDrawerOpp] = useState<Partial<Opportunity> | null | undefined>(undefined)
  // undefined = closed, null = new, Partial<Opportunity> = edit

  const linkedNotes = useMemo(() => {
    if (!drawerOpp?.id) return []
    return notes.filter(n => n.note_links?.some(link => link.opportunity_id === drawerOpp.id))
  }, [notes, drawerOpp])

  const filtered = useMemo(() => {
    let list = opportunities
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(o =>
        o.company_name.toLowerCase().includes(q) ||
        (o.contact_name ?? '').toLowerCase().includes(q) ||
        (o.industry ?? '').toLowerCase().includes(q)
      )
    }
    if (stageFilter !== 'all') list = list.filter(o => o.stage === stageFilter)
    return list
  }, [opportunities, search, stageFilter])

  const byStage = useMemo(() => {
    const map: Record<OpportunityStage, Opportunity[]> = {
      lead: [], contacted: [], proposal_sent: [], follow_up: [], negotiation: [], won: [], lost: []
    }
    filtered.forEach(o => { map[o.stage]?.push(o) })
    return map
  }, [filtered])

  const handleSave = async (data: Partial<Opportunity>) => {
    if (drawerOpp?.id) {
      await updateOpportunity(drawerOpp.id, data)
    } else {
      await createOpportunity({
        company_name: data.company_name!,
        contact_name: data.contact_name,
        phone: data.phone,
        industry: data.industry,
        potential_revenue: data.potential_revenue ?? 0,
        probability: data.probability,
        stage: data.stage,
        last_contact_date: data.last_contact_date,
        next_action: data.next_action,
        next_action_date: data.next_action_date,
        notes: data.notes,
        proposal_link: data.proposal_link,
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
              <TrendingUp className="w-5 h-5" style={{ color: '#0080FF' }} />
              Pipeline
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--melhek-text-tertiary)' }}>
              {opportunities.filter(o => !['won','lost'].includes(o.stage)).length} active deals ·{' '}
              {formatETB(pipelineValue)} expected
            </p>
          </div>
          <button onClick={() => setDrawerOpp(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #0080FF, #00D4FF)', color: '#000' }}>
            <Plus className="w-4 h-4" /> Add Deal
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--melhek-text-tertiary)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search pipeline…"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--melhek-text-primary)' }} />
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--melhek-bg-3)' }}>
            <button onClick={() => setView('kanban')}
              className="p-2 rounded-lg transition-all"
              style={{ background: view === 'kanban' ? 'rgba(0,128,255,0.2)' : 'transparent', color: view === 'kanban' ? '#0080FF' : 'var(--melhek-text-tertiary)' }}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setView('table')}
              className="p-2 rounded-lg transition-all"
              style={{ background: view === 'table' ? 'rgba(0,128,255,0.2)' : 'transparent', color: view === 'table' ? '#0080FF' : 'var(--melhek-text-tertiary)' }}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm" style={{ color: 'var(--melhek-text-tertiary)' }}>Loading pipeline…</div>
        </div>
      ) : view === 'kanban' ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <div className="flex gap-4 h-full pb-4" style={{ minWidth: 'max-content' }}>
            {STAGES.map(stage => (
              <KanbanColumn
                key={stage.key}
                stage={stage}
                opportunities={byStage[stage.key]}
                onAdd={() => setDrawerOpp({ stage: stage.key })}
                onEdit={opp => setDrawerOpp(opp)}
                onDelete={id => deleteOpportunity(id)}
                onMoveStage={(id, s) => moveStage(id, s)} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Company', 'Stage', 'Expected', 'Last Contact', 'Next Action', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: 'var(--melhek-text-tertiary)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(opp => (
                  <TableRow key={opp.id} opp={opp}
                    onEdit={() => setDrawerOpp(opp)}
                    onDelete={() => deleteOpportunity(opp.id)} />
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-16 flex flex-col items-center gap-3">
                <TrendingUp className="w-8 h-8 opacity-20" style={{ color: 'var(--melhek-text-secondary)' }} />
                <p className="text-sm" style={{ color: 'var(--melhek-text-tertiary)' }}>No opportunities yet</p>
                <button onClick={() => setDrawerOpp(null)}
                  className="text-xs px-4 py-2 rounded-xl font-medium"
                  style={{ background: 'rgba(0,128,255,0.15)', color: '#0080FF' }}>
                  Add your first deal →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drawer */}
      {drawerOpp !== undefined && (
        <OpportunityDrawer
          opp={drawerOpp}
          onClose={() => setDrawerOpp(undefined)}
          onSave={handleSave}
          linkedNotes={linkedNotes} />
      )}
    </div>
  )
}
