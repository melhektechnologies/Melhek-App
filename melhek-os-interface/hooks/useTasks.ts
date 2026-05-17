'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Task, TaskStatus, TaskPriority } from '@/types'

// ─── Types ───────────────────────────────────────────────────
export interface UseTasksOptions {
  projectId?: string
  myTasksOnly?: boolean
  userId?: string
}

export interface CreateTaskInput {
  title: string
  description?: string | null
  priority?: TaskPriority
  project_id?: string | null
  assignee_id?: string | null
  due_date?: string | null
  created_by: string
}

// Full task select fragment — used consistently everywhere
const TASK_SELECT = `
  *,
  assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url),
  project:projects!tasks_project_id_fkey(id, name, color, icon)
`

export function useTasks(options: UseTasksOptions = {}) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Stable client reference — never recreated
  const supabase = useRef(createClient()).current
  
  // Track mounted state to prevent state updates after unmount
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  // ─── Fetch ────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    if (!mounted.current) return
    setLoading(true)
    setError(null)

    let query = supabase
      .from('tasks')
      .select(TASK_SELECT)
      .order('created_at', { ascending: false })

    if (options.projectId) {
      query = query.eq('project_id', options.projectId)
    }

    if (options.myTasksOnly && options.userId) {
      query = query.or(`assignee_id.eq.${options.userId},created_by.eq.${options.userId}`)
    }

    const { data, error: fetchError } = await query

    if (!mounted.current) return

    if (fetchError) {
      setError(fetchError.message)
      toast.error('Failed to load tasks')
    } else {
      setTasks((data as Task[]) ?? [])
    }
    setLoading(false)
  }, [options.projectId, options.myTasksOnly, options.userId, supabase])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // ─── Real-time subscription ───────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          // Refetch on any remote change to stay in sync
          if (mounted.current) fetchTasks()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, fetchTasks])

  // ─── Create ───────────────────────────────────────────────
  const createTask = useCallback(async (input: CreateTaskInput): Promise<Task | null> => {
    // Optimistic insert with temp ID
    const tempId = `temp-${Date.now()}`
    const optimistic: Task = {
      id: tempId,
      title: input.title,
      description: input.description ?? null,
      status: 'todo',
      priority: input.priority ?? 'medium',
      project_id: input.project_id ?? null,
      assignee_id: input.assignee_id ?? null,
      created_by: input.created_by,
      due_date: input.due_date ?? null,
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setTasks(prev => [optimistic, ...prev])

    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert({
        title: input.title,
        description: input.description ?? null,
        status: 'todo',
        priority: input.priority ?? 'medium',
        project_id: input.project_id ?? null,
        assignee_id: input.assignee_id ?? null,
        due_date: input.due_date ?? null,
        created_by: input.created_by,
      })
      .select(TASK_SELECT)
      .single()

    if (!mounted.current) return null

    if (error) {
      setTasks(prev => prev.filter(t => t.id !== tempId))
      toast.error('Failed to create task')
      return null
    }

    setTasks(prev => prev.map(t => t.id === tempId ? (newTask as Task) : t))
    toast.success('Task created')
    return newTask as Task
  }, [supabase])

  // ─── Update ───────────────────────────────────────────────
  const updateTask = useCallback(async (id: string, updates: Partial<Task>): Promise<void> => {
    const original = tasks.find(t => t.id === id)

    // Immediate optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))

    const { error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (!mounted.current) return

    if (error) {
      // Revert on failure
      if (original) setTasks(prev => prev.map(t => t.id === id ? original : t))
      toast.error('Failed to update task')
    }
  }, [tasks, supabase])

  // ─── Delete ───────────────────────────────────────────────
  const deleteTask = useCallback(async (id: string): Promise<void> => {
    const original = tasks.find(t => t.id === id)
    setTasks(prev => prev.filter(t => t.id !== id))

    const { error } = await supabase.from('tasks').delete().eq('id', id)

    if (!mounted.current) return

    if (error) {
      if (original) setTasks(prev => [original, ...prev])
      toast.error('Failed to delete task')
    } else {
      toast.success('Task deleted')
    }
  }, [tasks, supabase])

  // ─── Status shortcut ──────────────────────────────────────
  const toggleComplete = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const next: TaskStatus = task.status === 'done' ? 'todo' : 'done'
    return updateTask(id, { status: next })
  }, [tasks, updateTask])

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
  }
}
