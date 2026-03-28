'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { AddGoalDialog } from '@/components/money/add-goal-dialog'

interface ProvisionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: Goal | null
  accounts: Account[]
  goals?: Goal[]
  onSuccess?: () => void
}

export function ProvisionDialog({ open, onOpenChange, goal, accounts, goals, onSuccess }: ProvisionDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState(0)
  const [amountStr, setAmountStr] = useState('')
  const [accountId, setAccountId] = useState(accounts[0]?.id || '')
  const [goalId, setGoalId] = useState(goal?.id || '')

  const [showGoalDialog, setShowGoalDialog] = useState(false)
  const [localGoals, setLocalGoals] = useState<Goal[]>(goals || [])

  useEffect(() => {
    setLocalGoals(goals || [])
  }, [goals])

  useEffect(() => {
    if (goal) {
      setGoalId(goal.id)
    } else if (localGoals && localGoals.length > 0 && !goalId) {
      setGoalId(localGoals[0].id)
    }
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id)
    }
    if (open) {
      setAmountStr('')
      setAmount(0)
    }
  }, [goal, localGoals, accounts, open, goalId, accountId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!goalId) throw new Error("Please select a goal")
      await provisionToGoal(goalId, amount, accountId)
      const targetName = goal?.name || localGoals?.find(g => g.id === goalId)?.name || 'Goal'
      toast.custom(() => (
        <CustomToast type="success" title="Money added" message={`₹${amount.toLocaleString('en-IN')} added to ${targetName}.`} />
      ))
      onOpenChange(false)
      setAmount(0)
      setAmountStr('')
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
      <DialogContent className="bg-[#FCF9F5] border border-gray-200 rounded-[6px] shadow-md p-5 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {goal ? `Add Money to ${goal.name}` : 'Provision Money to Goal'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {!goal && (
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">Target Goal</label>
              <Select
                value={goalId}
                onValueChange={(value) => {
                  if (value === '__create_new__') {
                    setShowGoalDialog(true)
                  } else {
                    setGoalId(value)
                  }
                }}
              >
                <SelectTrigger className="bg-white border-2 border-gray-300 h-9 text-sm rounded-[6px]">
                  <SelectValue placeholder="Select a goal" />
                </SelectTrigger>
                <SelectContent>
                  {localGoals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="__create_new__" className="font-semibold text-blue-600">
                    + Create new goal
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">Amount</label>
            <Input
              type="number"
              step="1"
              min="0"
              value={amountStr}
              onChange={(e) => {
                setAmountStr(e.target.value)
                const val = parseInt(e.target.value)
                setAmount(isNaN(val) ? 0 : val)
              }}
              placeholder="0"
              className="bg-white border-2 border-gray-300 focus:border-black h-9 text-sm rounded-[6px] font-mono"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">Source Account</label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="bg-white border-2 border-gray-300 h-9 text-sm rounded-[6px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accounts.length === 0 && (
                  <SelectItem value="__empty__" disabled className="text-gray-400 text-xs">No accounts yet</SelectItem>
                )}
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} (₹{(account.balance || 0).toLocaleString('en-IN')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-8 px-3 text-sm text-red-600 hover:bg-red-600 hover:text-white rounded-[6px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-black text-white hover:bg-green-900 h-8 px-4 text-sm font-medium rounded-[6px] shadow-none"
            >
              {loading ? 'Adding...' : 'Add Money'}
            </Button>
          </div>
        </form>
      </DialogContent>
      <AddGoalDialog
        open={showGoalDialog}
        onOpenChange={setShowGoalDialog}
        accounts={accounts}
        onSuccess={(newGoal: Goal) => {
          setLocalGoals(prev => [...prev, newGoal])
          setGoalId(newGoal.id)
          router.refresh()
        }}
      />
    </Dialog>
  )
}
