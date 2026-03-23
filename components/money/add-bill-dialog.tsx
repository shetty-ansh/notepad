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
import { addBill, updateBill } from '@/lib/actions/money'
import { toast } from 'sonner'
import { CustomToast } from '@/components/toastMessage'
import type { NewBill, Account, BillFrequency, Bill } from '@/lib/types'

interface AddBillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  billToEdit?: Bill | null
  onSuccess?: (bill: Bill, isEdit: boolean) => void
}

export function AddBillDialog({ open, onOpenChange, accounts, billToEdit, onSuccess }: AddBillDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<NewBill>({
    name: '',
    amount: 0,
    frequency: 'monthly',
    next_due_date: new Date().toISOString().split('T')[0],
    account_id: accounts[0]?.id || null,
    category: '',
    auto_pay: false,
    is_active: true,
  })

  useEffect(() => {
    if (billToEdit && open) {
      setFormData({
        name: billToEdit.name,
        amount: billToEdit.amount,
        frequency: billToEdit.frequency as BillFrequency,
        next_due_date: billToEdit.next_due_date || new Date().toISOString().split('T')[0],
        account_id: billToEdit.account_id,
        category: billToEdit.category,
        auto_pay: billToEdit.auto_pay,
        is_active: billToEdit.is_active,
      })
    } else if (!open) {
      setFormData({
        name: '',
        amount: 0,
        frequency: 'monthly',
        next_due_date: new Date().toISOString().split('T')[0],
        account_id: accounts[0]?.id || null,
        category: '',
        auto_pay: false,
        is_active: true,
      })
    }
  }, [billToEdit, open, accounts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let result: Bill
      if (billToEdit) {
        result = await updateBill(billToEdit.id, formData)
        toast.custom(() => (
          <CustomToast type="success" title="Bill updated" message="Your bill has been updated." />
        ))
      } else {
        result = await addBill(formData)
        toast.custom(() => (
          <CustomToast type="success" title="Bill added" message="Your bill has been saved." />
        ))
      }
      
      if (onSuccess) onSuccess(result, !!billToEdit)
      onOpenChange(false)
      if (!onSuccess) router.refresh()
    } catch (error) {
      toast.custom(() => (
        <CustomToast
          type="error"
          title={`Failed to ${billToEdit ? 'update' : 'add'} bill`}
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
          <DialogTitle className="text-base font-medium">{billToEdit ? 'Edit Bill' : 'Add Bill'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white border-[--border] focus:border-[--border-strong] h-9 text-sm rounded-[8px]"
                required
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Category</Label>
              <Input
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="bg-white border-[--border] focus:border-[--border-strong] h-9 text-sm rounded-[8px]"
                required
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount || 0}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="bg-white border-[--border] focus:border-[--border-strong] h-9 text-sm rounded-[8px] font-mono"
                required
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Frequency</Label>
              <Select
                value={formData.frequency || 'monthly'}
                onValueChange={(value) => setFormData({ ...formData, frequency: value as BillFrequency })}
              >
                <SelectTrigger className="bg-white border-[--border] h-9 text-sm rounded-[8px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="once">Once</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Next Due Date</Label>
              <Input
                type="date"
                value={formData.next_due_date || ''}
                onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                className="bg-white border-[--border] focus:border-[--border-strong] h-9 text-sm rounded-[8px]"
                required
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Account</Label>
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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto_pay"
              checked={formData.auto_pay || false}
              onChange={(e) => setFormData({ ...formData, auto_pay: e.target.checked })}
              className="w-4 h-4 rounded border-[--border]"
            />
            <Label htmlFor="auto_pay" className="text-xs font-medium text-[--text-secondary]">
              Auto Pay
            </Label>
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
              {loading ? (billToEdit ? 'Saving...' : 'Adding...') : (billToEdit ? 'Save Changes' : 'Add Bill')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
