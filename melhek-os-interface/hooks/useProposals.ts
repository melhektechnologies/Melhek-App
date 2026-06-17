'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { ProposalTemplate } from '@/types'

// Default templates seeded on first load if empty
const DEFAULT_TEMPLATES: Omit<ProposalTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  {
    title: 'Website Proposal',
    category: 'web',
    content: `# Website Development Proposal

**Client:** [Company Name]
**Date:** [Date]
**Prepared by:** Melhek Technologies

---

## Project Overview

We propose to design and develop a professional, mobile-first website for [Company Name] that drives conversions and establishes a strong online presence.

## Scope of Work

- Custom design (responsive, mobile-first)
- Up to 5 pages (Home, About, Services, Portfolio, Contact)
- Contact form with email integration
- SEO optimization
- Google Analytics setup
- 1 month post-launch support

## Investment

| Package | Price |
|---------|-------|
| Starter | 15,000 ETB |
| Professional | 25,000 ETB |
| Premium | 40,000 ETB |

## Timeline

- Design Phase: 5 days
- Development: 10 days
- Testing & Launch: 3 days
- **Total: 18 days**

## Next Steps

1. Sign agreement
2. 50% deposit to begin
3. Kickoff meeting within 48 hours

---
*Melhek Technologies | melhek.com*`,
    tags: ['website', 'development', 'web'],
    is_default: true,
  },
  {
    title: 'Hotel Tech Proposal',
    category: 'hotel',
    content: `# Hotel Technology Solution Proposal

**Client:** [Hotel Name]
**Date:** [Date]
**Prepared by:** Melhek Technologies

---

## Executive Summary

We propose a comprehensive digital transformation for [Hotel Name] — covering booking system, digital menus, and guest experience automation.

## Proposed Solutions

### 1. Online Booking System
- Direct booking widget for your website
- Reduce OTA commission dependency
- Real-time availability calendar
- Automated confirmation emails

### 2. Digital Menu System
- QR code-based menu for restaurant & room service
- Update items without reprinting
- Multi-language support

### 3. Guest Communication Automation
- WhatsApp check-in reminders
- Post-stay review requests
- Loyalty program integration

## Investment

| Solution | Monthly | One-Time Setup |
|----------|---------|---------------|
| Booking System | 3,000 ETB | 20,000 ETB |
| Digital Menu | 500 ETB | 5,000 ETB |
| Full Package | 3,000 ETB | 22,000 ETB |

## ROI Projection

Eliminating 15% OTA commission on just 50 bookings/month = **savings of 15,000–45,000 ETB/month**.

---
*Melhek Technologies | melhek.com*`,
    tags: ['hotel', 'tech', 'hospitality'],
    is_default: true,
  },
  {
    title: 'Digital Menu Proposal',
    category: 'menu',
    content: `# Digital Menu System Proposal

**Client:** [Restaurant/Hotel Name]
**Date:** [Date]
**Prepared by:** Melhek Technologies

---

## Why Digital Menu?

- No more expensive reprinting when prices change
- Customers scan QR code → instant access
- Add photos, descriptions, allergen info
- Update in real-time from any device

## Features

- ✅ QR code generation (custom branded)
- ✅ Unlimited menu items & categories
- ✅ Item photos & descriptions
- ✅ Multi-language (Amharic & English)
- ✅ Special offers & daily specials
- ✅ Analytics: most viewed items

## Pricing

| Plan | Price |
|------|-------|
| Setup | 5,000 ETB (one-time) |
| Monthly | 500 ETB/month |

## What You Get

- Custom-branded menu page
- Unlimited QR codes
- Staff training (30 min)
- Free updates for 1 month

---
*Melhek Technologies | melhek.com*`,
    tags: ['menu', 'qr', 'restaurant'],
    is_default: true,
  },
  {
    title: 'Automation Proposal',
    category: 'automation',
    content: `# Business Automation Proposal

**Client:** [Company Name]
**Date:** [Date]
**Prepared by:** Melhek Technologies

---

## Problem Statement

Your team is spending hours on manual tasks that should be automated. We can free up that time.

## Automation Solutions

### WhatsApp Business Automation
- Auto-reply to common questions
- Order confirmations
- Appointment reminders
- Lead capture → CRM

### Workflow Automation
- Invoice generation
- Email follow-up sequences
- Staff scheduling notifications
- Report generation

### Integration Services
- Connect existing tools (accounting, CRM, calendar)
- Data sync between platforms
- Custom API integrations

## Investment

Starting from **8,000 ETB** setup + **1,500 ETB/month** maintenance.

## Expected Outcome

Save 20+ hours/week in manual work.

---
*Melhek Technologies | melhek.com*`,
    tags: ['automation', 'workflow', 'whatsapp'],
    is_default: true,
  },
  {
    title: 'Custom Software Proposal',
    category: 'software',
    content: `# Custom Software Development Proposal

**Client:** [Company Name]
**Date:** [Date]
**Prepared by:** Melhek Technologies

---

## Project Brief

[Describe the client's specific problem and what the software will solve]

## Proposed Solution

### Core Features
- [Feature 1]
- [Feature 2]
- [Feature 3]

### Technical Stack
- Web Application (Mobile-first)
- Cloud hosting (99.9% uptime)
- Real-time data sync
- Admin dashboard

## Development Approach

1. **Discovery & Planning** — 3 days
2. **Design & Prototype** — 5 days
3. **Development** — [X] weeks
4. **Testing & QA** — 5 days
5. **Launch & Training** — 2 days

## Investment

| Milestone | Amount |
|-----------|--------|
| 30% on agreement | [X] ETB |
| 40% on prototype approval | [X] ETB |
| 30% on launch | [X] ETB |

## Warranty

3 months of free bug fixes after launch.

---
*Melhek Technologies | melhek.com*`,
    tags: ['software', 'custom', 'development'],
    is_default: true,
  },
]

export function useProposals() {
  const [templates, setTemplates] = useState<ProposalTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useRef(createClient()).current
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const fetchTemplates = useCallback(async () => {
    if (!mounted.current) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data, error: err } = await supabase
      .from('proposal_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (!mounted.current) return
    if (err) { setLoading(false); return }

    if (!data || data.length === 0) {
      // Seed defaults
      const toInsert = DEFAULT_TEMPLATES.map(t => ({ ...t, user_id: user.id }))
      const { data: inserted } = await supabase
        .from('proposal_templates')
        .insert(toInsert)
        .select('*')
      if (!mounted.current) return
      setTemplates((inserted ?? []) as ProposalTemplate[])
    } else {
      setTemplates(data as ProposalTemplate[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  const createTemplate = useCallback(async (input: Omit<ProposalTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ProposalTemplate | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error: err } = await supabase
      .from('proposal_templates')
      .insert({ ...input, user_id: user.id })
      .select('*')
      .single()

    if (!mounted.current) return null
    if (err) { toast.error('Failed to create template'); return null }
    const t = data as ProposalTemplate
    setTemplates(prev => [...prev, t])
    toast.success('Template created')
    return t
  }, [supabase])

  const updateTemplate = useCallback(async (id: string, updates: Partial<ProposalTemplate>): Promise<void> => {
    const original = templates.find(t => t.id === id)
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))

    const { error: err } = await supabase
      .from('proposal_templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (!mounted.current) return
    if (err) {
      if (original) setTemplates(prev => prev.map(t => t.id === id ? original : t))
      toast.error('Failed to update template')
    }
  }, [templates, supabase])

  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    const original = templates.find(t => t.id === id)
    setTemplates(prev => prev.filter(t => t.id !== id))
    const { error: err } = await supabase.from('proposal_templates').delete().eq('id', id)
    if (!mounted.current) return
    if (err) {
      if (original) setTemplates(prev => [...prev, original])
      toast.error('Failed to delete template')
    } else {
      toast.success('Template deleted')
    }
  }, [templates, supabase])

  const duplicateTemplate = useCallback(async (id: string): Promise<void> => {
    const original = templates.find(t => t.id === id)
    if (!original) return
    await createTemplate({ ...original, title: `${original.title} (Copy)`, is_default: false })
  }, [templates, createTemplate])

  return { templates, loading, refetch: fetchTemplates, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate }
}
