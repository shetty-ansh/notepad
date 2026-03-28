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
import { addGoal, updateGoal } from '@/lib/actions/money'
import { toast } from 'sonner'
import { CustomToast } from '@/components/toastMessage'
import type { NewGoal, Account, Goal } from '@/lib/types'

interface AddGoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  goalToEdit?: Goal | null
  onSuccess?: (goal: Goal, isEdit: boolean) => void
}

export function AddGoalDialog({ open, onOpenChange, accounts, goalToEdit, onSuccess }: AddGoalDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [amountStr, setAmountStr] = useState('')
  const [formData, setFormData] = useState<NewGoal>({
    name: '',
    target_amount: 0,
    target_date: null,
    icon: '🎯',
    account_id: null,
    status: 'active',
  })

  useEffect(() => {
    if (goalToEdit && open) {
      setFormData({
        name: goalToEdit.name,
        target_amount: goalToEdit.target_amount,
        target_date: goalToEdit.target_date || '',
        icon: goalToEdit.icon || '',
        status: goalToEdit.status || 'active',
        account_id: null
      })
      setAmountStr(goalToEdit.target_amount ? String(goalToEdit.target_amount) : '')
    } else if (!open) {
      setFormData({
        name: '',
        target_amount: 0,
        target_date: '',
        icon: '',
        status: 'active',
        account_id: null
      })
      setAmountStr('')
    }
  }, [goalToEdit, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let result: Goal
      if (goalToEdit) {
        result = await updateGoal(goalToEdit.id, formData)
        toast.custom(() => (
          <CustomToast type="success" title="Goal updated" message="Your savings goal has been updated." />
        ))
      } else {
        result = await addGoal(formData)
        toast.custom(() => (
          <CustomToast type="success" title="Goal created" message="Your savings goal has been added." />
        ))
      }

      if (onSuccess) onSuccess(result, !!goalToEdit)
      onOpenChange(false)
      if (!onSuccess) router.refresh()
    } catch (error) {
      toast.custom(() => (
        <CustomToast
          type="error"
          title={`Failed to ${goalToEdit ? 'update' : 'add'} goal`}
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
          <DialogTitle className="text-lg font-bold">{goalToEdit ? 'Edit Goal' : 'Add Goal'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. New Laptop"
              className="bg-white border-2 border-gray-300 focus:border-black h-9 text-sm rounded-[6px]"
              required
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">Target Amount</label>
              <Input
                type="number"
                step="1"
                min="0"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value)
                  const val = parseInt(e.target.value)
                  setFormData({ ...formData, target_amount: isNaN(val) ? 0 : val })
                }}
                placeholder="0"
                className="bg-white border-2 border-gray-300 focus:border-black h-9 text-sm rounded-[6px] font-mono"
                required
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">Target Date</label>
              <Input
                type="date"
                value={formData.target_date || ''}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value || null })}
                className="bg-white border-2 border-gray-300 focus:border-black h-9 text-sm rounded-[6px]"
              />
            </div>
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
              {loading ? (goalToEdit ? 'Saving...' : 'Adding...') : (goalToEdit ? 'Save Changes' : 'Add Goal')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
