'use client'

import { useState, useEffect } from 'react'
import { CARD_THEMES } from '@/components/money/account-card'
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
import { addAccount, updateAccount } from '@/lib/actions/money'
import { toast } from 'sonner'
import { CustomToast } from '@/components/toastMessage'
import type { NewAccount, Account } from '@/lib/types'

interface AddAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  accountToEdit?: Account | null
}

export function AddAccountDialog({
  open,
  onOpenChange,
  onSuccess,
  accountToEdit,
}: AddAccountDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isEditing = !!accountToEdit
  const [balanceStr, setBalanceStr] = useState('')

  const [formData, setFormData] = useState<Partial<NewAccount & { color?: string | null }>>({
    name: '',
    type: 'savings',
    balance: 0,
    currency: 'INR',
    icon: '',
    is_active: true,
    color: 'deep_ocean'
  })

  useEffect(() => {
    if (open) {
      if (accountToEdit) {
        setFormData({
          name: accountToEdit.name,
          type: accountToEdit.type || 'savings',
          balance: accountToEdit.balance || 0,
          currency: accountToEdit.currency || 'INR',
          icon: accountToEdit.icon || '',
          is_active: accountToEdit.is_active ?? true,
          color: accountToEdit.color || 'deep_ocean',
        })
        setBalanceStr(accountToEdit.balance ? String(accountToEdit.balance) : '')
      } else {
        setFormData({
          name: '',
          type: 'savings',
          balance: 0,
          currency: 'INR',
          icon: '',
          is_active: true,
          color: 'deep_ocean'
        })
        setBalanceStr('')
      }
    }
  }, [open, accountToEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEditing && accountToEdit) {
        await updateAccount(accountToEdit.id, formData)
        toast.custom(() => (
          <CustomToast type="success" title="Account updated" message="Your account changes were saved." />
        ))
      } else {
        await addAccount(formData as NewAccount)
        toast.custom(() => (
          <CustomToast type="success" title="Account added" message="Your account has been created." />
        ))
      }
      
      onOpenChange(false)
      onSuccess?.()
      router.refresh()
    } catch (error) {
      toast.custom(() => (
        <CustomToast
          type="error"
          title={isEditing ? "Failed to update account" : "Failed to add account"}
          message={'Something went wrong'}
        />
      ))
    } finally {
      setLoading(false)
    }
  }

  const accountTypes = [
    { value: 'savings', label: 'Savings' },
    { value: 'checking', label: 'Checking' },
    { value: 'credit', label: 'Credit' },
    { value: 'cash', label: 'Cash' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FCF9F5] border border-gray-200 rounded-[6px] shadow-md p-5 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {isEditing ? 'Edit Account' : 'Add Account'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">
              Name
            </label>
            <Input
              value={formData.name || ''}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g. HDFC Savings"
              className="bg-white border-2 border-gray-300 focus:border-black h-9 text-sm rounded-[6px]"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">
              Type
            </label>
            <div className="flex bg-gray-100 rounded-[6px] p-0.5 gap-0.5">
              {accountTypes.map((t) => (
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

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">
                Balance
              </label>
              <Input
                type="number"
                step="1"
                value={balanceStr}
                onChange={(e) => {
                  setBalanceStr(e.target.value)
                  const val = parseInt(e.target.value)
                  setFormData({ ...formData, balance: isNaN(val) ? 0 : val })
                }}
                placeholder="0"
                className="bg-white border-2 border-gray-300 focus:border-black h-9 text-sm rounded-[6px] font-mono"
                required
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">
                Currency
              </label>
              <Select
                value={formData.currency || 'INR'}
                onValueChange={(value) =>
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger className="bg-white border-2 border-gray-300 h-9 text-sm rounded-[6px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">Theme</label>
            <div className="flex flex-wrap gap-3">
              {CARD_THEMES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: t.key })}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div
                    className={`w-12 h-12 rounded-full border-2 transition-all relative overflow-hidden ${
                      formData.color === t.key
                        ? 'border-gray-800 ring-2 ring-gray-400 scale-110'
                        : 'border-gray-300 hover:border-gray-500 hover:scale-105'
                    }`}
                    style={{
                      background: t.background,
                      backgroundBlendMode: t.blendMode || 'normal',
                    }}
                  />
                  <span className="text-[9px] font-medium text-[--text-secondary]">{t.name}</span>
                </button>
              ))}
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
              {loading ? (isEditing ? 'Saving...' : 'Adding...') : (isEditing ? 'Save Changes' : 'Add Account')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
