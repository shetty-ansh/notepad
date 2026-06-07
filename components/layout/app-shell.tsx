'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from './sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith('/login')
  const isLandingPage = pathname === '/'

  if (isAuthPage || isLandingPage) return <>{children}</>

  return (
    <div className="flex flex-col xl:flex-row h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  )
}
