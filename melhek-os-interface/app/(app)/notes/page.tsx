'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useUser } from '@/hooks/useUser'
import { useNotes } from '@/hooks/useNotes'
import { useProjects } from '@/hooks/useProjects'
import { renderMarkdown } from '@/lib/markdown'
import { formatDateTime } from '@/lib/utils'
import {
  Plus, Search, Pin, PinOff, Trash2, Eye, EyeOff,
  Bold, Italic, Code, List, Link as LinkIcon, Image,
  Upload, X, Tag, FolderKanban, FileText, Loader2,
} from 'lucide-react'
import type { Note } from '@/types'

// ─── Autosave debounce (ms) ──────────────────────────────────
const AUTOSAVE_MS = 1000

// ─── Tag pill ────────────────────────────────────────────────
function TagPill({ tag, onRemove }: { tag: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
      style={{ background: 'rgba(0,128,255,0.12)', color: '#00D4FF', border: '1px solid rgba(0,128,255,0.2)' }}>
      {tag}
      {onRemove && (
        <button onClick={onRemove} className="opacity-60 hover:opacity-100">
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  )
}

// ─── Toolbar button ──────────────────────────────────────────
function TB({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title}
      className="p-1.5 rounded transition-colors hover:bg-white/10"
      style={{ color: 'var(--melhek-text-secondary)' }}>
      {children}
    </button>
  )
}

// ─── Main Notes Page ─────────────────────────────────────────
export default function NotesPage() {
  const { profile } = useUser()
  const { notes, loading, createNote, updateNote, deleteNote, togglePin, uploadAttachment } = useNotes()
  const { projects } = useProjects()

  // UI state
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list')

  // Editor local state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Derived ───────────────────────────────────────────────
  const selectedNote = useMemo(() => notes.find(n => n.id === selectedId) ?? null, [notes, selectedId])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return notes
    return notes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some(t => t.toLowerCase().includes(q))
    )
  }, [notes, search])

  const pinned = useMemo(() => filtered.filter(n => n.is_pinned), [filtered])
  const unpinned = useMemo(() => filtered.filter(n => !n.is_pinned), [filtered])

  // ─── Sync editor when selection changes ───────────────────
  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title)
      setContent(selectedNote.content)
      setPreview(false)
    }
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Autosave debounce ────────────────────────────────────
  const scheduleAutosave = useCallback((id: string, t: string, c: string) => {
    clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(async () => {
      setSaving(true)
      await updateNote(id, { title: t || 'Untitled Note', content: c })
      setSaving(false)
    }, AUTOSAVE_MS)
  }, [updateNote])

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (selectedId) scheduleAutosave(selectedId, val, content)
  }

  const handleContentChange = (val: string) => {
    setContent(val)
    if (selectedId) scheduleAutosave(selectedId, title, val)
  }

  // ─── Create note ──────────────────────────────────────────
  const handleCreate = async () => {
    if (!profile) return
    const note = await createNote(profile.id)
    if (note) {
      setSelectedId(note.id)
      setMobileView('editor')
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }

  // ─── Delete ───────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note permanently?')) return
    await deleteNote(id)
    if (selectedId === id) { setSelectedId(null); setMobileView('list') }
  }

  // ─── Toolbar insert helpers ───────────────────────────────
  const insert = useCallback((before: string, after = '', placeholder = 'text') => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const sel = el.value.slice(start, end) || placeholder
    const newVal = el.value.slice(0, start) + before + sel + after + el.value.slice(end)
    handleContentChange(newVal)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + before.length, start + before.length + sel.length)
    }, 0)
  }, [content]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Tags ─────────────────────────────────────────────────
  const addTag = async (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || !tagInput.trim() || !selectedNote) return
    const tag = tagInput.trim().toLowerCase()
    if (selectedNote.tags.includes(tag)) { setTagInput(''); return }
    const tags = [...selectedNote.tags, tag]
    await updateNote(selectedNote.id, { tags })
    setTagInput('')
  }

  const removeTag = async (tag: string) => {
    if (!selectedNote) return
    await updateNote(selectedNote.id, { tags: selectedNote.tags.filter(t => t !== tag) })
  }

  // ─── Project link ─────────────────────────────────────────
  const handleProjectLink = async (projectId: string) => {
    if (!selectedNote) return
    await updateNote(selectedNote.id, { project_id: projectId || null })
  }

  // ─── File upload ──────────────────────────────────────────
  const handleFiles = async (files: FileList | null) => {
    if (!files || !selectedId) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const url = await uploadAttachment(selectedId, file)
      if (url) {
        const isImage = file.type.startsWith('image/')
        const mdInsert = isImage ? `\n![${file.name}](${url})\n` : `\n[${file.name}](${url})\n`
        const newContent = content + mdInsert
        setContent(newContent)
        await updateNote(selectedId, { content: newContent })
      }
    }
    setUploading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  // ─── Keyboard shortcuts ───────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey)) {
        if (e.key === 'n') { e.preventDefault(); handleCreate() }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [profile]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden">

      {/* ─── Sidebar: Note List ──────────────────────────── */}
      <div
        className={`flex-shrink-0 flex flex-col border-r overflow-hidden ${mobileView === 'editor' ? 'hidden lg:flex' : 'flex'}`}
        style={{
          width: 280, minWidth: 240, maxWidth: 320,
          borderColor: 'rgba(255,255,255,0.06)',
          background: 'rgba(5,5,15,0.6)',
        }}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3 flex-shrink-0">
          <div>
            <h1 className="text-base font-bold" style={{ color: 'var(--melhek-text-primary)' }}>Notes</h1>
            <p className="text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={handleCreate}
            className="p-2 rounded-xl transition-all press-scale"
            style={{ background: 'linear-gradient(135deg,#0080FF,#00D4FF)', color: '#000' }}
            title="New note (⌘N)">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-3 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--melhek-text-tertiary)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="w-full pl-8 pr-3 py-2 rounded-lg text-xs focus:outline-none"
              style={{ background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--melhek-text-primary)' }} />
          </div>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="px-3 space-y-2 pt-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl shimmer" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 px-4 text-center" style={{ color: 'var(--melhek-text-tertiary)' }}>
              <FileText className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">{search ? 'No matching notes' : 'No notes yet'}</p>
              {!search && (
                <button onClick={handleCreate} className="text-xs mt-2" style={{ color: '#0080FF' }}>
                  Create your first note
                </button>
              )}
            </div>
          ) : (
            <>
              {pinned.length > 0 && (
                <>
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--melhek-text-tertiary)' }}>
                    <Pin className="w-3 h-3" /> Pinned
                  </p>
                  {pinned.map(note => <NoteRow key={note.id} note={note} selected={note.id === selectedId}
                    onSelect={() => { setSelectedId(note.id); setMobileView('editor') }}
                    onPin={() => togglePin(note.id)}
                    onDelete={() => handleDelete(note.id)} />)}
                </>
              )}
              {unpinned.length > 0 && (
                <>
                  {pinned.length > 0 && <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--melhek-text-tertiary)' }}>All Notes</p>}
                  {unpinned.map(note => <NoteRow key={note.id} note={note} selected={note.id === selectedId}
                    onSelect={() => { setSelectedId(note.id); setMobileView('editor') }}
                    onPin={() => togglePin(note.id)}
                    onDelete={() => handleDelete(note.id)} />)}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── Editor Panel ────────────────────────────────── */}
      <div className={`flex-1 flex flex-col overflow-hidden min-w-0 ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}`}>
        {!selectedNote ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ color: 'var(--melhek-text-tertiary)' }}>
            <FileText className="w-12 h-12 opacity-15" />
            <div className="text-center">
              <p className="text-base font-medium" style={{ color: 'var(--melhek-text-secondary)' }}>Select a note</p>
              <p className="text-sm mt-1">or press ⌘N to create a new one</p>
            </div>
            <button onClick={handleCreate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-black press-scale"
              style={{ background: 'linear-gradient(135deg,#0080FF,#00D4FF)' }}>
              <Plus className="w-4 h-4" /> New Note
            </button>
          </div>
        ) : (
          <>
            {/* Editor topbar */}
            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 gap-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,5,15,0.4)' }}>
              {/* Mobile back */}
              <button onClick={() => setMobileView('list')} className="lg:hidden p-1.5 rounded-lg"
                style={{ color: 'var(--melhek-text-tertiary)' }}>
                <X className="w-4 h-4" />
              </button>

              {/* Toolbar */}
              <div className="flex items-center gap-0.5 flex-1 overflow-x-auto">
                <TB onClick={() => insert('**', '**', 'bold')} title="Bold (⌘B)"><Bold className="w-3.5 h-3.5" /></TB>
                <TB onClick={() => insert('*', '*', 'italic')} title="Italic"><Italic className="w-3.5 h-3.5" /></TB>
                <TB onClick={() => insert('`', '`', 'code')} title="Inline code"><Code className="w-3.5 h-3.5" /></TB>
                <TB onClick={() => insert('\n- ')} title="List"><List className="w-3.5 h-3.5" /></TB>
                <TB onClick={() => insert('[', '](url)', 'link text')} title="Link"><LinkIcon className="w-3.5 h-3.5" /></TB>
                <TB onClick={() => insert('![', '](url)', 'alt')} title="Image"><Image className="w-3.5 h-3.5" /></TB>
                <div className="w-px h-4 mx-1 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <TB onClick={() => fileInputRef.current?.click()} title="Upload file">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                </TB>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {saving && <span className="text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>Saving…</span>}
                <button onClick={() => setPreview(v => !v)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all"
                  style={{
                    background: preview ? 'rgba(0,128,255,0.15)' : 'var(--melhek-bg-3)',
                    color: preview ? '#00D4FF' : 'var(--melhek-text-secondary)',
                    border: `1px solid ${preview ? 'rgba(0,128,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  {preview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{preview ? 'Edit' : 'Preview'}</span>
                </button>
                <button onClick={() => togglePin(selectedNote.id)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: selectedNote.is_pinned ? '#00D4FF' : 'var(--melhek-text-tertiary)' }}
                  title={selectedNote.is_pinned ? 'Unpin' : 'Pin'}>
                  {selectedNote.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                </button>
                <button onClick={() => handleDelete(selectedNote.id)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--melhek-text-tertiary)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ff6666')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--melhek-text-tertiary)')}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drop zone wrapper */}
            <div className="flex-1 flex flex-col overflow-hidden relative"
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}>

              {dragging && (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl"
                  style={{ background: 'rgba(0,128,255,0.12)', border: '2px dashed rgba(0,128,255,0.5)' }}>
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: '#00D4FF' }} />
                    <p className="text-sm font-medium" style={{ color: '#00D4FF' }}>Drop files to attach</p>
                  </div>
                </div>
              )}

              {/* Title */}
              <div className="px-6 pt-5 pb-2 flex-shrink-0">
                <input
                  value={title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Note title…"
                  className="w-full text-xl font-bold bg-transparent focus:outline-none"
                  style={{ color: 'var(--melhek-text-primary)' }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--melhek-text-tertiary)' }}>
                  {formatDateTime(selectedNote.updated_at)}
                </p>
              </div>

              {/* Meta row: project + tags */}
              <div className="px-6 pb-3 flex flex-wrap items-center gap-2 flex-shrink-0">
                {/* Project link */}
                <div className="flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--melhek-text-tertiary)' }} />
                  <select value={selectedNote.project_id ?? ''} onChange={e => handleProjectLink(e.target.value)}
                    className="text-xs focus:outline-none bg-transparent"
                    style={{ color: selectedNote.project_id ? 'var(--melhek-text-secondary)' : 'var(--melhek-text-tertiary)' }}>
                    <option value="">No project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
                  </select>
                </div>

                <div className="w-px h-3" style={{ background: 'rgba(255,255,255,0.1)' }} />

                {/* Tags */}
                <Tag className="w-3.5 h-3.5" style={{ color: 'var(--melhek-text-tertiary)' }} />
                {selectedNote.tags.map(tag => (
                  <TagPill key={tag} tag={tag} onRemove={() => removeTag(tag)} />
                ))}
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  placeholder="Add tag…"
                  className="text-xs bg-transparent focus:outline-none w-20"
                  style={{ color: 'var(--melhek-text-tertiary)' }}
                />
              </div>

              <div className="flex-shrink-0 mx-6" style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

              {/* Editor / Preview */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {preview ? (
                  <div
                    className="prose-melhek max-w-none text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(content) || '<span style="opacity:0.3">Nothing to preview…</span>' }}
                  />
                ) : (
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={e => handleContentChange(e.target.value)}
                    placeholder="Start writing… (Markdown supported)"
                    className="w-full h-full min-h-64 bg-transparent text-sm focus:outline-none resize-none leading-relaxed font-mono"
                    style={{ color: 'var(--melhek-text-primary)' }}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt"
        className="hidden" onChange={e => handleFiles(e.target.files)} />
    </div>
  )
}

// ─── Note List Row ───────────────────────────────────────────
function NoteRow({ note, selected, onSelect, onPin, onDelete }: {
  note: Note; selected: boolean
  onSelect: () => void; onPin: () => void; onDelete: () => void
}) {
  const preview = note.content.slice(0, 80).replace(/[#*`>\-]/g, '').trim()
  return (
    <div onClick={onSelect}
      className="group flex flex-col gap-1 px-3 py-2.5 mx-2 mb-1 rounded-xl cursor-pointer transition-all"
      style={{
        background: selected ? 'rgba(0,128,255,0.12)' : 'transparent',
        border: `1px solid ${selected ? 'rgba(0,128,255,0.25)' : 'transparent'}`,
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium truncate" style={{ color: 'var(--melhek-text-primary)' }}>
          {note.title || 'Untitled Note'}
        </span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0">
          <button onClick={e => { e.stopPropagation(); onPin() }}
            className="p-1 rounded" style={{ color: note.is_pinned ? '#00D4FF' : 'var(--melhek-text-tertiary)' }}>
            <Pin className="w-3 h-3" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete() }}
            className="p-1 rounded" style={{ color: 'var(--melhek-text-tertiary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ff6666')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--melhek-text-tertiary)')}>
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      {preview && (
        <p className="text-xs truncate" style={{ color: 'var(--melhek-text-tertiary)' }}>{preview}</p>
      )}
      {note.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {note.tags.slice(0, 3).map(t => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(0,128,255,0.1)', color: '#0080FF' }}>{t}</span>
          ))}
        </div>
      )}
    </div>
  )
}
