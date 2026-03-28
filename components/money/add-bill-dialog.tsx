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
  const [amountStr, setAmountStr] = useState('')
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
      setAmountStr(billToEdit.amount ? String(billToEdit.amount) : '')
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
      setAmountStr('')
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

  const frequencies: { value: BillFrequency; label: string }[] = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'once', label: 'Once' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FCF9F5] border border-gray-200 rounded-[6px] shadow-md p-5 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{billToEdit ? 'Edit Bill' : 'Add Bill'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Netflix"
                className="bg-white border-2 border-gray-300 focus:border-black h-9 text-sm rounded-[6px]"
                required
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">Category</label>
              <Input
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Subscription"
                className="bg-white border-2 border-gray-300 focus:border-black h-9 text-sm rounded-[6px]"
                required
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">Amount</label>
              <Input
                type="number"
                step="1"
                min="0"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value)
                  const val = parseInt(e.target.value)
                  setFormData({ ...formData, amount: isNaN(val) ? 0 : val })
                }}
                placeholder="0"
                className="bg-white border-2 border-gray-300 focus:border-black h-9 text-sm rounded-[6px] font-mono"
                required
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">Frequency</label>
              <div className="flex bg-gray-100 rounded-[6px] p-0.5 gap-0.5">
                {frequencies.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, frequency: f.value })}
                    className={`flex-1 px-1 py-1.5 text-[10px] font-medium rounded-[4px] transition-all ${
                      formData.frequency === f.value
                        ? 'bg-black text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">Next Due Date</label>
              <Input
                type="date"
                value={formData.next_due_date || ''}
                onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                className="bg-white border-2 border-gray-300 focus:border-black h-9 text-sm rounded-[6px]"
                required
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">Account</label>
              <Select
                value={formData.account_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, account_id: value === 'none' ? null : value })}
              >
                <SelectTrigger className="bg-white border-2 border-gray-300 h-9 text-sm rounded-[6px]">
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
              className="w-4 h-4 rounded border-2 border-gray-300 accent-black"
            />
            <label htmlFor="auto_pay" className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary]">
              Auto Pay
            </label>
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
              {loading ? (billToEdit ? 'Saving...' : 'Adding...') : (billToEdit ? 'Save Changes' : 'Add Bill')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
