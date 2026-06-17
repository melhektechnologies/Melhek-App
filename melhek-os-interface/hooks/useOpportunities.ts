'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Opportunity, OpportunityStage } from '@/types'

export interface CreateOpportunityInput {
  company_name: string
  contact_name?: string | null
  phone?: string | null
  industry?: string | null
  potential_revenue: number
  probability?: number
  stage?: OpportunityStage
  last_contact_date?: string | null
  next_action?: string | null
  next_action_date?: string | null
  notes?: string | null
  proposal_link?: string | null
  project_id?: string | null
}

const OPP_SELECT = `*`

function computeExpected(opp: Opportunity): Opportunity {
  return { ...opp, expected_revenue: (opp.potential_revenue * opp.probability) / 100 }
}

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useRef(createClient()).current
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const fetchOpportunities = useCallback(async () => {
    if (!mounted.current) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data, error: err } = await supabase
      .from('opportunities')
      .select(OPP_SELECT)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (!mounted.current) return
    if (err) { setError(err.message); toast.error('Failed to load pipeline') }
    else setOpportunities((data ?? []).map(computeExpected))
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchOpportunities() }, [fetchOpportunities])

  // Real-time
  useEffect(() => {
    const channel = supabase
      .channel('opportunities-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'opportunities' },
        () => { if (mounted.current) fetchOpportunities() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, fetchOpportunities])

  // ─── Create ───────────────────────────────────────────────
  const createOpportunity = useCallback(async (input: CreateOpportunityInput): Promise<Opportunity | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const payload = {
      user_id: user.id,
      company_name: input.company_name,
      contact_name: input.contact_name ?? null,
      phone: input.phone ?? null,
      industry: input.industry ?? null,
      potential_revenue: input.potential_revenue,
      probability: input.probability ?? 50,
      stage: input.stage ?? 'lead',
      last_contact_date: input.last_contact_date ?? null,
      next_action: input.next_action ?? null,
      next_action_date: input.next_action_date ?? null,
      notes: input.notes ?? null,
      proposal_link: input.proposal_link ?? null,
      project_id: input.project_id ?? null,
    }

    const { data, error: err } = await supabase
      .from('opportunities')
      .insert(payload)
      .select(OPP_SELECT)
      .single()

    if (!mounted.current) return null
    if (err) { toast.error('Failed to create opportunity'); return null }
    const opp = computeExpected(data as Opportunity)
    setOpportunities(prev => [opp, ...prev])
    toast.success('Opportunity added to pipeline')
    return opp
  }, [supabase])

  // ─── Update ───────────────────────────────────────────────
  const updateOpportunity = useCallback(async (id: string, updates: Partial<Opportunity>): Promise<void> => {
    const original = opportunities.find(o => o.id === id)
    setOpportunities(prev => prev.map(o => o.id === id ? computeExpected({ ...o, ...updates }) : o))

    const { error: err } = await supabase
      .from('opportunities')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (!mounted.current) return
    if (err) {
      if (original) setOpportunities(prev => prev.map(o => o.id === id ? original : o))
      toast.error('Failed to update opportunity')
    }
  }, [opportunities, supabase])

  // ─── Delete ───────────────────────────────────────────────
  const deleteOpportunity = useCallback(async (id: string): Promise<void> => {
    const original = opportunities.find(o => o.id === id)
    setOpportunities(prev => prev.filter(o => o.id !== id))
    const { error: err } = await supabase.from('opportunities').delete().eq('id', id)
    if (!mounted.current) return
    if (err) {
      if (original) setOpportunities(prev => [original, ...prev])
      toast.error('Failed to delete opportunity')
    } else {
      toast.success('Opportunity removed')
    }
  }, [opportunities, supabase])

  // ─── Move stage ───────────────────────────────────────────
  const moveStage = useCallback((id: string, stage: OpportunityStage) => {
    return updateOpportunity(id, { stage })
  }, [updateOpportunity])

  return { opportunities, loading, error, refetch: fetchOpportunities, createOpportunity, updateOpportunity, deleteOpportunity, moveStage }
}
