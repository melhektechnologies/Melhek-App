'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { CalendarEvent, EventType } from '@/types'

const EVENT_SELECT = `
  *,
  project:projects!calendar_events_project_id_fkey(id, name, color, icon)
`

export function useCalendar(year: number, month: number) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = useRef(createClient()).current
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  // Month boundaries in UTC
  const { start, end } = useMemo(() => {
    const s = new Date(year, month, 1)
    const e = new Date(year, month + 1, 0, 23, 59, 59)
    return { start: s.toISOString(), end: e.toISOString() }
  }, [year, month])

  // ─── Fetch events for the current month ────────────────────
  const fetchEvents = useCallback(async () => {
    if (!mounted.current) return
    setLoading(true)
    const { data, error } = await supabase
      .from('calendar_events')
      .select(EVENT_SELECT)
      .gte('start_at', start)
      .lte('start_at', end)
      .order('start_at', { ascending: true })

    if (!mounted.current) return
    if (error) toast.error('Failed to load calendar events')
    else setEvents((data as CalendarEvent[]) ?? [])
    setLoading(false)
  }, [supabase, start, end])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('calendar-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, () => {
        if (mounted.current) fetchEvents()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, fetchEvents])

  // ─── Create ────────────────────────────────────────────────
  const createEvent = useCallback(async (
    userId: string,
    data: {
      title: string
      type: EventType
      start_at: string
      end_at: string
      all_day?: boolean
      description?: string
      color?: string
      project_id?: string | null
    }
  ): Promise<CalendarEvent | null> => {
    const { data: ev, error } = await supabase
      .from('calendar_events')
      .insert({ user_id: userId, ...data })
      .select(EVENT_SELECT)
      .single()

    if (error) { toast.error('Failed to create event'); return null }
    const event = ev as CalendarEvent
    setEvents(prev => [...prev, event].sort((a, b) =>
      new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    ))
    toast.success('Event created')
    return event
  }, [supabase])

  // ─── Update ────────────────────────────────────────────────
  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
    const { error } = await supabase
      .from('calendar_events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error && mounted.current) {
      toast.error('Failed to update event')
      fetchEvents() // revert
    }
  }, [supabase, fetchEvents])

  // ─── Delete ────────────────────────────────────────────────
  const deleteEvent = useCallback(async (id: string) => {
    const original = events.find(e => e.id === id)
    setEvents(prev => prev.filter(e => e.id !== id))
    const { error } = await supabase.from('calendar_events').delete().eq('id', id)
    if (error) {
      if (original) setEvents(prev => [...prev, original])
      toast.error('Failed to delete event')
    } else {
      toast.success('Event deleted')
    }
  }, [events, supabase])

  return { events, loading, refetch: fetchEvents, createEvent, updateEvent, deleteEvent }
}
