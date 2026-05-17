'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { formatDateTime } from '@/lib/utils'
import { Send, Zap, Plus, Trash2, Loader2, Bot, User } from 'lucide-react'
import type { AIConversation, ChatMessage } from '@/types'

export default function AIPage() {
  const { profile } = useUser()
  const supabase = useRef(createClient()).current
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!profile || !mounted.current) return
    const { data } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', profile.id)
      .order('updated_at', { ascending: false })
      .limit(20)
    if (mounted.current) {
      setConversations((data as AIConversation[]) ?? [])
      setLoadingConvs(false)
    }
  }, [profile, supabase])

  useEffect(() => { loadConversations() }, [loadConversations])

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConvId) { setMessages([]); return }
    const conv = conversations.find(c => c.id === activeConvId)
    if (conv) setMessages(conv.messages ?? [])
  }, [activeConvId, conversations])

  // Auto-scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, streaming])

  const newConversation = () => {
    setActiveConvId(null)
    setMessages([])
    inputRef.current?.focus()
  }

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await supabase.from('ai_conversations').delete().eq('id', id)
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeConvId === id) { setActiveConvId(null); setMessages([]) }
  }

  const sendMessage = async () => {
    if (!input.trim() || streaming || !profile) return

    const userMsg: ChatMessage = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)

    // Placeholder for streaming response
    const placeholder: ChatMessage = { role: 'assistant', content: '', timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, placeholder])

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
      })

      if (!res.ok || !res.body) throw new Error('Stream failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: fullText } : m))
      }

      // Save conversation to Supabase
      const assistantMsg: ChatMessage = { role: 'assistant', content: fullText, timestamp: new Date().toISOString() }
      const finalMessages = [...newMessages, assistantMsg]
      const title = newMessages[0].content.slice(0, 60)

      if (!activeConvId) {
        const { data: newConv } = await supabase
          .from('ai_conversations')
          .insert({ user_id: profile.id, title, messages: finalMessages })
          .select('*')
          .single()
        if (newConv) {
          setActiveConvId(newConv.id)
          setConversations(prev => [newConv as AIConversation, ...prev])
        }
      } else {
        await supabase
          .from('ai_conversations')
          .update({ messages: finalMessages, updated_at: new Date().toISOString() })
          .eq('id', activeConvId)
        setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, messages: finalMessages } : c))
      }
    } catch {
      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1 ? { ...m, content: '⚠️ Failed to get response. Check your API key.' } : m
      ))
    } finally {
      setStreaming(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="flex h-full">
      {/* Conversation sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={newConversation}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-black press-scale"
            style={{ background: 'linear-gradient(135deg,#0080FF,#00D4FF)' }}>
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {loadingConvs ? (
            [...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-xl shimmer" />)
          ) : conversations.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: 'var(--melhek-text-tertiary)' }}>No conversations yet</p>
          ) : conversations.map(conv => (
            <button key={conv.id} onClick={() => setActiveConvId(conv.id)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all group"
              style={{ background: activeConvId === conv.id ? 'rgba(0,128,255,0.12)' : 'transparent' }}>
              <Bot className="w-3.5 h-3.5 flex-shrink-0" style={{ color: activeConvId === conv.id ? '#00D4FF' : 'var(--melhek-text-tertiary)' }} />
              <span className="text-xs truncate flex-1" style={{ color: activeConvId === conv.id ? 'var(--melhek-text-primary)' : 'var(--melhek-text-secondary)' }}>
                {conv.title ?? 'Untitled'}
              </span>
              <button onClick={e => deleteConversation(conv.id, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-colors flex-shrink-0"
                style={{ color: 'var(--melhek-text-tertiary)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ff6666')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--melhek-text-tertiary)')}>
                <Trash2 className="w-3 h-3" />
              </button>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0080FF] to-[#00D4FF] flex items-center justify-center shadow-[0_0_40px_rgba(0,128,255,0.3)]">
                <Zap className="w-7 h-7 text-black" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--melhek-text-primary)' }}>ARIA — Melhek AI</h2>
                <p className="text-sm" style={{ color: 'var(--melhek-text-secondary)' }}>Ask anything about your tasks, projects, or strategy.</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {['Summarize my active projects', 'What tasks are overdue?', 'Draft a project proposal'].map(s => (
                  <button key={s} onClick={() => { setInput(s); inputRef.current?.focus() }}
                    className="px-3 py-1.5 rounded-xl text-xs transition-all"
                    style={{ background: 'rgba(0,128,255,0.1)', border: '1px solid rgba(0,128,255,0.2)', color: '#00D4FF' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                msg.role === 'assistant'
                  ? 'bg-gradient-to-br from-[#0080FF] to-[#00D4FF]'
                  : 'bg-gradient-to-br from-[#00D4FF] to-[#0080FF]'
              }`}>
                {msg.role === 'assistant'
                  ? <Zap className="w-3.5 h-3.5 text-black" />
                  : <User className="w-3.5 h-3.5 text-black" />}
              </div>
              <div className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'
              }`}
                style={{
                  background: msg.role === 'user' ? 'rgba(0,128,255,0.15)' : 'var(--melhek-bg-2)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(0,128,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  color: 'var(--melhek-text-primary)',
                  whiteSpace: 'pre-wrap',
                }}>
                {msg.content}
                {streaming && i === messages.length - 1 && msg.role === 'assistant' && !msg.content && (
                  <span className="inline-flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
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
                maxHeight: '120px',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,128,255,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
            <button onClick={sendMessage} disabled={!input.trim() || streaming}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-black transition-all press-scale disabled:opacity-50 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#0080FF,#00D4FF)' }}
              onMouseEnter={e => { if (!streaming) e.currentTarget.style.boxShadow = '0 0 20px rgba(0,128,255,0.5)' }}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs mt-2 text-center" style={{ color: 'var(--melhek-text-tertiary)' }}>
            ARIA uses Claude. Conversations are saved to your account.
          </p>
        </div>
      </div>
    </div>
  )
}
