'use client'

import { HelpCircle, BookOpen, MessageSquare, Zap, Shield, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const SECTIONS = [
  {
    title: 'Getting Started',
    desc: 'New to Melhek OS? Learn the core workflows to boost your productivity.',
    icon: Zap,
    color: '#0080FF',
    items: ['Dashboard Overview', 'Creating your first Project', 'Managing Tasks'],
  },
  {
    title: 'AI Intelligence',
    desc: 'How to use ARIA to summarize projects, draft notes, and automate routine work.',
    icon: MessageSquare,
    color: '#00D4FF',
    items: ['Contextual Chat', 'Markdown Formatting', 'AI Suggestions'],
  },
  {
    title: 'Knowledge Base',
    desc: 'Deep dives into Notes, Calendar, and multi-user collaboration.',
    icon: BookOpen,
    color: '#a855f7',
    items: ['Markdown Guide', 'Note Attachments', 'Shared Projects'],
  },
  {
    title: 'Security & Privacy',
    desc: 'Understanding how Melhek OS protects your data and manages access.',
    icon: Shield,
    color: '#00d084',
    items: ['Row Level Security', 'Authentication', 'Data Encryption'],
  },
]

export default function HelpPage() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-10 pb-20 overflow-y-auto h-full">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <HelpCircle className="w-8 h-8 text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--melhek-text-primary)' }}>
          Help & Support Center
        </h1>
        <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--melhek-text-tertiary)' }}>
          Everything you need to know about navigating the Melhek OS ecosystem.
          If you can't find what you're looking for, <Link href="/ai" className="text-blue-400 font-medium">ask ARIA</Link>.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SECTIONS.map((section) => (
          <div key={section.title} className="glass depth-2 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none opacity-[0.05] group-hover:opacity-10 transition-opacity"
              style={{ background: section.color, filter: 'blur(30px)', transform: 'translate(30%,-30%)' }} />
            
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl" style={{ background: `${section.color}15`, color: section.color }}>
                <section.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--melhek-text-primary)' }}>{section.title}</h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--melhek-text-tertiary)' }}>{section.desc}</p>
                </div>
                <div className="space-y-2">
                  {section.items.map(item => (
                    <button key={item} className="w-full flex items-center justify-between group/item py-1">
                      <span className="text-sm transition-colors group-hover/item:text-blue-400" style={{ color: 'var(--melhek-text-secondary)' }}>{item}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover/item:opacity-100 -translate-x-2 group-hover/item:translate-x-0 transition-all text-blue-400" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="glass rounded-2xl p-8 text-center space-y-4" 
        style={{ border: '1px solid rgba(0,128,255,0.2)', background: 'linear-gradient(to bottom right, rgba(0,128,255,0.05), transparent)' }}>
        <h3 className="text-lg font-bold" style={{ color: 'var(--melhek-text-primary)' }}>Need more specialized help?</h3>
        <p className="text-sm" style={{ color: 'var(--melhek-text-secondary)' }}>
          Our AI assistant ARIA is trained on Melhek OS documentation and can help you with specific tasks.
        </p>
        <Link href="/ai" 
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-black transition-all press-scale"
          style={{ background: 'linear-gradient(135deg, #0080FF, #00D4FF)' }}>
          <MessageSquare className="w-4 h-4" /> Chat with ARIA
        </Link>
      </div>
    </div>
  )
}
