'use client'

export function GridBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-background overflow-hidden">
      {/* Animated grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#010133]/80 via-[#0a0a14]/95 to-[#000000]" />
      
      {/* Subtle animated grid lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-10"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
            patternTransform="translate(0,0)"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="url(#gridGradient)"
              strokeWidth="0.5"
            />
          </pattern>
          <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0080FF" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#00D4FF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#012a2d" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Glowing gradient overlays */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0080FF]/5 rounded-full blur-3xl opacity-40 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#012a2d]/5 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-[#00D4FF]/3 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
    </div>
  )
}
