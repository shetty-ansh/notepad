import type { Ledger } from '@/lib/types'
import { Button } from '@/components/ui/button'

interface LedgerRowProps {
  entry: Ledger
  onSettle: () => void
}

export function LedgerRow({ entry, onSettle }: LedgerRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[--border] last:border-0 hover:bg-[--card-hover] -mx-4 px-4 transition-colors">
      <div className="flex-1">
        <p className="text-sm font-medium text-[--text-primary]">
          {entry.person_name}
        </p>
        <p className="text-xs text-[--text-secondary] mt-0.5">
          {entry.description}
        </p>
        {entry.due_date && (
          <p className="text-xs text-[--text-tertiary] mt-0.5 font-mono">
            Due: {entry.due_date}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-mono font-medium text-[--text-primary]">
          ₹
          {(entry.amount || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
        {entry.status === 'pending' && (
          <Button
            onClick={onSettle}
            className="h-7 px-2 text-xs bg-[--accent] text-[--accent-foreground] hover:bg-[--accent-hover] rounded-[--radius-md] shadow-none"
          >
            Settle
          </Button>
        )}
      </div>
    </div>
  )
}
