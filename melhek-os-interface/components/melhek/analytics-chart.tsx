'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function AnalyticsChart() {
  const data = [
    { time: '00:00', requests: 2400, errors: 24, latency: 120 },
    { time: '04:00', requests: 1398, errors: 22, latency: 95 },
    { time: '08:00', requests: 9800, errors: 29, latency: 145 },
    { time: '12:00', requests: 3908, errors: 20, latency: 110 },
    { time: '16:00', requests: 4800, errors: 19, latency: 105 },
    { time: '20:00', requests: 3800, errors: 23, latency: 130 },
    { time: '24:00', requests: 4300, errors: 21, latency: 125 },
  ]

  return (
    <div className="glass depth-2 rounded-xl p-5">
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--melhek-text-primary)' }}>API Performance</h3>
        <p className="text-xs" style={{ color: 'var(--melhek-text-tertiary)' }}>Last 24 hours • Real-time monitoring</p>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0080FF" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#0080FF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(0, 128, 255, 0.1)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            stroke="rgba(160, 160, 176, 0.5)"
            style={{ fontSize: '11px' }}
            tick={{ fill: 'rgba(160, 160, 176, 0.7)' }}
          />
          <YAxis
            stroke="rgba(160, 160, 176, 0.5)"
            style={{ fontSize: '11px' }}
            tick={{ fill: 'rgba(160, 160, 176, 0.7)' }}
            yAxisId="left"
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="rgba(160, 160, 176, 0.5)"
            style={{ fontSize: '11px' }}
            tick={{ fill: 'rgba(160, 160, 176, 0.7)' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(31, 31, 53, 0.95)',
              border: '1px solid rgba(0, 128, 255, 0.2)',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            }}
            labelStyle={{ color: 'rgba(240, 240, 245, 1)' }}
            cursor={{ stroke: 'rgba(0, 128, 255, 0.2)' }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="requests"
            stroke="#0080FF"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="latency"
            stroke="#00D4FF"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex gap-6 mt-6 pt-4 text-xs" style={{ borderTop: '1px solid rgba(0,128,255,0.1)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#0080FF]" />
          <span style={{ color: 'var(--melhek-text-secondary)' }}>Requests</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00D4FF]" />
          <span style={{ color: 'var(--melhek-text-secondary)' }}>Latency (ms)</span>
        </div>
      </div>
    </div>
  )
}
