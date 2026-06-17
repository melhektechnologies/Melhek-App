'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Note } from '@/types'

const NOTE_SELECT = `
  *,
  project:projects!notes_project_id_fkey(id, name, color, icon),
  note_links(opportunity_id)
`

export function useNotes(projectId?: string) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useRef(createClient()).current
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  // ─── Fetch ─────────────────────────────────────────────────
  const fetchNotes = useCallback(async () => {
    if (!mounted.current) return
    setLoading(true)

    let q = supabase
      .from('notes')
      .select(NOTE_SELECT)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false })

    if (projectId) q = q.eq('project_id', projectId)

    const { data, error: err } = await q
    if (!mounted.current) return
    if (err) { setError(err.message); toast.error('Failed to load notes') }
    else setNotes((data as Note[]) ?? [])
    setLoading(false)
  }, [supabase, projectId])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('notes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => {
        if (mounted.current) fetchNotes()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, fetchNotes])

  // ─── Create ────────────────────────────────────────────────
  const createNote = useCallback(async (userId: string, overrides: Partial<Note> = {}): Promise<Note | null> => {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        title: 'Untitled Note',
        content: '',
        tags: [],
        is_pinned: false,
        project_id: projectId ?? null,
        ...overrides,
      })
      .select(NOTE_SELECT)
      .single()

    if (error) { toast.error('Failed to create note'); return null }
    const note = data as Note
    setNotes(prev => [note, ...prev])
    return note
  }, [supabase, projectId])

  // ─── Update (used for autosave + manual changes) ───────────
  const updateNote = useCallback(async (id: string, updates: Partial<Note>): Promise<void> => {
    // Optimistic
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n))

    const { error } = await supabase
      .from('notes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error && mounted.current) {
      toast.error('Failed to save note')
    }
  }, [supabase])

  // ─── Delete ────────────────────────────────────────────────
  const deleteNote = useCallback(async (id: string): Promise<void> => {
    const original = notes.find(n => n.id === id)
    setNotes(prev => prev.filter(n => n.id !== id))
    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (error) {
      if (original) setNotes(prev => [original, ...prev])
      toast.error('Failed to delete note')
    } else {
      toast.success('Note deleted')
    }
  }, [notes, supabase])

  // ─── Toggle pin ────────────────────────────────────────────
  const togglePin = useCallback((id: string) => {
    const note = notes.find(n => n.id === id)
    if (!note) return
    return updateNote(id, { is_pinned: !note.is_pinned })
  }, [notes, updateNote])

  // ─── Link Opportunity ──────────────────────────────────────
  const linkOpportunity = useCallback(async (noteId: string, opportunityId: string | null): Promise<void> => {
    // Delete existing links
    await supabase.from('note_links').delete().eq('note_id', noteId)

    if (opportunityId) {
      const { error } = await supabase.from('note_links').insert({
        note_id: noteId,
        opportunity_id: opportunityId,
      })
      if (error) {
        toast.error('Failed to link opportunity')
        return
      }
    }

    toast.success('Note link updated')
    fetchNotes()
  }, [supabase, fetchNotes])

  // ─── Upload attachment to Supabase Storage ─────────────────
  const uploadAttachment = useCallback(async (noteId: string, file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop()
    const path = `${noteId}/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('note-attachments')
      .upload(path, file, { upsert: false })

    if (error) { toast.error('Upload failed: ' + error.message); return null }

    const { data } = supabase.storage
      .from('note-attachments')
      .getPublicUrl(path)

    // For private buckets use signed URL
    if (!data.publicUrl) {
      const { data: signed } = await supabase.storage
        .from('note-attachments')
        .createSignedUrl(path, 60 * 60) // 1 hour

      return signed?.signedUrl ?? null
    }

    return data.publicUrl
  }, [supabase])

  // ─── Search (FTS via Supabase textSearch) ─────────────────
  const searchNotes = useCallback(async (query: string): Promise<Note[]> => {
    if (!query.trim()) return notes

    const { data, error } = await supabase
      .from('notes')
      .select(NOTE_SELECT)
      .textSearch('content', query, { type: 'websearch', config: 'english' })
      .order('updated_at', { ascending: false })

    if (error) return notes
    return (data as Note[]) ?? []
  }, [supabase, notes])

  return {
    notes,
    loading,
    error,
    refetch: fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    linkOpportunity,
    uploadAttachment,
    searchNotes,
  }
}
