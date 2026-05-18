'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useUser } from '@/hooks/useUser'
import { useCalendar } from '@/hooks/useCalendar'
import { useTasks } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { getPriorityConfig } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Plus, X, Loader2, Calendar, Trash2 } from 'lucide-react'
import type { CalendarEvent, EventType } from '@/types'

// ─── Event type config ────────────────────────────────────────
const EVENT_CFG: Record<EventType, { label: string; color: string; bg: string }> = {
  meeting:  { label: 'Meeting',  color: '#0080FF', bg: 'rgba(0,128,255,0.15)' },
  reminder: { label: 'Reminder', color: '#00d084', bg: 'rgba(0,208,132,0.15)' },
  deadline: { label: 'Deadline', color: '#ff4444', bg: 'rgba(255,68,68,0.15)'  },
  block:    { label: 'Block',    color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

// ─── Helpers ─────────────────────────────────────────────────
function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function localKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function toLocalIso(date: Date, time: string) {
  return new Date(`${toDateKey(date)}T${time}:00`).toISOString()
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ─── Event Modal ──────────────────────────────────────────────
function EventModal({
  date, event, projects, onSave, onDelete, onClose
}: {
  date: Date
  event: CalendarEvent | null
  projects: { id: string; name: string; icon: string }[]
  onSave: (data: Record<string, unknown>) => void
  onDelete?: () => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(event?.title ?? '')
  const [type, setType] = useState<EventType>(event?.type ?? 'meeting')
  const [startTime, setStartTime] = useState(event ? fmtTime(event.start_at) : '09:00')
  const [endTime, setEndTime] = useState(event ? fmtTime(event.end_at) : '10:00')
  const [allDay, setAllDay] = useState(event?.all_day ?? false)
  const [description, setDescription] = useState(event?.description ?? '')
  const [projectId, setProjectId] = useState(event?.project_id ?? '')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    const start_at = allDay ? new Date(toDateKey(date) + 'T00:00:00').toISOString() : toLocalIso(date, startTime)
    const end_at   = allDay ? new Date(toDateKey(date) + 'T23:59:59').toISOString() : toLocalIso(date, endTime)
    await onSave({ title: title.trim(), type, start_at, end_at, all_day: allDay, description: description || null, project_id: projectId || null })
    setLoading(false)
    onClose()
  }

  const INPUT_STYLE = {
    className: 'w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none',
    style: { background: 'var(--melhek-bg-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--melhek-text-primary)' } as React.CSSProperties
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden depth-3"
        style={{ background: 'var(--melhek-bg-1)', border: '1px solid rgba(0,128,255,0.2)' }}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--melhek-text-primary)' }}>
            {event ? 'Edit Event' : 'New Event'} — {MONTHS[date.getMonth()]} {date.getDate()}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--melhek-text-tertiary)' }}><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={submit} className="px-5 py-4 space-y-3">
          <input required placeholder="Event title" value={title} onChange={e => setTitle(e.target.value)} autoFocus {...INPUT_STYLE} />

          {/* Type buttons */}
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(EVENT_CFG) as EventType[]).map(t => {
              const cfg = EVENT_CFG[t]
              return (
                <button type="button" key={t} onClick={() => setType(t)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: type === t ? cfg.bg : 'rgba(255,255,255,0.04)',
                    color: type === t ? cfg.color : 'var(--melhek-text-secondary)',
                    border: type === t ? `1px solid ${cfg.color}40` : '1px solid rgba(255,255,255,0.06)',
                  }}>{cfg.label}</button>
              )
            })}
          </div>

          {/* All-day toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div onClick={() => setAllDay(v => !v)}
              className="w-9 h-5 rounded-full transition-all flex-shrink-0 relative"
              style={{ background: allDay ? '#0080FF' : 'rgba(255,255,255,0.1)' }}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: allDay ? '18px' : '2px' }} />
            </div>
            <span className="text-xs" style={{ color: 'var(--melhek-text-secondary)' }}>All day</span>
          </label>

          {!allDay && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs mb-1 block" style={{ color: 'var(--melhek-text-tertiary)' }}>Start</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} {...INPUT_STYLE} style={{ ...INPUT_STYLE.style, colorScheme: 'dark' }} />
              </div>
              <div className="flex-1">
                <label className="text-xs mb-1 block" style={{ color: 'var(--melhek-text-tertiary)' }}>End</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} {...INPUT_STYLE} style={{ ...INPUT_STYLE.style, colorScheme: 'dark' }} />
              </div>
            </div>
          )}

          <select value={projectId} onChange={e => setProjectId(e.target.value)} {...INPUT_STYLE}>
            <option value="">No project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
          </select>

          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)" rows={2} {...INPUT_STYLE}
            className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none" />

          <div className="flex gap-3 pt-1">
            {event && onDelete && (
              <button type="button" onClick={onDelete}
                className="px-3 py-2.5 rounded-xl text-sm transition-all"
                style={{ background: 'rgba(255,68,68,0.1)', color: '#ff6666', border: '1px solid rgba(255,68,68,0.2)' }}>
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: 'var(--melhek-bg-3)', color: 'var(--melhek-text-secondary)' }}>Cancel</button>
            <button type="submit" disabled={!title.trim() || loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-black press-scale disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#0080FF,#00D4FF)' }}>
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {event ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Day Cell ─────────────────────────────────────────────────
const DayCell = React.memo(function DayCell({
  date, isCurrentMonth, isToday, events, tasksDue, selected, onClick
}: {
  date: Date; isCurrentMonth: boolean; isToday: boolean
  events: CalendarEvent[]; tasksDue: { id: string; title: string; priority: string }[]
  selected: boolean; onClick: () => void
}) {
  const total = events.length + tasksDue.length
  return (
    <div onClick={onClick}
      className="min-h-[80px] p-1.5 cursor-pointer transition-all rounded-lg"
      style={{
        background: selected ? 'rgba(0,128,255,0.12)' : isToday ? 'rgba(0,128,255,0.06)' : 'transparent',
        border: selected ? '1px solid rgba(0,128,255,0.4)' : isToday ? '1px solid rgba(0,128,255,0.2)' : '1px solid rgba(255,255,255,0.04)',
        opacity: isCurrentMonth ? 1 : 0.35,
      }}>
      <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'text-black' : ''}`}
        style={{
          background: isToday ? 'linear-gradient(135deg,#0080FF,#00D4FF)' : 'transparent',
          color: isToday ? '#000' : isCurrentMonth ? 'var(--melhek-text-primary)' : 'var(--melhek-text-tertiary)',
        }}>
        {date.getDate()}
      </div>
      <div className="space-y-0.5">
        {events.slice(0, 2).map(ev => {
          const cfg = EVENT_CFG[ev.type]
          return (
            <div key={ev.id} className="text-[10px] px-1.5 py-0.5 rounded truncate font-medium"
              style={{ background: cfg.bg, color: cfg.color }}>{ev.title}</div>
          )
        })}
        {tasksDue.slice(0, 2).map(t => {
          const p = getPriorityConfig(t.priority as 'low' | 'medium' | 'high' | 'urgent')
          return (
            <div key={t.id} className="text-[10px] px-1.5 py-0.5 rounded truncate flex items-center gap-1"
              style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--melhek-text-secondary)' }}>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.dot }} />
              {t.title}
            </div>
          )
        })}
        {total > 2 && (
          <div className="text-[10px] px-1.5" style={{ color: 'var(--melhek-text-tertiary)' }}>+{total - 2} more</div>
        )}
      </div>
    </div>
  )
})

// ─── Calendar Page ────────────────────────────────────────────
export default function CalendarPage() {
  const today = new Date()
  const { profile } = useUser()
  const { projects } = useProjects()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [modal, setModal] = useState<{ date: Date; event: CalendarEvent | null } | null>(null)

  const { events, loading, createEvent, updateEvent, deleteEvent } = useCalendar(year, month)
  const { tasks } = useTasks()

  // Tasks with due dates mapped by day key
  const tasksByDay = useMemo(() => {
    const map: Record<string, { id: string; title: string; priority: string }[]> = {}
    tasks.filter(t => t.due_date && t.status !== 'done').forEach(t => {
      const key = t.due_date!
      if (!map[key]) map[key] = []
      map[key].push({ id: t.id, title: t.title, priority: t.priority })
    })
    return map
  }, [tasks])

  // Events mapped by day key
  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    events.forEach(ev => {
      const key = localKey(ev.start_at)
      if (!map[key]) map[key] = []
      map[key].push(ev)
    })
    return map
  }, [events])

  // Build calendar grid (6 weeks)
  const grid = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const start = new Date(firstDay)
    start.setDate(start.getDate() - start.getDay())
    const days: Date[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      days.push(d)
    }
    return days
  }, [year, month])

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }

  const selectedEvents = selectedDate ? (eventsByDay[toDateKey(selectedDate)] ?? []) : []
  const selectedTasks  = selectedDate ? (tasksByDay[toDateKey(selectedDate)] ?? []) : []

  const handleSave = useCallback(async (data: Record<string, unknown>) => {
    if (!profile || !modal) return
    if (modal.event) await updateEvent(modal.event.id, data as Partial<CalendarEvent>)
    else await createEvent(profile.id, data as Parameters<typeof createEvent>[1])
  }, [profile, modal, createEvent, updateEvent])

  const handleDelete = useCallback(async () => {
    if (!modal?.event) return
    await deleteEvent(modal.event.id)
    setModal(null)
    setSelectedDate(null)
  }, [modal, deleteEvent])

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* Backdrop for mobile */}
      {selectedDate && (
        <div 
          className="fixed inset-0 z-20 bg-black/60 lg:hidden backdrop-blur-sm transition-all"
          onClick={() => setSelectedDate(null)}
        />
      )}

      {/* ─── Calendar Grid ──────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold" style={{ color: 'var(--melhek-text-primary)' }}>
              {MONTHS[month]} {year}
            </h1>
            {loading && <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#0080FF' }} />}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()) }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: 'rgba(0,128,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,128,255,0.2)' }}>
              Today
            </button>
            <button onClick={prevMonth} className="p-1.5 rounded-lg transition-colors"
              style={{ background: 'var(--melhek-bg-3)', color: 'var(--melhek-text-secondary)' }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={nextMonth} className="p-1.5 rounded-lg transition-colors"
              style={{ background: 'var(--melhek-bg-3)', color: 'var(--melhek-text-secondary)' }}>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setModal({ date: selectedDate ?? today, event: null })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-black press-scale"
              style={{ background: 'linear-gradient(135deg,#0080FF,#00D4FF)' }}>
              <Plus className="w-3.5 h-3.5" /> Event
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1 flex-shrink-0">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold py-1 uppercase tracking-wider"
              style={{ color: 'var(--melhek-text-tertiary)' }}>{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1 flex-1 overflow-y-auto">
          {grid.map((date, i) => {
            const key = toDateKey(date)
            const isCurrentMonth = date.getMonth() === month
            const isToday = key === toDateKey(today)
            const isSelected = selectedDate ? key === toDateKey(selectedDate) : false
            return (
              <DayCell key={i}
                date={date}
                isCurrentMonth={isCurrentMonth}
                isToday={isToday}
                selected={isSelected}
                events={eventsByDay[key] ?? []}
                tasksDue={tasksByDay[key] ?? []}
                onClick={() => setSelectedDate(isSelected ? null : new Date(date))}
              />
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 flex-shrink-0 flex-wrap">
          {(Object.entries(EVENT_CFG) as [EventType, typeof EVENT_CFG[EventType]][]).map(([t, cfg]) => (
            <div key={t} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: cfg.color }} />
              <span className="text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>{cfg.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.3)' }} />
            <span className="text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>Task due</span>
          </div>
        </div>
      </div>

      {/* ─── Day Detail Panel ───────────────────────────── */}
      {selectedDate && (
        <div className="absolute lg:relative right-0 inset-y-0 z-30 w-72 flex-shrink-0 flex flex-col overflow-hidden h-full lg:h-auto"
          style={{ 
            borderLeft: '1px solid rgba(255,255,255,0.08)', 
            background: 'rgba(5,5,15,0.95)', 
            backdropFilter: 'blur(20px)' 
          }}>
          <div className="px-4 py-4 flex items-center justify-between flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--melhek-text-tertiary)' }}>
                {DAYS[selectedDate.getDay()]}
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--melhek-text-primary)' }}>
                {selectedDate.getDate()}
              </p>
              <p className="text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>
                {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setModal({ date: selectedDate, event: null })}
                className="p-2 rounded-lg press-scale"
                style={{ background: 'linear-gradient(135deg,#0080FF,#00D4FF)', color: '#000' }}>
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setSelectedDate(null)}
                className="p-2 rounded-lg" style={{ color: 'var(--melhek-text-tertiary)' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {selectedEvents.length === 0 && selectedTasks.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center" style={{ color: 'var(--melhek-text-tertiary)' }}>
                <Calendar className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">Nothing scheduled</p>
                <button onClick={() => setModal({ date: selectedDate, event: null })}
                  className="text-xs mt-2" style={{ color: '#0080FF' }}>Add an event →</button>
              </div>
            ) : (
              <>
                {selectedEvents.map(ev => {
                  const cfg = EVENT_CFG[ev.type]
                  return (
                    <button key={ev.id} onClick={() => setModal({ date: selectedDate, event: ev })}
                      className="w-full text-left px-3 py-2.5 rounded-xl transition-all hover:brightness-110"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                        {!ev.all_day && (
                          <span className="text-xs" style={{ color: cfg.color }}>
                            {fmtTime(ev.start_at)}–{fmtTime(ev.end_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--melhek-text-primary)' }}>
                        {ev.title}
                      </p>
                      {ev.description && (
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--melhek-text-tertiary)' }}>
                          {ev.description}
                        </p>
                      )}
                    </button>
                  )
                })}

                {selectedTasks.length > 0 && (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wider pt-2 pb-1"
                      style={{ color: 'var(--melhek-text-tertiary)' }}>Tasks Due</p>
                    {selectedTasks.map(t => {
                      const p = getPriorityConfig(t.priority as 'low' | 'medium' | 'high' | 'urgent')
                      return (
                        <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.dot }} />
                          <span className="text-sm truncate" style={{ color: 'var(--melhek-text-primary)' }}>{t.title}</span>
                        </div>
                      )
                    })}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Event Modal */}
      {modal && (
        <EventModal
          date={modal.date}
          event={modal.event}
          projects={projects}
          onSave={handleSave}
          onDelete={modal.event ? handleDelete : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
