'use client'

import type { Ledger } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface LedgerRowProps {
  entry: Ledger
  onSettle: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function LedgerRow({ entry, onSettle, onEdit, onDelete }: LedgerRowProps) {
  const now = new Date()
  const dueDate = entry.due_date ? new Date(entry.due_date) : null

  let timeBg = ''
  if (dueDate) {
    const diff = dueDate.getTime() - now.getTime()
    const daysLeft = diff / (1000 * 60 * 60 * 24)
    if (daysLeft < 0) {
      timeBg = 'bg-red-100'
    } else if (daysLeft <= 7) {
      timeBg = 'bg-yellow-100'
    }
  }

  const directionLabel = entry.direction === 'i_owe' ? 'I Owe' : 'They Owe Me'
  const directionColor =
    entry.direction === 'i_owe'
      ? 'bg-red-100 text-red-700'
      : 'bg-green-100 text-green-700'

  return (
    <div className={`border border-grey-900 border-2 rounded-[6px] p-4 ${timeBg}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-base md:text-2xl font-bold text-black truncate">
            {entry.person_name}
          </h3>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${directionColor}`}>
            {directionLabel}
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

      {entry.description && (
        <p className="text-xs text-[--text-secondary] mb-3 line-clamp-2">
          {entry.description}
        </p>
      )}

      <div className="flex justify-between items-center mb-3">
        <span className="text-sm md:text-lg font-mono font-semibold">
          ₹{(entry.amount || 0).toLocaleString('en-IN')}
        </span>
        {entry.due_date && (
          <p className="text-sm text-black font-mono">
            Due: {formatDate(entry.due_date)}
          </p>
        )}
      </div>

      {entry.status === 'pending' && (
        <Button
          onClick={onSettle}
          className="w-full bg-black text-white hover:bg-green-900 h-8 text-sm font-medium rounded-[8px] shadow-none"
        >
          Settle
        </Button>
      )}

      {entry.status === 'settled' && (
        <div className="w-full h-8 flex items-center justify-center text-sm font-medium text-green-700 bg-green-50 rounded-[8px]">
          Settled ✓
        </div>
      )}
    </div>
  )
}
