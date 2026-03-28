'use client'

import { useState, useEffect, useRef } from 'react'
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
import { addTransaction, updateTransaction, getGoals, transferMoney } from '@/lib/actions/money'
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
  transactions?: Transaction[]
  categories?: TransactionCategory[]
  onCategoryAdded?: () => void
  existingTransaction?: Transaction | null
  onSuccess?: () => void
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  accounts,
  transactions = [],
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
  const [localGoals, setLocalGoals] = useState<Goal[]>(goals)
  const [amountStr, setAmountStr] = useState('')
  const [transferToAccountId, setTransferToAccountId] = useState('')
  const [formData, setFormData] = useState<NewTransaction>({
    account_id: '',
    goal_id: null,
    amount: 0,
    type: existingTransaction?.type || 'expense',
    category: existingTransaction?.category || '',
    description: existingTransaction?.description || '',
    txn_date: existingTransaction?.txn_date || new Date().toISOString().split('T')[0],
    is_recurring: existingTransaction?.is_recurring || false,
    recurrence_interval: existingTransaction?.recurrence_interval || 'monthly',
    next_recurrence_date: existingTransaction?.next_recurrence_date || null,
  })

  useEffect(() => {
    setLocalGoals(goals)
  }, [goals])

  const hasInitialized = useRef(false)

  useEffect(() => {
    if (open && !hasInitialized.current) {
      hasInitialized.current = true
      if (existingTransaction) {
        setFormData({
          account_id: existingTransaction.account_id,
          goal_id: existingTransaction.goal_id,
          amount: existingTransaction.amount,
          type: existingTransaction.type,
          category: existingTransaction.category,
          description: existingTransaction.description,
          txn_date: existingTransaction.txn_date || new Date().toISOString().split('T')[0],
          is_recurring: existingTransaction.is_recurring || false,
          recurrence_interval: existingTransaction.recurrence_interval || 'monthly',
          next_recurrence_date: existingTransaction.next_recurrence_date || null,
        })
        setAmountStr(existingTransaction.amount ? String(existingTransaction.amount) : '')
        setTransferToAccountId('')
      } else {
        setFormData({
          account_id: accounts[0]?.id || '',
          goal_id: null,
          amount: 0,
          type: 'expense',
          category: '',
          description: '',
          txn_date: new Date().toISOString().split('T')[0],
          is_recurring: false,
          recurrence_interval: 'monthly',
          next_recurrence_date: null,
        })
        setAmountStr('')
        setTransferToAccountId('')
      }
    } else if (!open) {
      hasInitialized.current = false
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
      if (formData.type === 'transfer') {
        // Handle transfer via dedicated action
        if (!transferToAccountId) throw new Error('Please select a destination account')
        if (transferToAccountId === formData.account_id) throw new Error('Source and destination must be different')
        await transferMoney(
          formData.account_id || '',
          transferToAccountId,
          formData.amount,
          formData.description || '',
          formData.txn_date || new Date().toISOString().split('T')[0]
        )
        toast.custom(() => (
          <CustomToast type="success" title="Transfer complete" message="Money has been transferred between accounts." />
        ))
      } else {
        const dataToSubmit = { ...formData }
        if (dataToSubmit.type === 'provision') {
          dataToSubmit.category = 'Provision'
        }
        if (dataToSubmit.is_recurring) {
          dataToSubmit.next_recurrence_date = dataToSubmit.txn_date
        } else {
          dataToSubmit.recurrence_interval = null
          dataToSubmit.next_recurrence_date = null
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
        is_recurring: false,
        recurrence_interval: 'monthly',
        next_recurrence_date: null,
      })
      setAmountStr('')
      setTransferToAccountId('')
      router.refresh()
    } catch (error) {
      toast.custom(() => (
        <CustomToast
          type="error"
          title="Failed"
          message={error instanceof Error ? error.message : 'Something went wrong'}
        />
      ))
    } finally {
      setLoading(false)
    }
  }

  // Only show transfer if ≥2 accounts
  const availableTypes: { value: TransactionType; label: string }[] = [
    { value: 'expense', label: 'Expense' },
    { value: 'income', label: 'Income' },
    ...(accounts.length >= 2 ? [{ value: 'transfer' as TransactionType, label: 'Transfer' }] : []),
    { value: 'provision', label: 'Provision' },
  ]

  // For transfer: destination accounts (exclude selected source)
  const destinationAccounts = accounts.filter((a) => a.id !== formData.account_id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FCF9F5] border border-gray-200 rounded-[6px] shadow-md p-5 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{existingTransaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">Description</label>
            <Input
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={formData.type === 'transfer' ? 'e.g. Moving savings' : 'What was this for?'}
              className="bg-white border-2 border-gray-300 focus:border-black h-9 text-sm rounded-[6px]"
              required={formData.type !== 'transfer'}
            />
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
              <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">Date</label>
              <Input
                type="date"
                value={formData.txn_date || ''}
                onChange={(e) => setFormData({ ...formData, txn_date: e.target.value })}
                className="bg-white border-2 border-gray-300 focus:border-black h-9 text-sm rounded-[6px]"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">Type</label>
            <div className="flex bg-gray-100 rounded-[6px] p-0.5 gap-0.5">
              {availableTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: t.value })}
                  className={`flex-1 px-2 py-1.5 text-[11px] font-medium rounded-[4px] transition-all ${
                    formData.type === t.value
                      ? 'bg-black text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transfer: From and To accounts */}
          {formData.type === 'transfer' ? (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">From Account</label>
                <Select
                  value={formData.account_id || ''}
                  onValueChange={(value) => {
                    setFormData({ ...formData, account_id: value })
                    // Reset destination if it matches new source
                    if (transferToAccountId === value) setTransferToAccountId('')
                  }}
                >
                  <SelectTrigger className="bg-white border-2 border-gray-300 h-9 text-sm rounded-[6px]">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.length === 0 && (
                      <SelectItem value="__empty__" disabled className="text-gray-400 text-xs">No accounts yet</SelectItem>
                    )}
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.account_id && accounts.find(a => a.id === formData.account_id) && (
                  <div className="mt-1 text-[10px] text-gray-500 font-medium">
                    Avail: ₹{accounts.find(a => a.id === formData.account_id)?.balance?.toLocaleString('en-IN') || 0}
                    {" | "}
                    Free: ₹{
                      Math.max(0, (accounts.find(a => a.id === formData.account_id)?.balance || 0) -
                      (transactions?.filter(t => t.account_id === formData.account_id && t.type === 'provision').reduce((sum, t) => sum + (t.amount || 0), 0) || 0)).toLocaleString('en-IN')
                    }
                  </div>
                )}
              </div>
              <div className="flex items-end pb-2">
                <span className="text-sm text-[--text-secondary]">→</span>
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">To Account</label>
                <Select
                  value={transferToAccountId}
                  onValueChange={setTransferToAccountId}
                >
                  <SelectTrigger className="bg-white border-2 border-gray-300 h-9 text-sm rounded-[6px]">
                    <SelectValue placeholder="Destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinationAccounts.length === 0 && (
                      <SelectItem value="__empty__" disabled className="text-gray-400 text-xs">No other accounts</SelectItem>
                    )}
                    {destinationAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <>
              {formData.type !== 'provision' && (
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">Category</label>
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
                    <SelectTrigger className="bg-white border-2 border-gray-300 h-9 text-sm rounded-[6px]">
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

              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">Account</label>
                <Select
                  value={formData.account_id || ''}
                  onValueChange={(value) => setFormData({ ...formData, account_id: value })}
                >
                  <SelectTrigger className="bg-white border-2 border-gray-300 h-9 text-sm rounded-[6px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.length === 0 && (
                      <SelectItem value="__empty__" disabled className="text-gray-400 text-xs">No accounts yet</SelectItem>
                    )}
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
                  <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">Goal</label>
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
                    <SelectTrigger className="bg-white border-2 border-gray-300 h-9 text-sm rounded-[6px]">
                      <SelectValue placeholder="Select or create a goal..." />
                    </SelectTrigger>
                    <SelectContent>
                      {localGoals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>{goal.name}</SelectItem>
                      ))}
                      <SelectItem value="__create_new__" className="font-semibold text-blue-600">
                        + Create new goal
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(formData.type === 'income' || formData.type === 'expense') && (
                <div className="flex items-center justify-between border-t border-gray-200 pt-3 mt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      checked={formData.is_recurring || false}
                      onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                    />
                    <label htmlFor="isRecurring" className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary] cursor-pointer">
                      Make Recurring
                    </label>
                  </div>
                  {formData.is_recurring && (
                    <Select
                      value={formData.recurrence_interval || 'monthly'}
                      onValueChange={(value) => setFormData({ ...formData, recurrence_interval: value })}
                    >
                      <SelectTrigger className="w-[120px] bg-white border-2 border-gray-300 h-8 text-xs rounded-[6px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
            </>
          )}

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
              disabled={loading || (formData.type === 'transfer' && !transferToAccountId)}
              className="bg-black text-white hover:bg-green-900 h-8 px-4 text-sm font-medium rounded-[6px] shadow-none"
            >
              {loading
                ? (formData.type === 'transfer' ? 'Transferring...' : existingTransaction ? 'Updating...' : 'Adding...')
                : (formData.type === 'transfer' ? 'Transfer' : existingTransaction ? 'Update' : 'Add Transaction')}
            </Button>
          </div>
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
        onSuccess={async (newGoal) => {
          const freshGoals = await getGoals()
          setLocalGoals(freshGoals)
          setFormData(prev => ({ ...prev, goal_id: newGoal.id }))
        }}
      />
    </Dialog>
  )
}
