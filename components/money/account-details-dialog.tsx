'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { TransactionRow } from '@/components/money/transaction-row'
import { GoalCard } from '@/components/money/goal-card'
import type { Account, Transaction, Goal, TransactionCategory } from '@/lib/types'
import { Trash2, Edit2, Palette } from 'lucide-react'
import { deleteAccount as deleteAccountAction, updateAccount } from '@/lib/actions/money'
import { CustomToast } from '../toastMessage'
import { toast } from 'sonner'
import { AddAccountDialog } from './add-account-dialog'

interface AccountDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: Account | null
  transactions: Transaction[]
  goals: Goal[]
  categories: TransactionCategory[]
  onProvision?: (goal: Goal) => void
  onEditTransaction?: (transaction: Transaction) => void
  onDeleteTransaction?: () => void
  onUpdate?: () => void
}

export function AccountDetailsDialog({
  open,
  onOpenChange,
  account,
  transactions,
  goals,
  categories,
  onProvision,
  onEditTransaction,
  onDeleteTransaction,
  onUpdate,
}: AccountDetailsDialogProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [localColor, setLocalColor] = useState<string>('')
  
  // Track original color to avoid unnecessary updates
  const originalColorRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (account) {
      const color = account.color || '#000000'
      setLocalColor(color)
      originalColorRef.current = color
    }
  }, [account])

  // Debounced API call for color picker to save Supabase costs
  useEffect(() => {
    if (!account) return
    const timer = setTimeout(async () => {
      // Only fire API if color changed
      if (localColor && localColor !== originalColorRef.current) {
        try {
          await updateAccount(account.id, { color: localColor })
          originalColorRef.current = localColor
          toast.success('Account color updated')
          onUpdate?.()
        } catch {
          toast.error('Failed to change color')
        }
      }
    }, 500) // 500ms debounce
    return () => clearTimeout(timer)
  }, [localColor, account, onUpdate])

  const handleDeleteAccount = async (accountId: string) => {
    toast.custom((t) => (
      <CustomToast
        type="confirmDelete"
        title="Delete Account"
        message="Are you sure you want to delete this account?"
        onConfirm={async () => {
          await deleteAccountAction(accountId)
          toast.dismiss(t)
          onOpenChange(false)
          toast.custom((t2) => (
            <CustomToast
              type="success"
              title="Success"
              message="Account deleted successfully"
            />
          ))
        }}
        onCancel={() => { toast.dismiss(t) }}
      />
    ), { duration: Infinity })
  }

  if (!account) return null

  const accountTransactions = transactions.filter((t) => t.account_id === account.id)
  const accountGoals = goals.filter((g) => g.account_id === account.id)

  const provisionTransactions = accountTransactions.filter(t => t.type === 'provision')
  const provisioned = provisionTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)

  const freeMoney = (account.balance || 0) - provisioned

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto sm:max-w-lg backdrop-blur-md bg-white/95">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{account.icon}</span>
            <div>
              <DialogTitle className="text-xl">{account.name}</DialogTitle>
              <DialogDescription className="mt-1">
                {account?.type
                  ? account.type.charAt(0).toUpperCase() + account.type.slice(1).toLowerCase()
                  : ''} • {account.currency}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex items-center gap-2 ml-2 mt-2">
          <button 
            onClick={() => setEditDialogOpen(true)}
            title="Edit Account"
            className="flex items-center justify-center rounded-full p-2 border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
          >
            <Edit2 size={16} />
          </button>
          
          <label 
            title="Choose Account Color"
            className="flex items-center justify-center rounded-full p-2 border border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-colors cursor-pointer relative"
          >
            <Palette size={16} />
            <input 
              type="color" 
              className="absolute opacity-0 w-full h-full cursor-pointer" 
              value={localColor}
              onChange={(e) => setLocalColor(e.target.value)}
            />
          </label>
          
          <button 
            onClick={() => handleDeleteAccount(account.id)}
            title="Delete Account"
            className="flex items-center justify-center rounded-full p-2 border border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-6">
          {/* Balance Section */}
          <div className="bg-[--card] border border-[--border] rounded-[12px] p-4 flex flex-col items-center justify-center shadow-sm">
            <span className="text-sm font-medium text-[--text-secondary] mb-1">Total Balance</span>
            <span className="text-4xl font-mono font-bold text-[--text-primary]">
              {(account.balance || 0).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            {provisioned > 0 && (
              <div className="flex gap-6 mt-4 pt-4 border-t border-[--border] w-full justify-center">
                <div className="flex flex-col flex-1 items-center">
                  <span className="text-[11px] text-[--text-secondary] uppercase tracking-wider">Free</span>
                  <span className="font-mono font-semibold text-[--text-primary] mt-0.5">
                    {freeMoney.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex flex-col flex-1 items-center border-l border-[--border]">
                  <span className="text-[11px] text-[--text-tertiary] uppercase tracking-wider">Provisioned</span>
                  <span className="font-mono text-[--text-tertiary] mt-0.5">
                    {provisioned.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Provisions / Goals Section */}
          {accountGoals.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-[--text-primary] mb-3">Provisions</h3>
              <div className="grid grid-cols-1 gap-3">
                {accountGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} onProvision={() => onProvision?.(goal)} />
                ))}
              </div>
            </div>
          )}

          {/* Transactions Section */}
          <div>
            <h3 className="text-sm font-bold text-[--text-primary] mb-3">Recent Transactions</h3>
            {accountTransactions.length === 0 ? (
              <p className="text-sm text-[--text-tertiary] text-center py-4 border border-dashed border-[--border] rounded-[12px]">
                No transactions found
              </p>
            ) : (
              <div className="flex flex-col">
                {accountTransactions.slice(0, 50).map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    account={account}
                    colour={categories.find(c => c.name === transaction.category)?.color || '#64748B'}
                    onEdit={onEditTransaction}
                    onDelete={onDeleteTransaction}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      <AddAccountDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} accountToEdit={account} onSuccess={onUpdate} />
    </Dialog>
  )
}
