'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { signOut, getUser } from '@/lib/actions/auth'
import { toast } from 'sonner'
import { CustomToast } from '@/components/toastMessage'

const nav = [
  { href: '/money',  label: 'Money',  icon: '₹' },
  { href: '/notes',  label: 'Notes',  icon: '📝' },
  { href: '/todo',   label: 'Todo',   icon: '✓'  },
  { href: '/habits', label: 'Habits', icon: '🔁' },
  { href: '/work',   label: 'Work',   icon: '📅' },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    getUser().then((user) => {
      const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || null
      setUserName(name)
    })
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      toast.custom(() => (
        <CustomToast type="error" title="Sign out failed" message="Please try again." />
      ))
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* User info */}
      {userName && (
        <div className="px-4 py-3 border-b">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="text-sm font-medium truncate">{userName}</p>
        </div>
      )}

      <nav className="flex flex-col gap-1 p-4 flex-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              pathname.startsWith(item.href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <span className="text-base">↩</span>
          Sign out
        </button>
      </div>
    </div>
  )
}

export function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile: hamburger + sheet drawer */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center h-14 px-4 border-b bg-background">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </Button>
          </SheetTrigger>
          <span className="ml-3 font-semibold text-sm">My App</span>
          <SheetContent side="left" className="w-64 p-0">
            <div className="h-14 flex items-center px-4 border-b font-semibold text-sm">
              My App
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: permanent sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r bg-background shrink-0">
        <div className="h-14 flex items-center px-4 border-b font-semibold text-sm">
          My App
        </div>
        <NavLinks />
      </aside>
    </>
  )
}