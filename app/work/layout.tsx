'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { name: 'Dashboard', href: '/work' },
  { name: 'Projects', href: '/work/projects' },
  { name: 'Calendar', href: '/work/calendar' },
]

export default function WorkLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Don't show tabs on project detail pages
  const isDetailPage = /^\/work\/projects\/[^/]+$/.test(pathname)

  return (
    <div className="flex flex-col h-full">
      {!isDetailPage && (
        <div className="border-b border-[--border] bg-[--background] shrink-0">
          <div className="flex items-center gap-6 px-4 sm:px-6 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive =
                pathname === tab.href ||
                (tab.href !== '/work' && pathname.startsWith(tab.href))

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`
                    relative py-3 text-sm font-medium whitespace-nowrap transition-colors
                    ${
                      isActive
                        ? 'text-[--accent-foreground]'
                        : 'text-[--muted-foreground] hover:text-[--foreground]'
                    }
                  `}
                >
                  {tab.name}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}
