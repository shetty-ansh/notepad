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
import { addTransaction } from '@/lib/actions/money'
import { toast } from 'sonner'
import { CustomToast } from '@/components/toastMessage'
import type { NewTransaction, Account, Goal, TransactionType } from '@/lib/types'

interface AddTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  goals?: Goal[]
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  accounts,
  goals = [],
}: AddTransactionDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<NewTransaction>({
    account_id: '',
    goal_id: null,
    amount: 0,
    type: 'expense',
    category: '',
    description: '',
    txn_date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (accounts.length > 0 && !formData.account_id) {
      setFormData((prev) => ({ ...prev, account_id: accounts[0].id }))
    }
  }, [accounts, formData.account_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await addTransaction(formData)
      toast.custom(() => (
        <CustomToast type="success" title="Transaction added" message="Your transaction has been recorded." />
      ))
      onOpenChange(false)
      setFormData({
        account_id: accounts[0]?.id || '',
        goal_id: null,
        amount: 0,
        type: 'expense',
        category: '',
        description: '',
        txn_date: new Date().toISOString().split('T')[0],
      })
      router.refresh()
    } catch (error) {
      toast.custom(() => (
        <CustomToast
          type="error"
          title="Failed to add transaction"
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
          <DialogTitle className="text-base font-medium">Add Transaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Description</Label>
            <Input
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-white border-[--border] focus:border-[--border-strong] h-9 text-sm rounded-[8px]"
              required
            />
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
              <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Date</Label>
              <Input
                type="date"
                value={formData.txn_date || ''}
                onChange={(e) => setFormData({ ...formData, txn_date: e.target.value })}
                className="bg-white border-[--border] focus:border-[--border-strong] h-9 text-sm rounded-[8px]"
                required
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Type</Label>
              <Select
                value={formData.type || 'expense'}
                onValueChange={(value) => setFormData({ ...formData, type: value as TransactionType })}
              >
                <SelectTrigger className="bg-white border-[--border] h-9 text-sm rounded-[8px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="provision">Provision</SelectItem>
                </SelectContent>
              </Select>
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

          <div>
            <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Account</Label>
            <Select
              value={formData.account_id || ''}
              onValueChange={(value) => setFormData({ ...formData, account_id: value })}
            >
              <SelectTrigger className="bg-white border-[--border] h-9 text-sm rounded-[8px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.type === 'provision' && goals.length > 0 && (
            <div>
              <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Goal</Label>
              <Select
                value={formData.goal_id || ''}
                onValueChange={(value) => setFormData({ ...formData, goal_id: value || null })}
              >
                <SelectTrigger className="bg-white border-[--border] h-9 text-sm rounded-[8px]">
                  <SelectValue placeholder="Select a goal" />
                </SelectTrigger>
                <SelectContent>
                  {goals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>{goal.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
              {loading ? 'Adding...' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
