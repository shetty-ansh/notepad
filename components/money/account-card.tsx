import type { Account } from '@/lib/types'

interface AccountCardProps {
  account: Account
  onSelect?: () => void
  isSelected?: boolean
}

export function AccountCard({
  account,
  onSelect,
  isSelected,
}: AccountCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`
        bg-[--card] border rounded-[--radius-lg] p-4 min-w-[200px]
        transition-colors
        ${
          onSelect
            ? 'cursor-pointer hover:bg-[--card-hover] hover:border-[--border-strong]'
            : ''
        }
        ${isSelected ? 'border-[--accent] bg-[--accent-subtle]' : 'border-[--border]'}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{account.icon}</span>
          <h3 className="text-sm font-medium text-[--text-primary]">
            {account.name}
          </h3>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-[--radius-sm] text-[11px] font-medium bg-[--background-muted] text-[--text-secondary]">
          {account.type}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-mono font-semibold text-[--text-primary]">
          {(account.balance || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
        <span className="text-sm text-[--text-secondary]">
          {account.currency}
        </span>
      </div>
    </div>
  )
}
