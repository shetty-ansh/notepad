import { deleteTransaction } from '@/lib/actions/money'
import type { Transaction, Account } from '@/lib/types'
import { Pencil, Trash2 } from 'lucide-react'

interface TransactionRowProps {
  transaction: Transaction
  account?: Account
  colour: string
  icon?: string
  onEdit?: (transaction: Transaction) => void
  onDelete?: () => void
}

export function TransactionRow({ transaction, account, colour, icon, onEdit, onDelete }: TransactionRowProps) {

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
    <div
      className={`flex items-center justify-between py-3 rounded-[12px] mt-2 hover:bg-[--card-hover] px-4 transition-colors`}
      style={{ backgroundColor: colour ? `${colour}15` : undefined }}
    >
      <div className="flex items-center gap-4 flex-1">

        <div>
          <p className="font-bold text-black">
            {transaction.description}
          </p>
          <div className="flex flex-col items-start gap-3 mt-3">
            <span className="text-xs text-black border border-black rounded-full px-2 py-1">
              {transaction.category}
            </span>
            <span className="text-xs text-black">
              {transaction.txn_date}
            </span>

          </div>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-mono font-medium`}>
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
      <div className="flex items-center justify-center rounded-full p-1.5 ml-2 border border-white bg-white text-black hover:bg-black hover:text-white transition-colors">
        <button onClick={() => onEdit?.(transaction)}>
          <Pencil size={14} />
        </button>
      </div>
      <div className="flex items-center justify-center rounded-full p-1.5 ml-2 border border-red-200 bg-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-colors">
        <button onClick={async () => {
          await deleteTransaction(transaction.id)
          onDelete?.()
        }}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
