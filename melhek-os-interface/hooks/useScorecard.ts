'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { DailyScorecard } from '@/types'

export type ScorecardField = 'calls_made' | 'followups_sent' | 'meetings_booked' | 'proposals_sent' | 'deals_closed' | 'revenue_generated'

const TODAY = new Date().toISOString().split('T')[0]

export function useScorecard() {
  const [today, setToday] = useState<DailyScorecard | null>(null)
  const [history, setHistory] = useState<DailyScorecard[]>([])
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const supabase = useRef(createClient()).current
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const fetchScorecard = useCallback(async () => {
    if (!mounted.current) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Fetch today + last 30 days for streak/weekly
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0]

    const { data, error: err } = await supabase
      .from('daily_scorecards')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', fromDate)
      .order('date', { ascending: false })

    if (!mounted.current) return
    if (err) { setLoading(false); return }

    const records = (data ?? []) as DailyScorecard[]
    setHistory(records)

    // Today's record
    const todayRecord = records.find(r => r.date === TODAY)
    if (todayRecord) {
      setToday(todayRecord)
    } else {
      // Auto-create today's scorecard
      const { data: newRecord } = await supabase
        .from('daily_scorecards')
        .insert({ user_id: user.id, date: TODAY })
        .select('*')
        .single()
      if (!mounted.current) return
      if (newRecord) {
        setToday(newRecord as DailyScorecard)
        setHistory(prev => [newRecord as DailyScorecard, ...prev])
      }
    }

    // Calculate streak (consecutive days with any activity)
    let currentStreak = 0
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date))
    const checkDate = new Date()
    for (const record of sorted) {
      const recordDate = new Date(record.date + 'T00:00:00')
      const diffDays = Math.round((checkDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24))
      const hasActivity = record.calls_made + record.followups_sent + record.meetings_booked + record.proposals_sent > 0
      if (diffDays <= 1 && hasActivity) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else break
    }
    setStreak(currentStreak)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchScorecard() }, [fetchScorecard])

  // Update a counter directly
  const updateField = useCallback(async (field: ScorecardField, value: number) => {
    if (!today) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const newValue = Math.max(0, value)
    const optimisticRecord = { ...today, [field]: newValue }
    setToday(optimisticRecord)
    setHistory(prev => prev.map(r => r.id === today.id ? optimisticRecord : r))

    const { error: err } = await supabase
      .from('daily_scorecards')
      .update({ [field]: newValue, updated_at: new Date().toISOString() })
      .eq('id', today.id)

    if (!mounted.current) return
    if (err) {
      setToday(today)
      setHistory(prev => prev.map(r => r.id === today.id ? today : r))
      toast.error('Failed to update scorecard')
    }
  }, [today, supabase])

  // Increment a counter
  const increment = useCallback(async (field: ScorecardField, amount: number = 1) => {
    if (!today) return
    const current = today[field] as number
    return updateField(field, current + amount)
  }, [today, updateField])

  // Decrement (min 0)
  const decrement = useCallback(async (field: ScorecardField) => {
    if (!today) return
    const current = today[field] as number
    if (current <= 0) return
    return updateField(field, current - 1)
  }, [today, updateField])

  // Save reflection
  const saveReflection = useCallback(async (text: string) => {
    if (!today) return
    const optimistic = { ...today, reflection: text }
    setToday(optimistic)

    const { error: err } = await supabase
      .from('daily_scorecards')
      .update({ reflection: text, updated_at: new Date().toISOString() })
      .eq('id', today.id)

    if (!mounted.current) return
    if (err) { setToday(today); toast.error('Failed to save reflection') }
  }, [today, supabase])

  // Weekly totals from history
  const weeklyTotals = {
    calls: history.filter(r => isThisWeek(r.date)).reduce((s, r) => s + r.calls_made, 0),
    followups: history.filter(r => isThisWeek(r.date)).reduce((s, r) => s + r.followups_sent, 0),
    meetings: history.filter(r => isThisWeek(r.date)).reduce((s, r) => s + r.meetings_booked, 0),
    proposals: history.filter(r => isThisWeek(r.date)).reduce((s, r) => s + r.proposals_sent, 0),
    revenue: history.filter(r => isThisWeek(r.date)).reduce((s, r) => s + r.revenue_generated, 0),
  }

  // Daily completion % (out of 6 key metrics, target 3 each)
  const dailyCompletion = today
    ? Math.min(100, Math.round(
        ((today.calls_made > 0 ? 1 : 0) +
         (today.followups_sent > 0 ? 1 : 0) +
         (today.meetings_booked > 0 ? 1 : 0) +
         (today.proposals_sent > 0 ? 1 : 0) +
         (today.deals_closed > 0 ? 1 : 0) +
         (today.revenue_generated > 0 ? 1 : 0)) / 6 * 100
      ))
    : 0

  return { today, history, loading, streak, weeklyTotals, dailyCompletion, increment, decrement, updateField, saveReflection, refetch: fetchScorecard }
}

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  return d >= weekStart
}
