'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Task, TaskStatus, TaskPriority } from '@/types'

interface UseTasksOptions {
  projectId?: string
  myTasksOnly?: boolean
  userId?: string
}

export function useTasks(options: UseTasksOptions = {}) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url),
        project:projects!tasks_project_id_fkey(id, name, color)
      `)
      .neq('status', 'cancelled')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (options.projectId) {
      query = query.eq('project_id', options.projectId)
    }

    if (options.myTasksOnly && options.userId) {
      query = query.eq('assignee_id', options.userId)
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
      toast.error('Failed to load tasks')
    } else {
      setTasks(data as Task[])
    }
    setLoading(false)
  }, [options.projectId, options.myTasksOnly, options.userId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // ─── Create ───────────────────────────────────────────────
  const createTask = useCallback(async (data: {
    title: string
    description?: string
    priority?: TaskPriority
    project_id?: string | null
    assignee_id?: string | null
    due_date?: string | null
    created_by: string
  }) => {
    const tempId = `temp-${Date.now()}`
    const optimisticTask: Task = {
      id: tempId,
      title: data.title,
      description: data.description ?? null,
      status: 'todo',
      priority: data.priority ?? 'medium',
      project_id: data.project_id ?? null,
      assignee_id: data.assignee_id ?? null,
      created_by: data.created_by,
      due_date: data.due_date ?? null,
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setTasks(prev => [optimisticTask, ...prev])

    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert({ ...data, status: 'todo', priority: data.priority ?? 'medium' })
      .select(`
        *,
        assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url),
        project:projects!tasks_project_id_fkey(id, name, color)
      `)
      .single()

    if (error) {
      setTasks(prev => prev.filter(t => t.id !== tempId))
      toast.error('Failed to create task')
    } else {
      setTasks(prev => prev.map(t => t.id === tempId ? newTask as Task : t))
      toast.success('Task created')
    }

    return newTask
  }, [supabase])

  // ─── Update ───────────────────────────────────────────────
  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const original = tasks.find(t => t.id === id)
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))

    const { error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      // Revert
      if (original) setTasks(prev => prev.map(t => t.id === id ? original : t))
      toast.error('Failed to update task')
    }
  }, [tasks, supabase])

  // ─── Delete ───────────────────────────────────────────────
  const deleteTask = useCallback(async (id: string) => {
    const original = tasks.find(t => t.id === id)
    setTasks(prev => prev.filter(t => t.id !== id))

    const { error } = await supabase.from('tasks').delete().eq('id', id)

    if (error) {
      if (original) setTasks(prev => [original, ...prev])
      toast.error('Failed to delete task')
    } else {
      toast.success('Task deleted')
    }
  }, [tasks, supabase])

  // ─── Status shortcut ─────────────────────────────────────
  const updateStatus = useCallback((id: string, status: TaskStatus) => {
    return updateTask(id, { status })
  }, [updateTask])

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    updateStatus,
  }
}
