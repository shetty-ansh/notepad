'use client'

import { useState, useEffect } from 'react'
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
        target_date: goalToEdit.target_date,
        icon: goalToEdit.icon,
        account_id: goalToEdit.account_id,
        status: goalToEdit.status,
      })
    } else if (!open) {
      setFormData({ name: '', target_amount: 0, target_date: null, icon: '🎯', account_id: null, status: 'active' })
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
      <DialogContent className="bg-[#FCF9F5] border border-[--border] rounded-[12px] shadow-md p-6 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">{goalToEdit ? 'Edit Goal' : 'Add Goal'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-white border-[--border] focus:border-[--border-strong] h-9 text-sm rounded-[8px]"
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Target Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.target_amount || 0}
                onChange={(e) => setFormData({ ...formData, target_amount: parseFloat(e.target.value) })}
                className="bg-white border-[--border] focus:border-[--border-strong] h-9 text-sm rounded-[8px] font-mono"
                required
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Target Date (Optional)</Label>
              <Input
                type="date"
                value={formData.target_date || ''}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value || null })}
                className="bg-white border-[--border] focus:border-[--border-strong] h-9 text-sm rounded-[8px]"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Icon</Label>
              <Input
                value={formData.icon || ''}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="bg-white border-[--border] focus:border-[--border-strong] h-9 text-sm rounded-[8px]"
                placeholder="🎯"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Account (Optional)</Label>
              <Select
                value={formData.account_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, account_id: value === 'none' ? null : value })}
              >
                <SelectTrigger className="bg-white border-[--border] h-9 text-sm rounded-[8px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              {loading ? (goalToEdit ? 'Saving...' : 'Adding...') : (goalToEdit ? 'Save Changes' : 'Add Goal')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
