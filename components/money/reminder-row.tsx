'use client'

import type { Reminder, Bill } from '@/lib/types'
import { markReminderDone } from '@/lib/actions/money'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CustomToast } from '@/components/toastMessage'

interface ReminderRowProps {
  reminder: Reminder
  bill?: Bill
}

export function ReminderRow({ reminder, bill }: ReminderRowProps) {
  const router = useRouter()

  const handleToggle = async () => {
    try {
      await markReminderDone(reminder.id)
      toast.custom(() => (
        <CustomToast type="success" title="Reminder done" message="Marked as complete." />
      ))
      router.refresh()
    } catch (error) {
      toast.custom(() => (
        <CustomToast
          type="error"
          title="Failed to update"
          message={error instanceof Error ? error.message : 'Something went wrong'}
        />
      ))
    }
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-[--border] last:border-0 hover:bg-[--card-hover] -mx-4 px-4 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <input
          type="checkbox"
          checked={reminder.is_done || false}
          onChange={handleToggle}
          className="w-4 h-4 rounded border-[--border]"
        />
        <div>
          <p className="text-sm font-medium text-[--text-primary]">
            {reminder.title}
          </p>
          {bill && (
            <p className="text-xs text-[--text-secondary] mt-0.5">
              Linked to: {bill.name}
            </p>
          )}
        </div>
      </div>
      <span className="text-xs text-[--text-secondary] font-mono">
        {reminder.remind_on}
      </span>
    </div>
  )
}
