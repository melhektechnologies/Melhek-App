'use client'

import { Send, Zap } from 'lucide-react'

export function AIAssistant() {
  return (
    <div className="glass depth-2 rounded-xl p-6 flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#0080FF] to-[#00D4FF] flex items-center justify-center">
          <Zap className="w-3 h-3 text-[#000000]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--melhek-text-primary)' }}>Melhek AI</h3>
          <p className="text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>Always ready to help</p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 space-y-4 overflow-y-auto min-h-0 mb-4">
        {/* AI message */}
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#0080FF] to-[#00D4FF] flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-[#000000]">A</span>
          </div>
          <div className="flex-1 space-y-2">
            <div className="rounded-lg p-3 text-sm leading-relaxed" style={{ backgroundColor: 'var(--melhek-bg-3)', color: 'var(--melhek-text-primary)' }}>
              I&apos;ve analyzed your Q2 roadmap. There are 3 critical blockers in the API migration project.
            </div>
            <div className="flex gap-2">
              <button className="text-xs px-2 py-1 rounded transition-colors" style={{ backgroundColor: 'rgba(0,128,255,0.15)', color: '#00D4FF' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,128,255,0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,128,255,0.15)'}
              >
                View Details
              </button>
              <button className="text-xs px-2 py-1 rounded transition-colors" style={{ backgroundColor: 'var(--melhek-bg-3)', color: 'var(--melhek-text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--melhek-text-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--melhek-text-secondary)'
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>

        {/* User message */}
        <div className="flex gap-2 justify-end">
          <div className="max-w-xs rounded-lg p-3 text-sm" style={{ backgroundColor: 'rgba(0,128,255,0.15)', color: 'var(--melhek-text-primary)' }}>
            What are the top risks this sprint?
          </div>
        </div>

        {/* AI message */}
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#0080FF] to-[#00D4FF] flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-[#000000]">A</span>
          </div>
          <div className="rounded-lg p-3 text-sm leading-relaxed max-w-xs" style={{ backgroundColor: 'var(--melhek-bg-3)', color: 'var(--melhek-text-primary)' }}>
            Based on your sprint metrics, I&apos;d flag: (1) Database optimization, (2) Team bandwidth, (3) External dependencies.
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-4" style={{ borderTop: '1px solid rgba(0,128,255,0.1)' }}>
        <input
          type="text"
          placeholder="Ask anything..."
          className="flex-1 rounded-lg px-3 py-2 text-sm transition-all duration-200 focus:outline-none"
          style={{ 
            backgroundColor: 'var(--melhek-bg-2)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--melhek-text-primary)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--melhek-bg-3)'
            e.currentTarget.style.borderColor = 'rgba(0,128,255,0.5)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--melhek-bg-2)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
          }}
        />
        <button className="p-2 rounded-lg text-[#000000] transition-all duration-200 press-scale" style={{ background: 'linear-gradient(135deg, #0080FF, #00D4FF)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 24px rgba(0, 128, 255, 0.4), 0 0 48px rgba(0, 212, 255, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
