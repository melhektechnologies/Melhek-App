'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Calendar() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dates = Array.from({ length: 35 }, (_, i) => {
    const day = i - 3
    if (day < 1 || day > 31) return null
    return day
  })

  const today = 17
  const events = [5, 12, 17, 24, 29]

  return (
    <div className="glass depth-2 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--melhek-text-primary)' }}>May 2026</h3>
        <div className="flex gap-1">
          <button className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--melhek-text-tertiary)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--melhek-bg-2)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--melhek-text-tertiary)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--melhek-bg-2)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {days.map((day) => (
          <div key={day} className="text-center text-xs font-medium py-1" style={{ color: 'var(--melhek-text-tertiary)' }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {dates.map((date, idx) => (
          <div
            key={idx}
            className="aspect-square flex items-center justify-center relative rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
            style={{
              color: date === null ? 'transparent' : date === today ? '#000000' : date && events.includes(date) ? 'var(--melhek-text-primary)' : 'var(--melhek-text-secondary)',
              background: date === null ? 'transparent' : date === today ? 'linear-gradient(135deg, #0080FF, #00D4FF)' : date && events.includes(date) ? 'var(--melhek-bg-3)' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (date && date !== today) {
                if (events.includes(date)) {
                  e.currentTarget.style.backgroundColor = 'var(--melhek-bg-2)'
                } else {
                  e.currentTarget.style.backgroundColor = 'var(--melhek-bg-3)'
                  e.currentTarget.style.color = 'var(--melhek-text-primary)'
                }
              }
            }}
            onMouseLeave={(e) => {
              if (date && date !== today) {
                if (events.includes(date)) {
                  e.currentTarget.style.backgroundColor = 'var(--melhek-bg-3)'
                  e.currentTarget.style.color = 'var(--melhek-text-primary)'
                } else {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--melhek-text-secondary)'
                }
              }
            }}
          >
            {date && (
              <>
                {date}
                {events.includes(date) && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#00D4FF]" />
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Events list */}
      <div className="mt-5 pt-4 space-y-2" style={{ borderTop: '1px solid rgba(0,128,255,0.1)' }}>
        <div className="text-xs font-medium mb-3" style={{ color: 'var(--melhek-text-secondary)' }}>Upcoming</div>
        <div className="space-y-2">
          {[
            { date: 'Today', event: 'Team standup', time: '10:00 AM' },
            { date: 'May 19', event: 'Q2 Planning', time: '2:00 PM' },
            { date: 'May 24', event: 'Board review', time: '3:30 PM' },
          ].map((item, idx) => (
            <div key={idx} className="text-xs p-2 rounded-lg transition-colors cursor-pointer"
              style={{ backgroundColor: 'rgba(31,31,53,0.5)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--melhek-bg-3)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(31,31,53,0.5)'}
            >
              <div className="flex justify-between items-start">
                <span className="font-medium" style={{ color: 'var(--melhek-text-primary)' }}>{item.event}</span>
                <span style={{ color: 'var(--melhek-text-tertiary)', fontSize: '0.75rem' }}>{item.time}</span>
              </div>
              <div style={{ color: 'var(--melhek-text-tertiary)', marginTop: '0.125rem', fontSize: '0.75rem' }}>{item.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
