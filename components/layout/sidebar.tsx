'use client'

// import Link from 'next/link'
import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
// AUTH DISABLED FOR NOW
// import { signOut, getUser } from '@/lib/actions/auth'
// import { toast } from 'sonner'
// import { CustomToast } from '@/components/toastMessage'
import { MenuVertical } from '@/components/menu-vertical'
import {
  // LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const nav = [
  { href: '/money',  label: 'Money' },
  { href: '/notes',  label: 'Notes' },
  { href: '/todo',   label: 'Todo' },
  { href: '/habits', label: 'Habits' },
  { href: '/work',   label: 'Work' },
]

function NavLinks({ onNavigate, isCollapsed }: { onNavigate?: () => void; isCollapsed?: boolean }) {
  // AUTH DISABLED FOR NOW
  // const [userName, setUserName] = useState<string | null>(null)
  //
  // useEffect(() => {
  //   getUser().then((user) => {
  //     const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || null
  //     setUserName(name)
  //   })
  // }, [])
  const userName = null

  // AUTH DISABLED FOR NOW
  // const handleSignOut = async () => {
  //   try {
  //     await signOut()
  //     onNavigate?.()
  //   } catch {
  //     toast.custom(() => (
  //       <CustomToast type="error" title="Sign out failed" message="Please try again." />
  //     ))
  //   }
  // }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* User info */}
      {userName && !isCollapsed && (
        <div className="px-4 py-3 border-b">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="text-sm font-medium truncate">{userName}</p>
        </div>
      )}

      <nav className="flex flex-col flex-1 overflow-hidden mt-6">
        <MenuVertical menuItems={nav} onNavigate={onNavigate} isCollapsed={isCollapsed} />
      </nav>
      {/* AUTH DISABLED FOR NOW */}
      {/* <div className={cn("p-6 border-t", isCollapsed && "px-4")}>
        <button
          onClick={handleSignOut}
          className={cn(
            "w-full flex items-center gap-3 rounded-lg text-lg font-bold text-zinc-900 dark:text-zinc-50 hover:text-[#ff6900] transition-colors",
            isCollapsed && "justify-center"
          )}
          title="Sign out"
        >
          <LogOut strokeWidth={2.5} className="size-6 shrink-0" />
          {!isCollapsed && <span>Sign out</span>}
        </button>
      </div> */}
    </div>
  )
}

export function Sidebar() {
  const [open, setOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      {/* Mobile/Tablet/Laptop (Drawer): hamburger + sheet drawer */}
      <div className="xl:hidden flex items-center h-14 px-4 border-b bg-background">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <span className="ml-3 font-semibold text-sm tracking-wide">MY APP</span>
          <SheetContent side="left" className="w-full max-w-[350px] p-0">
            <SheetHeader className="h-14 flex flex-row items-center px-6 border-b font-bold tracking-wider text-sm space-y-0">
              <SheetTitle className="text-sm font-bold tracking-wider">MY APP</SheetTitle>
            </SheetHeader>
            <NavLinks onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop (Fixed): permanent sidebar starting from XL screens (1280px+) */}
      <aside
        className={cn(
          "hidden xl:flex flex-col border-r bg-background shrink-0 transition-all duration-300",
          isCollapsed ? "w-16" : "w-72 lg:w-80"
        )}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b">
          {!isCollapsed && <span className="font-bold tracking-wider text-sm px-2">MY APP</span>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="size-8 self-center"
          >
            {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>
        </div>
        <NavLinks isCollapsed={isCollapsed} />
      </aside>
    </>
  )
}