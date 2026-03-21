'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  getAccounts,
  getBills,
  getReminders,
  markBillPaid,
} from '@/lib/actions/money'
import { BillRow } from '@/components/money/bill-row'
import { ReminderRow } from '@/components/money/reminder-row'
import { AddBillDialog } from '@/components/money/add-bill-dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { CustomToast } from '@/components/toastMessage'
import type { Account, Bill, Reminder } from '@/lib/types'

export default function BillsPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [billDialogOpen, setBillDialogOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [accountsData, billsData, remindersData] = await Promise.all([
      getAccounts(),
      getBills(),
      getReminders(),
    ])
    setAccounts(accountsData)
    setBills(billsData)
    setReminders(remindersData)
  }

  const handleMarkPaid = async (billId: string) => {
    try {
      await markBillPaid(billId)
      toast.custom(() => (
        <CustomToast type="success" title="Bill paid" message="Due date has been advanced." />
      ))
      router.refresh()
      loadData()
    } catch (error) {
      toast.custom(() => (
        <CustomToast
          type="error"
          title="Failed to mark paid"
          message={error instanceof Error ? error.message : 'Something went wrong'}
        />
      ))
    }
  }

  const upcomingReminders = reminders.filter((r) => !r.is_done)

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between h-14 px-6 border-b border-[--border] shrink-0">
        <h1 className="text-[20px] font-medium">Bills & Reminders</h1>
        <Button
          onClick={() => setBillDialogOpen(true)}
          className="bg-[--accent] text-[--accent-foreground] hover:bg-[--accent-hover] h-8 px-3 text-sm font-medium rounded-[--radius-md] shadow-none"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Bill
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Bills Section */}
        <div>
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary] mb-3">
            Active Bills
          </h2>
          {bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-[--card] border border-[--border] rounded-[--radius-lg]">
              <p className="text-sm font-medium text-[--text-secondary]">
                No bills yet
              </p>
              <p className="text-xs text-[--text-tertiary] mt-1">
                Add one to get started
              </p>
              <Button
                onClick={() => setBillDialogOpen(true)}
                className="mt-4 bg-[--accent] text-[--accent-foreground] hover:bg-[--accent-hover] h-8 px-3 text-sm font-medium rounded-[--radius-md] shadow-none"
              >
                Add Bill
              </Button>
            </div>
          ) : (
            <div className="bg-[--card] border border-[--border] rounded-[--radius-lg] p-4">
              {bills.map((bill) => {
                const account = accounts.find(
                  (acc) => acc.id === bill.account_id
                )
                return (
                  <BillRow
                    key={bill.id}
                    bill={bill}
                    account={account}
                    onMarkPaid={() => handleMarkPaid(bill.id)}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Reminders Section */}
        {upcomingReminders.length > 0 && (
          <div>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary] mb-3">
              Upcoming Reminders
            </h2>
            <div className="bg-[--card] border border-[--border] rounded-[--radius-lg] p-4">
              {upcomingReminders.map((reminder) => {
                const bill = bills.find((b) => b.id === reminder.bill_id)
                return (
                  <ReminderRow
                    key={reminder.id}
                    reminder={reminder}
                    bill={bill}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>

      <AddBillDialog
        open={billDialogOpen}
        onOpenChange={setBillDialogOpen}
        accounts={accounts}
      />
    </div>
  )
}
