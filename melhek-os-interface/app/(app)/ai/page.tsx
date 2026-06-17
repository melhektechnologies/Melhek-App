'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { useTasks } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { useNotes } from '@/hooks/useNotes'
import { useOpportunities } from '@/hooks/useOpportunities'
import { renderMarkdown } from '@/lib/markdown'
import { formatDateTime, getInitials } from '@/lib/utils'
import {
  Send, Zap, Plus, Trash2, Loader2, Bot, User,
  RefreshCw, FolderKanban, CheckSquare, FileText, X, ChevronDown,
  TrendingUp, DollarSign, Flame
} from 'lucide-react'
import type { AIConversation, ChatMessage } from '@/types'

// ─── Suggested prompts ────────────────────────────────────────
const SUGGESTIONS = [
  'Summarize my active projects',
  'What tasks are overdue?',
  'Draft a project proposal',
  'Help me prioritize my work',
  'Analyze risks in my projects',
]

const REVENUE_SUGGESTIONS = [
  'Give me my daily revenue briefing',
  'Which deal should I close today?',
  'List overdue follow-ups and what to say',
  'What are my biggest revenue risks?',
  'Write a follow-up WhatsApp message for a prospect',
  'Give me a weekly revenue summary',
  'What should my top 3 actions be today?',
]

// ─── Context type config ──────────────────────────────────────
const CTX_CFG = {
  project:  { icon: FolderKanban, label: 'Project',  color: '#0080FF' },
  task:     { icon: CheckSquare,  label: 'Task',     color: '#00d084' },
  note:     { icon: FileText,     label: 'Note',     color: '#a855f7' },
  general:  { icon: Zap,          label: 'General',  color: '#00D4FF' },
}

export default function AIPage() {
  const { profile } = useUser()
  const supabase = useRef(createClient()).current
  const mounted = useRef(true)

  // Revenue Coach mode
  const [revenueMode, setRevenueMode] = useState(false)
  const { opportunities } = useOpportunities()

  // Chat state
  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Context injection
  const [ctxType, setCtxType] = useState<'general' | 'project' | 'task' | 'note'>('general')
  const [ctxId, setCtxId] = useState('')
  const [ctxPickerOpen, setCtxPickerOpen] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const lastMessagesRef = useRef<ChatMessage[]>([])

  useEffect(() => {
    mounted.current = true
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false)
    }
    return () => { mounted.current = false }
  }, [])

  // Data hooks for context injection
  const { tasks } = useTasks()
  const { projects } = useProjects()
  const { notes } = useNotes()

  // ─── Load conversations ────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!profile || !mounted.current) return
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', profile.id)
        .order('updated_at', { ascending: false })
        .limit(25)
      
      if (error) {
        console.warn('[ARIA loadConversations] Supabase query returned error:', error.message)
        // If table doesn't exist, we fall back gracefully
      }

      if (mounted.current) {
        setConversations((data as AIConversation[]) ?? [])
      }
    } catch (err) {
      console.error('[ARIA loadConversations] Failed to fetch:', err)
    } finally {
      if (mounted.current) {
        setLoadingConvs(false)
      }
    }
  }, [profile, supabase])

  useEffect(() => { loadConversations() }, [loadConversations])

  // Sync messages from active conversation
  useEffect(() => {
    if (!activeConvId) { setMessages([]); return }
    const conv = conversations.find(c => c.id === activeConvId)
    if (conv) setMessages(conv.messages ?? [])
  }, [activeConvId, conversations])

  // Auto-scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, streaming])

  // ─── Build context data string ─────────────────────────────
  const buildContextData = useCallback((): { type: typeof ctxType; data: string } | undefined => {
    // If Revenue Coach mode, inject pipeline context
    if (revenueMode) {
      const wonTotal = opportunities.filter(o => o.stage === 'won').reduce((s, o) => s + o.potential_revenue, 0)
      const activeDeals = opportunities.filter(o => !['won','lost'].includes(o.stage))
      const today = new Date().toISOString().split('T')[0]
      const overdueFollowUps = activeDeals.filter(o => o.next_action_date && o.next_action_date < today)
      const pipelineData = `
Revenue Goal: 300,000 ETB | Sprint: 84 days from June 17, 2026
Revenue Closed (Won): ${wonTotal.toLocaleString()} ETB
Revenue Remaining: ${(300000 - wonTotal).toLocaleString()} ETB
Active Pipeline Deals: ${activeDeals.length}
Overdue Follow-Ups: ${overdueFollowUps.length}
Top Deals:\n${activeDeals.slice(0, 5).map(o => `- ${o.company_name}: ${((o.potential_revenue * o.probability)/100).toFixed(0)} ETB expected (${o.probability}% at ${o.stage}), next action: ${o.next_action ?? 'none'}, next date: ${o.next_action_date ?? 'none'}`).join('\n')}
Overdue Follow-Ups:\n${overdueFollowUps.map(o => `- ${o.company_name}: was due ${o.next_action_date}, action: ${o.next_action ?? 'call'}`).join('\n') || 'None'}
      `.trim()
      return { type: 'general', data: pipelineData }
    }
    if (ctxType === 'general') return undefined
    if (ctxType === 'project' && ctxId) {
      const p = projects.find(p => p.id === ctxId)
      if (p) return { type: 'project', data: `Project: ${p.name}\nStatus: ${p.status}\nDescription: ${p.description ?? 'None'}` }
    }
    if (ctxType === 'task' && ctxId) {
      const t = tasks.find(t => t.id === ctxId)
      if (t) return { type: 'task', data: `Task: ${t.title}\nStatus: ${t.status}\nPriority: ${t.priority}\nDue: ${t.due_date ?? 'None'}\nDescription: ${t.description ?? 'None'}` }
    }
    if (ctxType === 'note' && ctxId) {
      const n = notes.find(n => n.id === ctxId)
      if (n) return { type: 'note', data: `Note: ${n.title}\n\n${n.content.slice(0, 800)}` }
    }
    return undefined
  }, [revenueMode, opportunities, ctxType, ctxId, projects, tasks, notes])

  // ─── Send message ──────────────────────────────────────────
  const sendMessage = useCallback(async (overrideInput?: string) => {
    const text = (overrideInput ?? input).trim()
    if (!text || streaming || !profile) return

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date().toISOString() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)
    setError(null)
    lastMessagesRef.current = newMessages

    // Placeholder assistant message
    const placeholder: ChatMessage = { role: 'assistant', content: '', timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, placeholder])

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          context: buildContextData(),
          revenueMode,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(err.error ?? `HTTP ${res.status}`)
      }
      if (!res.body) throw new Error('No response stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Handle Vercel AI SDK text stream format (may have "0:" prefix)
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('0:')) {
            // Vercel AI SDK data stream format
            try {
              fullText += JSON.parse(line.slice(2))
            } catch {
              fullText += line.slice(2)
            }
          } else if (line && !line.startsWith('d:') && !line.startsWith('e:')) {
            fullText += line
          }
        }

        if (mounted.current) {
          setMessages(prev => prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: fullText } : m
          ))
        }
      }

      if (!mounted.current) return

      // Persist to Supabase
      const assistantMsg: ChatMessage = { role: 'assistant', content: fullText, timestamp: new Date().toISOString() }
      const finalMessages = [...newMessages, assistantMsg]
      const title = newMessages[0].content.slice(0, 60)

      if (!activeConvId) {
        const { data: newConv } = await supabase
          .from('ai_conversations')
          .insert({ user_id: profile.id, title, messages: finalMessages })
          .select('*').single()
        if (newConv && mounted.current) {
          setActiveConvId(newConv.id)
          setConversations(prev => [newConv as AIConversation, ...prev])
        }
      } else {
        await supabase
          .from('ai_conversations')
          .update({ messages: finalMessages, updated_at: new Date().toISOString() })
          .eq('id', activeConvId)
        if (mounted.current) {
          setConversations(prev => prev.map(c =>
            c.id === activeConvId ? { ...c, messages: finalMessages, updated_at: new Date().toISOString() } : c
          ))
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      if (mounted.current) {
        setError(msg)
        setMessages(prev => prev.slice(0, -1)) // Remove placeholder
      }
    } finally {
      if (mounted.current) setStreaming(false)
    }
  }, [input, streaming, profile, messages, activeConvId, supabase, buildContextData])

  // ─── Retry last message ────────────────────────────────────
  const retry = useCallback(() => {
    if (!lastMessagesRef.current.length) return
    const lastUser = [...lastMessagesRef.current].reverse().find(m => m.role === 'user')
    if (lastUser) {
      setMessages(lastMessagesRef.current.filter(m => m !== lastUser))
      sendMessage(lastUser.content)
    }
  }, [sendMessage])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const newConversation = () => {
    setActiveConvId(null)
    setMessages([])
    setError(null)
    setCtxType('general')
    setCtxId('')
    inputRef.current?.focus()
  }

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await supabase.from('ai_conversations').delete().eq('id', id)
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeConvId === id) newConversation()
  }

  const CtxIcon = CTX_CFG[ctxType].icon

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/60 md:hidden backdrop-blur-sm transition-all"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Conversation Sidebar ─────────────────────────── */}
      <div
        className={`absolute md:relative inset-y-0 left-0 z-30 flex-shrink-0 flex flex-col transition-all overflow-hidden h-full md:h-auto ${sidebarOpen ? 'w-64' : 'w-0'}`}
        style={{ 
          borderRight: sidebarOpen ? '1px solid rgba(255,255,255,0.08)' : 'none', 
          background: 'rgba(5,5,15,0.95)', 
          backdropFilter: 'blur(20px)' 
        }}>
        <div className="px-3 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={newConversation}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-black press-scale"
            style={{ background: 'linear-gradient(135deg,#0080FF,#00D4FF)' }}>
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {loadingConvs ? (
            [...Array(5)].map((_, i) => <div key={i} className="h-10 rounded-xl shimmer" />)
          ) : conversations.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: 'var(--melhek-text-tertiary)' }}>
              No conversations yet
            </p>
          ) : conversations.map(conv => (
            <div key={conv.id} onClick={() => setActiveConvId(conv.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all group cursor-pointer"
              style={{ background: activeConvId === conv.id ? 'rgba(0,128,255,0.12)' : 'transparent' }}>
              <Bot className="w-3.5 h-3.5 flex-shrink-0"
                style={{ color: activeConvId === conv.id ? '#00D4FF' : 'var(--melhek-text-tertiary)' }} />
              <span className="text-xs truncate flex-1"
                style={{ color: activeConvId === conv.id ? 'var(--melhek-text-primary)' : 'var(--melhek-text-secondary)' }}>
                {conv.title ?? 'Untitled'}
              </span>
              <button onClick={e => deleteConversation(conv.id, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded flex-shrink-0"
                style={{ color: 'var(--melhek-text-tertiary)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ff6666')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--melhek-text-tertiary)')}>
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
            style={{ background: 'rgba(0,128,255,0.08)', border: '1px solid rgba(0,128,255,0.15)' }}>
            <Zap className="w-3 h-3 flex-shrink-0" style={{ color: '#00D4FF' }} />
            <span className="text-[10px]" style={{ color: 'var(--melhek-text-tertiary)' }}>
              Powered by Groq · Llama 3.3 70B
            </span>
          </div>
        </div>
      </div>

      {/* ─── Chat Area ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,5,15,0.4)' }}>
          <button onClick={() => setSidebarOpen(v => !v)} className="p-1.5 rounded-lg"
            style={{ color: 'var(--melhek-text-tertiary)' }}>
            <Bot className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-semibold flex-1" style={{ color: 'var(--melhek-text-primary)' }}>
            {revenueMode ? '⚡ ARIA — Revenue Coach' : 'ARIA — Melhek AI'}
          </h1>

          {/* Revenue Coach Toggle */}
          <button onClick={() => setRevenueMode(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all mr-1"
            style={{
              background: revenueMode ? 'rgba(0,208,132,0.15)' : 'rgba(255,255,255,0.05)',
              color: revenueMode ? '#00d084' : 'var(--melhek-text-tertiary)',
              border: `1px solid ${revenueMode ? 'rgba(0,208,132,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}>
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{revenueMode ? 'Revenue Coach' : 'Revenue Mode'}</span>
          </button>

          {/* Context picker */}
          <div className="relative">
            <button onClick={() => setCtxPickerOpen(v => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all"
              style={{
                background: ctxType !== 'general' ? 'rgba(0,128,255,0.12)' : 'var(--melhek-bg-3)',
                color: ctxType !== 'general' ? CTX_CFG[ctxType].color : 'var(--melhek-text-secondary)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
              <CtxIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{ctxType !== 'general' ? 'Context: ' + CTX_CFG[ctxType].label : 'Add Context'}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {ctxPickerOpen && (
              <div className="absolute right-0 top-full mt-1 z-30 rounded-xl overflow-hidden shadow-2xl"
                style={{ background: 'var(--melhek-bg-1)', border: '1px solid rgba(255,255,255,0.1)', width: 220, minWidth: 180 }}>
                {/* Context type selector */}
                {(['general', 'project', 'task', 'note'] as const).map(t => {
                  const cfg = CTX_CFG[t]
                  return (
                    <button key={t} onClick={() => { setCtxType(t); setCtxId(''); if (t === 'general') setCtxPickerOpen(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-all text-left"
                      style={{
                        background: ctxType === t ? 'rgba(0,128,255,0.1)' : 'transparent',
                        color: ctxType === t ? cfg.color : 'var(--melhek-text-secondary)',
                      }}>
                      <cfg.icon className="w-3.5 h-3.5" /> {cfg.label}
                    </button>
                  )
                })}

                {/* Context item selector */}
                {ctxType !== 'general' && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {ctxType === 'project' && projects.slice(0, 8).map(p => (
                      <button key={p.id} onClick={() => { setCtxId(p.id); setCtxPickerOpen(false) }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-all truncate"
                        style={{ background: ctxId === p.id ? 'rgba(0,128,255,0.08)' : 'transparent', color: 'var(--melhek-text-primary)' }}>
                        {p.icon} {p.name}
                      </button>
                    ))}
                    {ctxType === 'task' && tasks.filter(t => t.status !== 'done').slice(0, 8).map(t => (
                      <button key={t.id} onClick={() => { setCtxId(t.id); setCtxPickerOpen(false) }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-all truncate"
                        style={{ background: ctxId === t.id ? 'rgba(0,128,255,0.08)' : 'transparent', color: 'var(--melhek-text-primary)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />{t.title}
                      </button>
                    ))}
                    {ctxType === 'note' && notes.slice(0, 8).map(n => (
                      <button key={n.id} onClick={() => { setCtxId(n.id); setCtxPickerOpen(false) }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-all truncate"
                        style={{ background: ctxId === n.id ? 'rgba(0,128,255,0.08)' : 'transparent', color: 'var(--melhek-text-primary)' }}>
                        <FileText className="w-3 h-3 flex-shrink-0" />{n.title}
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => setCtxPickerOpen(false)}
                  className="w-full flex items-center justify-center gap-1 px-3 py-2 text-xs"
                  style={{ color: 'var(--melhek-text-tertiary)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <X className="w-3 h-3" /> Close
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-5">
              <div className="w-16 h-16 flex items-center justify-center">
                <img src="/logo.jpg" alt="Melhek Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--melhek-text-primary)' }}>
                  {revenueMode ? '⚡ ARIA Revenue Coach' : 'ARIA'}
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--melhek-text-secondary)' }}>
                  {revenueMode
                    ? 'Tactical revenue intelligence. Ask me about your pipeline, deals, and what to do next.'
                    : 'Ask anything — tasks, projects, strategy, or drafting.'}
                </p>
              </div>
              {revenueMode && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium"
                  style={{ background: 'rgba(0,208,132,0.08)', border: '1px solid rgba(0,208,132,0.2)', color: '#00d084' }}>
                  <Flame className="w-3.5 h-3.5" /> Revenue Coach Mode Active — Pipeline data injected
                </div>
              )}
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {(revenueMode ? REVENUE_SUGGESTIONS : SUGGESTIONS).map(s => (
                  <button key={s} onClick={() => sendMessage(s)}
                    className="px-3 py-1.5 rounded-xl text-xs transition-all"
                    style={{
                      background: revenueMode ? 'rgba(0,208,132,0.08)' : 'rgba(0,128,255,0.08)',
                      border: `1px solid ${revenueMode ? 'rgba(0,208,132,0.2)' : 'rgba(0,128,255,0.2)'}`,
                      color: revenueMode ? '#00d084' : '#00D4FF'
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              {msg.role === 'assistant' ? (
                <div className="w-7 h-7 flex-shrink-0 mt-1 flex items-center justify-center">
                  <img src="/logo.jpg" alt="ARIA Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-1 shadow-[0_0_10px_rgba(0,128,255,0.2)] border border-white/5 bg-gradient-to-br from-[#00D4FF] to-[#0080FF] flex items-center justify-center text-[10px] font-bold text-black">
                  {profile ? getInitials(profile.full_name) : '?'}
                </div>
              )}

              {/* Bubble */}
              <div className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                style={{
                  background: msg.role === 'user' ? 'rgba(0,128,255,0.15)' : 'var(--melhek-bg-2)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(0,128,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  color: 'var(--melhek-text-primary)',
                }}>
                {msg.role === 'assistant' ? (
                  msg.content ? (
                    <div className="prose-melhek text-sm"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                  ) : (
                    // Typing indicator
                    <span className="inline-flex gap-1 items-center py-0.5">
                      {[0, 150, 300].map(delay => (
                        <span key={delay} className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ background: '#00D4FF', animationDelay: `${delay}ms` }} />
                      ))}
                    </span>
                  )
                ) : (
                  <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                )}
                {msg.timestamp && (
                  <p className="text-[10px] mt-1.5 opacity-40">{formatDateTime(msg.timestamp)}</p>
                )}
              </div>
            </div>
          ))}

          {/* Error with retry */}
          {error && (
            <div className="flex justify-center">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)' }}>
                <span className="text-sm" style={{ color: '#ff6666' }}>{error}</span>
                <button onClick={retry} disabled={streaming}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: 'rgba(255,68,68,0.15)', color: '#ff9999' }}>
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Active context badge */}
          {ctxType !== 'general' && ctxId && (
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                style={{ background: 'rgba(0,128,255,0.08)', color: CTX_CFG[ctxType].color, border: '1px solid rgba(0,128,255,0.15)' }}>
                <CtxIcon className="w-3 h-3" />
                Context: {ctxType === 'project' ? projects.find(p => p.id === ctxId)?.name :
                  ctxType === 'task' ? tasks.find(t => t.id === ctxId)?.title :
                  notes.find(n => n.id === ctxId)?.title}
              </span>
              <button onClick={() => { setCtxType('general'); setCtxId('') }}
                className="p-0.5 rounded" style={{ color: 'var(--melhek-text-tertiary)' }}>
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              placeholder="Message ARIA… (Enter to send, Shift+Enter for newline)"
              className="flex-1 px-4 py-3 rounded-2xl text-sm focus:outline-none resize-none leading-relaxed transition-all"
              style={{
                background: 'var(--melhek-bg-2)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--melhek-text-primary)',
                maxHeight: 120,
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,128,255,0.4)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim() || streaming}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-black transition-all press-scale disabled:opacity-50 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#0080FF,#00D4FF)' }}>
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] mt-2 text-center" style={{ color: 'var(--melhek-text-tertiary)' }}>
            ARIA uses Groq · Llama 3.3 70B · Free tier · Conversations saved to your account
          </p>
        </div>
      </div>
    </div>
  )
}
