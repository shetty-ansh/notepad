'use client'

import { useState } from 'react'
import { deleteTransaction } from '@/lib/actions/money'
import type { Transaction, Account } from '@/lib/types'
import { Pencil, Trash2 } from 'lucide-react'
import { formatText, formatDate } from '@/lib/utils'

interface TransactionRowProps {
  transaction: Transaction
  account?: Account
  colour: string
  icon?: string
  onEdit?: (transaction: Transaction) => void
  onDelete?: () => void
}

export function TransactionRow({ transaction, account, colour, icon, onEdit, onDelete }: TransactionRowProps) {
  const [expanded, setExpanded] = useState(false)

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
      className="rounded-[12px] mt-2 transition-all cursor-pointer"
      style={{ backgroundColor: colour ? `${colour}10` : undefined }}
      onClick={() => setExpanded(prev => !prev)}
    >
      {/* Collapsed row */}
      <div className="flex items-center justify-between py-4 px-5">
        <div className="flex-1 min-w-0">
          <p className="text-lg md:text-3xl font-black text-black tracking-tight truncate">
            {formatText(transaction.description || '')}
          </p>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            {transaction.txn_date ? formatDate(transaction.txn_date) : ''}
          </span>
        </div>

        <div className="text-right flex-shrink-0 ml-4">
          <p className={`text-base md:text-2xl font-mono font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-black'}`}>
            {getTypeSymbol(transaction.type || '')}₹
            {(transaction.amount || 0).toLocaleString('en-IN', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mt-0.5">
            {transaction.category}{account ? ` · ${account.name}` : ''}
          </p>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div
          className="px-5 pb-4 pt-0 border-t flex items-center justify-between"
          style={{ borderColor: colour ? `${colour}30` : '#e5e7eb' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex flex-wrap gap-2 py-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-black bg-white px-2.5 py-1 rounded-[6px]">
              {transaction.type}
            </span>
            {transaction.category && (
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-[6px]"
                style={{ color: colour, backgroundColor: `${colour}15`, border: `1px solid ${colour}30` }}
              >
                {transaction.category}
              </span>
            )}
            {account && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-black bg-white px-2.5 py-1 rounded-[6px]">
                {account.name}
              </span>
            )}
            {transaction.txn_date && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-black bg-white px-2.5 py-1 rounded-[6px]">
                {formatDate(transaction.txn_date)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 ml-4">
            {onEdit && (
              <button
                onClick={() => onEdit(transaction)}
                className="flex items-center p-2 rounded-full text-md font-bold text-black hover:bg-black hover:text-white"
              >
                <Pencil size={12} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={async () => {
                  await deleteTransaction(transaction.id)
                  onDelete()
                }}
                className="flex items-center p-2 rounded-full text-md font-bold text-red-600 hover:bg-red-600 hover:text-white"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
