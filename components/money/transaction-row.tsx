import type { Transaction, Account } from '@/lib/types'

interface TransactionRowProps {
  transaction: Transaction
  account?: Account
}

export function TransactionRow({ transaction, account }: TransactionRowProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-[--success]'
      case 'expense':
        return 'text-[--danger]'
      case 'provision':
        return 'text-[--accent]'
      default:
        return 'text-[--text-primary]'
    }
  }

  const getTypeSymbol = (type: string) => {
    switch (type) {
      case 'income':
        return '+'
      case 'expense':
        return '−'
      default:
        return ''
    }
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-[--border] last:border-0 hover:bg-[--card-hover] -mx-4 px-4 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              transaction.type === 'income'
                ? 'bg-[--success]'
                : transaction.type === 'expense'
                  ? 'bg-[--danger]'
                  : transaction.type === 'provision'
                    ? 'bg-[--accent]'
                    : 'bg-[--text-tertiary]'
            }`}
          />
          <p className="text-sm font-medium text-[--text-primary]">
            {transaction.description}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-[--radius-sm] text-[11px] font-medium bg-[--background-muted] text-[--text-secondary]">
            {transaction.category}
          </span>
          <span className="text-xs text-[--text-secondary] font-mono">
            {transaction.txn_date}
          </span>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-mono font-medium ${getTypeColor(transaction.type || '')}`}>
          {getTypeSymbol(transaction.type || '')}₹
          {(transaction.amount || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        {account && (
          <p className="text-xs text-[--text-secondary] mt-0.5">
            {account.name}
          </p>
        )}
      </div>
    </div>
  )
}
