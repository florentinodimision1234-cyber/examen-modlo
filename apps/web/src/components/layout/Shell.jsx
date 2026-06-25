'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from './BottomNav'
import PWAInstallPrompt from './PWAInstallPrompt'

const PLAIN_ROUTES = ['/login', '/register', '/cuenta-desactivada']

export default function Shell({ children, rol, nombre, avatarUrl }) {
  const pathname = usePathname()

  if (PLAIN_ROUTES.includes(pathname)) return <>{children}</>

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:block">
        <Sidebar rol={rol} nombre={nombre} avatarUrl={avatarUrl} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="lg:hidden flex items-center justify-center px-4 py-3 bg-zinc-950 border-b border-zinc-800/60 shrink-0">
          <span className="font-display italic font-bold text-gold-400 text-2xl tracking-widest">FLEX</span>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      <BottomNav rol={rol} />
      <PWAInstallPrompt />
    </div>
  )
}
