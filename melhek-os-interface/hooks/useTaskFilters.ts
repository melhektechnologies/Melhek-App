'use client'

import { useMemo, useState, useCallback } from 'react'
import type { Task, TaskStatus, TaskPriority } from '@/types'

export interface TaskFilters {
  search: string
  status: TaskStatus | 'all'
  priority: TaskPriority | 'all'
  projectId: string | 'all'
  myTasksOnly: boolean
  dueDateRange: 'all' | 'overdue' | 'today' | 'this_week'
}

const DEFAULT_FILTERS: TaskFilters = {
  search: '',
  status: 'all',
  priority: 'all',
  projectId: 'all',
  myTasksOnly: false,
  dueDateRange: 'all',
}

function isOverdue(date: string | null): boolean {
  if (!date) return false
  return new Date(date) < new Date(new Date().toDateString())
}

function isDueToday(date: string | null): boolean {
  if (!date) return false
  return new Date(date).toDateString() === new Date().toDateString()
}

function isDueThisWeek(date: string | null): boolean {
  if (!date) return false
  const d = new Date(date)
  const now = new Date()
  const weekFromNow = new Date()
  weekFromNow.setDate(now.getDate() + 7)
  return d >= now && d <= weekFromNow
}

export function useTaskFilters(tasks: Task[], userId?: string) {
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS)

  const setFilter = useCallback(<K extends keyof TaskFilters>(
    key: K,
    value: TaskFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase().trim()

    return tasks.filter(task => {
      // Text search across title + description
      if (q) {
        const haystack = `${task.title} ${task.description ?? ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }

      // Status filter
      if (filters.status !== 'all' && task.status !== filters.status) return false

      // Priority filter
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false

      // Project filter
      if (filters.projectId !== 'all' && task.project_id !== filters.projectId) return false

      // My tasks: assigned to me OR created by me
      if (filters.myTasksOnly && userId) {
        if (task.assignee_id !== userId && task.created_by !== userId) return false
      }

      // Due date range filter
      if (filters.dueDateRange === 'overdue' && !isOverdue(task.due_date)) return false
      if (filters.dueDateRange === 'today' && !isDueToday(task.due_date)) return false
      if (filters.dueDateRange === 'this_week' && !isDueThisWeek(task.due_date)) return false

      return true
    })
  }, [tasks, filters, userId])

  const counts = useMemo(() => ({
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => isOverdue(t.due_date) && t.status !== 'done').length,
  }), [tasks])

  const hasActiveFilters = useMemo(() =>
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.projectId !== 'all' ||
    filters.myTasksOnly ||
    filters.dueDateRange !== 'all',
  [filters])

  return {
    filters,
    setFilter,
    resetFilters,
    filtered,
    counts,
    hasActiveFilters,
  }
}
