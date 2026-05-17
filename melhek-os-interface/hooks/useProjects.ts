'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calcProgress } from '@/lib/utils'
import { toast } from 'sonner'
import type { Project, ProjectWithProgress, ProjectStatus } from '@/types'

export function useProjects() {
  const [projects, setProjects] = useState<ProjectWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stable client — never recreated across renders
  const supabase = useRef(createClient()).current
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const fetchProjects = useCallback(async () => {
    if (!mounted.current) return
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('projects')
      .select(`
        *,
        owner:profiles!projects_owner_id_fkey(id, full_name, avatar_url),
        tasks(id, status)
      `)
      .neq('status', 'archived')
      .order('created_at', { ascending: false })

    if (!mounted.current) return

    if (fetchError) {
      setError(fetchError.message)
      toast.error('Failed to load projects')
    } else {
      const enriched = (data || []).map((p: Project) => ({
        ...p,
        progress: calcProgress(p.tasks ?? []),
        total_tasks: p.tasks?.length ?? 0,
        done_tasks: p.tasks?.filter(t => t.status === 'done').length ?? 0,
      })) as ProjectWithProgress[]
      setProjects(enriched)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Real-time: re-fetch when tasks or projects change remotely
  useEffect(() => {
    const channel = supabase
      .channel('projects-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        if (mounted.current) fetchProjects()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        if (mounted.current) fetchProjects()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, fetchProjects])

  // ─── Create ───────────────────────────────────────────────
  const createProject = useCallback(async (data: {
    name: string
    description?: string
    color?: string
    icon?: string
    target_date?: string | null
    owner_id: string
  }) => {
    const { data: newProject, error } = await supabase
      .from('projects')
      .insert({
        name: data.name,
        description: data.description ?? null,
        color: data.color ?? '#00d4ff',
        icon: data.icon ?? '📁',
        target_date: data.target_date ?? null,
        owner_id: data.owner_id,
        status: 'active',
      })
      .select(`
        *,
        owner:profiles!projects_owner_id_fkey(id, full_name, avatar_url),
        tasks(id, status)
      `)
      .single()

    if (error) {
      toast.error('Failed to create project')
      return null
    }

    const enriched: ProjectWithProgress = {
      ...(newProject as Project),
      progress: 0,
      total_tasks: 0,
      done_tasks: 0,
    }

    setProjects(prev => [enriched, ...prev])
    toast.success('Project created')
    return enriched
  }, [supabase])

  // ─── Update ───────────────────────────────────────────────
  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    const original = projects.find(p => p.id === id)
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))

    const { error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      if (original) setProjects(prev => prev.map(p => p.id === id ? original : p))
      toast.error('Failed to update project')
    }
  }, [projects, supabase])

  // ─── Delete ───────────────────────────────────────────────
  const deleteProject = useCallback(async (id: string) => {
    const original = projects.find(p => p.id === id)
    setProjects(prev => prev.filter(p => p.id !== id))

    const { error } = await supabase.from('projects').delete().eq('id', id)

    if (error) {
      if (original) setProjects(prev => [original, ...prev])
      toast.error('Failed to delete project')
    } else {
      toast.success('Project deleted')
    }
  }, [projects, supabase])

  const updateStatus = useCallback((id: string, status: ProjectStatus) => {
    return updateProject(id, { status })
  }, [updateProject])

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    updateStatus,
  }
}
