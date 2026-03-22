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
import { addTransaction, updateTransaction } from '@/lib/actions/money'
import { toast } from 'sonner'
import { CustomToast } from '@/components/toastMessage'
import type { NewTransaction, Transaction, Account, Goal, TransactionType, TransactionCategory } from '@/lib/types'
import { CreateCategoryDialog } from '@/components/money/create-category-dialog'
import { AddGoalDialog } from '@/components/money/add-goal-dialog'
import * as LucideIcons from 'lucide-react'

interface AddTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  goals?: Goal[]
  categories?: TransactionCategory[]
  onCategoryAdded?: () => void
  existingTransaction?: Transaction | null
  onSuccess?: () => void
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  accounts,
  goals = [],
  categories = [],
  onCategoryAdded,
  existingTransaction,
  onSuccess,
}: AddTransactionDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showGoalDialog, setShowGoalDialog] = useState(false)
  const [formData, setFormData] = useState<NewTransaction>({
    account_id: '',
    goal_id: null,
    amount: 0,
    type: existingTransaction?.type || 'expense',
    category: existingTransaction?.category || '',
    description: existingTransaction?.description || '',
    txn_date: existingTransaction?.txn_date || new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (open) {
      if (existingTransaction) {
        setFormData({
          account_id: existingTransaction.account_id,
          goal_id: existingTransaction.goal_id,
          amount: existingTransaction.amount,
          type: existingTransaction.type,
          category: existingTransaction.category,
          description: existingTransaction.description,
          txn_date: existingTransaction.txn_date || new Date().toISOString().split('T')[0],
        })
      } else {
        setFormData({
          account_id: accounts[0]?.id || '',
          goal_id: null,
          amount: 0,
          type: 'expense',
          category: '',
          description: '',
          txn_date: new Date().toISOString().split('T')[0],
        })
      }
    }
  }, [open, existingTransaction, accounts])

  useEffect(() => {
    if (accounts.length > 0 && !formData.account_id) {
      setFormData((prev) => ({ ...prev, account_id: accounts[0].id }))
    }
  }, [accounts, formData.account_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const dataToSubmit = { ...formData }
      if (dataToSubmit.type === 'provision') {
        dataToSubmit.category = 'Provision'
      }

      if (existingTransaction) {
        await updateTransaction(existingTransaction.id, dataToSubmit)
        toast.custom(() => (
          <CustomToast type="success" title="Transaction updated" message="Your transaction has been updated." />
        ))
      } else {
        await addTransaction(dataToSubmit)
        toast.custom(() => (
          <CustomToast type="success" title="Transaction added" message="Your transaction has been recorded." />
        ))
      }
      onSuccess?.()
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
          <DialogTitle className="text-base font-medium">{existingTransaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
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
            {formData.type !== 'provision' && (
              <div className="flex-1">
                <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Category</Label>
                <Select
                  value={formData.category || ''}
                  onValueChange={(value) => {
                    if (value === '__create_new__') {
                      setShowCategoryDialog(true)
                    } else {
                      setFormData({ ...formData, category: value })
                    }
                  }}
                >
                  <SelectTrigger className="bg-white border-[--border] h-9 text-sm rounded-[8px]">
                    <SelectValue placeholder="Select or create..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => {
                      const IconComp = (LucideIcons as any)[cat.icon || 'Tag'] || LucideIcons.Tag
                      return (
                        <SelectItem key={cat.name} value={cat.name}>
                          <div className="flex items-center gap-2">
                            <IconComp className="w-4 h-4" style={{ color: cat.color || 'inherit' }} />
                            {cat.name}
                          </div>
                        </SelectItem>
                      )
                    })}
                    <SelectItem value="__create_new__" className="font-semibold text-blue-600">
                      + Create new category
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
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

          {formData.type === 'provision' && (
            <div>
              <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Goal</Label>
              <Select
                value={formData.goal_id || ''}
                onValueChange={(value) => {
                  if (value === '__create_new__') {
                    setShowGoalDialog(true)
                  } else {
                    setFormData({ ...formData, goal_id: value || null })
                  }
                }}
              >
                <SelectTrigger className="bg-white border-[--border] h-9 text-sm rounded-[8px]">
                  <SelectValue placeholder="Select or create a goal..." />
                </SelectTrigger>
                <SelectContent>
                  {goals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>{goal.name}</SelectItem>
                  ))}
                  <SelectItem value="__create_new__" className="font-semibold text-blue-600">
                    + Create new goal
                  </SelectItem>
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
              {loading ? (existingTransaction ? 'Updating...' : 'Adding...') : (existingTransaction ? 'Update Transaction' : 'Add Transaction')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <CreateCategoryDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        onSuccess={() => {
          if (onCategoryAdded) onCategoryAdded()
        }}
      />
      <AddGoalDialog
        open={showGoalDialog}
        onOpenChange={setShowGoalDialog}
        accounts={accounts}
      />
    </Dialog>
  )
}
