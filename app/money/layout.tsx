'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { name: 'Overview', href: '/money' },
  { name: 'Transactions', href: '/money/transactions' },
  { name: 'Goals', href: '/money/goals' },
  { name: 'Ledger', href: '/money/ledger' },
  { name: 'Bills', href: '/money/bills' },
  { name: 'Stats', href: '/money/stats' },
]

export default function MoneyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="border-b border-[--border] bg-[--background] shrink-0">
        <div className="flex items-center gap-6 px-6 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.href !== '/money' && pathname.startsWith(tab.href))

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  relative py-3 text-sm font-medium whitespace-nowrap transition-colors
                  ${
                    isActive
                      ? 'text-[--accent]'
                      : 'text-[--text-secondary] hover:text-[--text-primary]'
                  }
                `}
              >
                {tab.name}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[--accent]" />
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}
