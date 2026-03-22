import type { Account, Goal, Transaction } from '@/lib/types'

interface AccountCardProps {
  account: Account
  transactions?: Transaction[]
  goals?: Goal[]
  onSelect?: () => void
  isSelected?: boolean
  className?: string
}

export function AccountCard({
  account,
  transactions = [],
  goals = [],
  onSelect,
  isSelected,
  className = '',
}: AccountCardProps) {
  const provisioned = transactions
    .filter(t => t.account_id === account.id && t.type === 'provision')
    .reduce((sum, t) => sum + (t.amount || 0), 0)
    
  const freeMoney = (account.balance || 0) - provisioned
  return (
    <div
      onClick={onSelect}
      className={`
        bg-white border border-gray-400 rounded-[12px] p-4 min-w-[200px]
        transition-colors
        ${onSelect
          ? 'cursor-pointer hover:bg-[--card-hover] hover:border-[--border-strong]'
          : ''
        }
        ${isSelected ? 'border-[--accent] bg-[--accent-subtle]' : 'border-[--border]'}
        ${className}
      `}
      style={{ borderColor: account.color || undefined, backgroundColor: account.color ? `${account.color}15` : undefined }}
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
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-mono font-semibold text-[--text-primary]">
            {(account.balance || 0).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-xs text-[--text-secondary]">
            {account.currency}
          </span>
        </div>
        
        {provisioned > 0 && (
          <div className="flex flex-col gap-0.5 mt-1 border-t border-[--border] pt-2">
            <div className="flex justify-between text-[11px]">
              <span className="text-[--text-secondary]">Free</span>
              <span className="font-mono font-medium text-[--text-primary]">
                {freeMoney.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[--text-tertiary]">Provisioned</span>
              <span className="font-mono text-[--text-tertiary]">
                {provisioned.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
