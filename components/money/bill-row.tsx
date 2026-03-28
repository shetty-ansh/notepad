'use client'

import type { Bill, Account } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface BillRowProps {
  bill: Bill
  account?: Account
  onMarkPaid: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function BillRow({ bill, account, onMarkPaid, onEdit, onDelete }: BillRowProps) {
  const now = new Date()
  const dueDate = bill.next_due_date ? new Date(bill.next_due_date) : null

  let timeBg = ''
  if (dueDate) {
    const diff = dueDate.getTime() - now.getTime()
    const daysLeft = diff / (1000 * 60 * 60 * 24)
    if (daysLeft < 0) {
      timeBg = 'bg-red-100'
    } else if (daysLeft <= 3) {
      timeBg = 'bg-yellow-100'
    }
  }

  return (
    <div className={`border border-grey-900 border-2 rounded-[6px] p-4 ${timeBg}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <h3 className="text-base md:text-2xl font-bold text-black truncate">
            {bill.name}
          </h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-600">
            {bill.category}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-blue-50 text-blue-600">
            {bill.frequency}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="text-black hover:text-white hover:bg-black p-2 rounded-full"
              title="Edit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="text-red-600 hover:text-white hover:bg-red-600 p-2 rounded-full"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mb-1">
        <span className="text-sm md:text-lg font-mono font-semibold">
          ₹{(bill.amount || 0).toLocaleString('en-IN')}
        </span>
        {bill.next_due_date && (
          <p className="text-sm text-black font-mono">
            Due: {formatDate(bill.next_due_date)}
          </p>
        )}
      </div>

      {account && (
        <p className="text-xs text-[--text-secondary] mb-3">
          {account.name}
        </p>
      )}

      <Button
        onClick={onMarkPaid}
        className="w-full bg-black text-white hover:bg-green-900 h-8 text-sm font-medium rounded-[8px] shadow-none"
      >
        Mark Paid
      </Button>
    </div>
  )
}
