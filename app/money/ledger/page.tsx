'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getLedger, settleLedgerEntry } from '@/lib/actions/money'
import { LedgerRow } from '@/components/money/ledger-row'
import { AddLedgerDialog } from '@/components/money/add-ledger-dialog'
import { Button } from '@/components/ui/button'
import { Plus, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { CustomToast } from '@/components/toastMessage'
import type { Ledger } from '@/lib/types'

export default function LedgerPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<Ledger[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [settledOpen, setSettledOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const data = await getLedger()
    setEntries(data)
  }

  const handleSettle = async (id: string) => {
    try {
      await settleLedgerEntry(id)
      toast.custom(() => (
        <CustomToast type="success" title="Entry settled" message="Ledger entry marked as settled." />
      ))
      router.refresh()
      loadData()
    } catch (error) {
      toast.custom(() => (
        <CustomToast
          type="error"
          title="Failed to settle"
          message={error instanceof Error ? error.message : 'Something went wrong'}
        />
      ))
    }
  }

  const iOweEntries = entries.filter(
    (e) => e.direction === 'i_owe' && e.status === 'pending'
  )
  const theyOweEntries = entries.filter(
    (e) => e.direction === 'they_owe' && e.status === 'pending'
  )
  const settledEntries = entries.filter((e) => e.status === 'settled')

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between h-14 px-6 border-b border-[--border] shrink-0">
        <h1 className="text-[20px] font-medium">Ledger</h1>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-[--accent] text-[--accent-foreground] hover:bg-[--accent-hover] h-8 px-3 text-sm font-medium rounded-[--radius-md] shadow-none"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Entry
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-[--text-secondary]">
              No ledger entries yet
            </p>
            <p className="text-xs text-[--text-tertiary] mt-1">
              Add one to get started
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="mt-4 bg-[--accent] text-[--accent-foreground] hover:bg-[--accent-hover] h-8 px-3 text-sm font-medium rounded-[--radius-md] shadow-none"
            >
              Add Entry
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* I Owe Section */}
            <div>
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary] mb-3">
                I Owe
              </h2>
              {iOweEntries.length === 0 ? (
                <div className="bg-[--card] border border-[--border] rounded-[--radius-lg] p-8 text-center">
                  <p className="text-sm text-[--text-secondary]">
                    No pending debts
                  </p>
                </div>
              ) : (
                <div className="bg-[--card] border border-[--border] rounded-[--radius-lg] p-4">
                  {iOweEntries.map((entry) => (
                    <LedgerRow
                      key={entry.id}
                      entry={entry}
                      onSettle={() => handleSettle(entry.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* They Owe Me Section */}
            <div>
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary] mb-3">
                They Owe Me
              </h2>
              {theyOweEntries.length === 0 ? (
                <div className="bg-[--card] border border-[--border] rounded-[--radius-lg] p-8 text-center">
                  <p className="text-sm text-[--text-secondary]">
                    No pending receivables
                  </p>
                </div>
              ) : (
                <div className="bg-[--card] border border-[--border] rounded-[--radius-lg] p-4">
                  {theyOweEntries.map((entry) => (
                    <LedgerRow
                      key={entry.id}
                      entry={entry}
                      onSettle={() => handleSettle(entry.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settled Entries */}
        {settledEntries.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setSettledOpen(!settledOpen)}
              className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[--text-secondary] hover:text-[--text-primary] transition-colors mb-3"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${settledOpen ? 'rotate-180' : ''}`}
              />
              Settled ({settledEntries.length})
            </button>
            {settledOpen && (
              <div className="bg-[--card] border border-[--border] rounded-[--radius-lg] p-4">
                {settledEntries.map((entry) => (
                  <LedgerRow
                    key={entry.id}
                    entry={entry}
                    onSettle={() => {}}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AddLedgerDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
