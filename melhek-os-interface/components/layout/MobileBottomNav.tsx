'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, FolderKanban, MessageSquareCode, Plus } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { icon: LayoutDashboard, href: '/' },
  { icon: CheckSquare, href: '/tasks' },
  { icon: Plus, href: 'action', isAction: true },
  { icon: FolderKanban, href: '/projects' },
  { icon: MessageSquareCode, href: '/ai' },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Floating Action Menu Overlay */}
      {showMenu && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden transition-all" 
             onClick={() => setShowMenu(false)}>
          <div className="absolute bottom-[80px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 w-48 p-4 rounded-3xl glass depth-3 border border-white/10"
               onClick={e => e.stopPropagation()}>
            <button onClick={() => { router.push('/tasks?new=true'); setShowMenu(false) }}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-white/5 text-white active:bg-white/10 transition-colors">
              New Task
            </button>
            <button onClick={() => { router.push('/notes?new=true'); setShowMenu(false) }}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-white/5 text-white active:bg-white/10 transition-colors">
              New Note
            </button>
            <button onClick={() => { router.push('/calendar'); setShowMenu(false) }}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-white/5 text-white active:bg-white/10 transition-colors">
              Calendar Event
            </button>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-[env(safe-area-inset-bottom)] glass depth-2 border-t border-white/5">
        <div className="flex items-center justify-between h-16 max-w-md mx-auto">
          {NAV_ITEMS.map((item, i) => {
            if (item.isAction) {
              return (
                <button key={i} onClick={() => setShowMenu(!showMenu)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center -translate-y-4 shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-transform active:scale-95 ${showMenu ? 'rotate-45' : ''}`}
                  style={{ background: 'linear-gradient(135deg, #0080FF, #00D4FF)' }}>
                  <item.icon className="w-6 h-6 text-black" />
                </button>
              )
            }
            
            const active = isActive(item.href)
            return (
              <Link key={i} href={item.href}
                className={`p-3 rounded-xl transition-all ${active ? 'bg-white/10' : 'active:bg-white/5'}`}>
                <item.icon className="w-6 h-6" 
                  style={{ color: active ? '#00D4FF' : 'var(--melhek-text-tertiary)' }} />
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
