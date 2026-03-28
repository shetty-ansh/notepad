'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { signOut, getUser } from '@/lib/actions/auth'
import { toast } from 'sonner'
import { CustomToast } from '@/components/toastMessage'
import { MenuVertical } from '@/components/menu-vertical'
import { LogOut, Menu } from 'lucide-react'

const nav = [
  { href: '/money',  label: 'Money' },
  { href: '/notes',  label: 'Notes' },
  { href: '/todo',   label: 'Todo' },
  { href: '/habits', label: 'Habits' },
  { href: '/work',   label: 'Work' },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
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

      <nav className="flex flex-col flex-1 overflow-hidden mt-6">
        <MenuVertical menuItems={nav} onNavigate={onNavigate} />
      </nav>
      <div className="p-6 border-t">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 rounded-lg text-lg font-bold text-zinc-900 dark:text-zinc-50 hover:text-[#ff6900] transition-colors"
        >
          <LogOut strokeWidth={2.5} className="size-6" />
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
      {/* Mobile/Tablet/Laptop (Drawer): hamburger + sheet drawer */}
      <div className="xl:hidden fixed top-0 left-0 right-0 z-40 flex items-center h-14 px-4 border-b bg-background">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <span className="ml-3 font-semibold text-sm tracking-wide">MY APP</span>
          <SheetContent side="left" className="w-full max-w-[350px] p-0">
            <div className="h-14 flex items-center px-6 border-b font-bold tracking-wider text-sm">
              MY APP
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop (Fixed): permanent sidebar starting from XL screens (1280px+) */}
      <aside className="hidden xl:flex flex-col w-72 lg:w-80 border-r bg-background shrink-0">
        <div className="h-14 flex items-center px-6 border-b font-bold tracking-wider text-sm">
          MY APP
        </div>
        <NavLinks />
      </aside>
    </>
  )
}