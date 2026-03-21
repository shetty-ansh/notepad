import type { Bill, Account } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { MoreVertical } from 'lucide-react'

interface BillRowProps {
  bill: Bill
  account?: Account
  onMarkPaid: () => void
}

export function BillRow({ bill, account, onMarkPaid }: BillRowProps) {
  const isOverdueOrSoon = () => {
    if (!bill.next_due_date) return false
    const dueDate = new Date(bill.next_due_date)
    const today = new Date()
    const diffDays = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
    return diffDays <= 3
  }

  const isDanger = isOverdueOrSoon()

  return (
    <div className="flex items-center justify-between py-3 border-b border-[--border] last:border-0 hover:bg-[--card-hover] -mx-4 px-4 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-[--text-primary]">
            {bill.name}
          </p>
          <span className="inline-flex items-center px-2 py-0.5 rounded-[--radius-sm] text-[11px] font-medium bg-[--background-muted] text-[--text-secondary]">
            {bill.category}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-[--radius-sm] text-[11px] font-medium bg-[--accent-subtle] text-[--accent]">
            {bill.frequency}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          {account && (
            <span className="text-xs text-[--text-secondary]">
              {account.name}
            </span>
          )}
          <span
            className={`text-xs font-mono ${isDanger ? 'text-[--danger]' : 'text-[--text-secondary]'}`}
          >
            Due: {bill.next_due_date}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-mono font-medium text-[--text-primary]">
          ₹
          {(bill.amount || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-[--text-secondary] hover:text-[--text-primary]"
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
