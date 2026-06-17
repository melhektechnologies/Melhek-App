'use client'

import { useMemo } from 'react'
import type { Opportunity, RevenueStats } from '@/types'

const SPRINT_START = new Date('2026-06-17T00:00:00')
const SPRINT_DAYS = 84
const REVENUE_GOAL = 300_000

export function useRevenue(opportunities: Opportunity[]) {
  const stats = useMemo((): RevenueStats => {
    const now = new Date()
    const sprintEnd = new Date(SPRINT_START)
    sprintEnd.setDate(sprintEnd.getDate() + SPRINT_DAYS)

    const daysElapsed = Math.max(0, Math.floor((now.getTime() - SPRINT_START.getTime()) / (1000 * 60 * 60 * 24)))
    const daysRemaining = Math.max(0, Math.ceil((sprintEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

    // Revenue closed = sum of Won opportunities
    const closed = opportunities
      .filter(o => o.stage === 'won')
      .reduce((sum, o) => sum + o.potential_revenue, 0)

    const remaining = Math.max(0, REVENUE_GOAL - closed)

    // Daily pace required to hit goal
    const dailyPaceRequired = daysRemaining > 0 ? remaining / daysRemaining : remaining

    // Current pace (closed / elapsed days)
    const currentDailyPace = daysElapsed > 0 ? closed / daysElapsed : 0

    // Weekly target
    const weeklyTarget = dailyPaceRequired * 7

    // Projected total at current pace
    const projectedTotal = closed + currentDailyPace * daysRemaining

    const progressPercent = Math.min(100, (closed / REVENUE_GOAL) * 100)

    // Status
    const paceDelta = currentDailyPace - dailyPaceRequired
    const status: RevenueStats['status'] =
      daysElapsed === 0 ? 'on_pace' :
      paceDelta >= 500 ? 'ahead' :
      paceDelta >= -500 ? 'on_pace' : 'behind'

    return {
      goal: REVENUE_GOAL,
      closed,
      remaining,
      daysRemaining,
      daysElapsed,
      weeklyTarget,
      dailyPaceRequired,
      currentDailyPace,
      projectedTotal,
      progressPercent,
      status,
    }
  }, [opportunities])

  // Expected revenue in pipeline (active stages only)
  const pipelineValue = useMemo(() =>
    opportunities
      .filter(o => !['won', 'lost'].includes(o.stage))
      .reduce((sum, o) => sum + (o.expected_revenue ?? 0), 0),
    [opportunities]
  )

  // Top opportunities by expected revenue
  const topOpportunities = useMemo(() =>
    [...opportunities]
      .filter(o => !['won', 'lost'].includes(o.stage))
      .sort((a, b) => (b.expected_revenue ?? 0) - (a.expected_revenue ?? 0))
      .slice(0, 5),
    [opportunities]
  )

  // Deals at risk = active deals with no contact in 7+ days
  const dealsAtRisk = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)
    return opportunities.filter(o => {
      if (['won', 'lost'].includes(o.stage)) return false
      if (!o.last_contact_date) return true
      return new Date(o.last_contact_date) < cutoff
    })
  }, [opportunities])

  // Follow-ups needed
  const followUpsToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return opportunities.filter(o =>
      !['won', 'lost'].includes(o.stage) && o.next_action_date === today
    )
  }, [opportunities])

  const followUpsOverdue = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return opportunities.filter(o =>
      !['won', 'lost'].includes(o.stage) &&
      o.next_action_date != null &&
      o.next_action_date < today
    )
  }, [opportunities])

  const followUpsThisWeek = useMemo(() => {
    const today = new Date()
    const weekEnd = new Date(today)
    weekEnd.setDate(weekEnd.getDate() + 7)
    const todayStr = today.toISOString().split('T')[0]
    const weekEndStr = weekEnd.toISOString().split('T')[0]
    return opportunities.filter(o =>
      !['won', 'lost'].includes(o.stage) &&
      o.next_action_date != null &&
      o.next_action_date > todayStr &&
      o.next_action_date <= weekEndStr
    )
  }, [opportunities])

  return {
    stats,
    pipelineValue,
    topOpportunities,
    dealsAtRisk,
    followUpsToday,
    followUpsOverdue,
    followUpsThisWeek,
    sprintStart: SPRINT_START,
    sprintDays: SPRINT_DAYS,
    goal: REVENUE_GOAL,
  }
}

// Format ETB currency
export function formatETB(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M ETB`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K ETB`
  return `${amount.toLocaleString()} ETB`
}

// Days no contact label
export function noContactLabel(lastContactDate: string | null): string {
  if (!lastContactDate) return 'No contact'
  const days = Math.floor((Date.now() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}
