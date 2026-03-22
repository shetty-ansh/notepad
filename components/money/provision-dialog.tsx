'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { provisionToGoal } from '@/lib/actions/money'
import { toast } from 'sonner'
import { CustomToast } from '@/components/toastMessage'
import type { Account, Goal } from '@/lib/types'

interface ProvisionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: Goal
  accounts: Account[]
  onSuccess?: () => void
}

export function ProvisionDialog({ open, onOpenChange, goal, accounts, onSuccess }: ProvisionDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState(0)
  const [accountId, setAccountId] = useState(accounts[0]?.id || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await provisionToGoal(goal.id, amount, accountId)
      toast.custom(() => (
        <CustomToast type="success" title="Money added" message={`₹${amount.toLocaleString('en-IN')} added to ${goal.name}.`} />
      ))
      onOpenChange(false)
      setAmount(0)
      onSuccess?.()
      router.refresh()
    } catch (error) {
      toast.custom(() => (
        <CustomToast
          type="error"
          title="Failed to add money"
          message={error instanceof Error ? error.message : 'Something went wrong'}
        />
      ))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FCF9F5] border border-[--border] rounded-[12px] shadow-md p-6 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">
            Add Money to {goal.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Amount</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              className="bg-white border-[--border] focus:border-[--border-strong] h-9 text-sm rounded-[8px] font-mono"
              required
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Source Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="bg-white border-[--border] h-9 text-sm rounded-[8px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} (₹{(account.balance || 0).toLocaleString('en-IN')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-8 px-3 text-sm text-red-600 hover:bg-red-600 hover:text-white rounded-[8px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-black text-white hover:bg-green-900 h-8 px-3 text-sm font-medium rounded-[8px] shadow-none"
            >
              {loading ? 'Adding...' : 'Add Money'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
