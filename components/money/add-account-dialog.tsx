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

  const [formData, setFormData] = useState<Partial<NewAccount & { color?: string | null }>>({
    name: '',
    type: 'savings',
    balance: 0,
    currency: 'INR',
    icon: '',
    is_active: true,
    color: '#000000'
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
          color: accountToEdit.color || '#000000',
        })
      } else {
        setFormData({
          name: '',
          type: 'savings',
          balance: 0,
          currency: 'INR',
          icon: '',
          is_active: true,
          color: '#000000'
        })
      }
    }
  }, [open, accountToEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEditing && accountToEdit) {
        // Send only a single query to update
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FCF9F5] border border-[--border] rounded-[12px] shadow-md p-6 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">
            {isEditing ? 'Edit Account' : 'Add Account'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">
              Name
            </Label>
            <Input
              value={formData.name || ''}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="bg-[--background-subtle] border-[--border] focus:border-[--border-strong] h-9 text-sm rounded-[8px]"
              required
            />
          </div>

          <div className='flex gap-10'>
            <div>
              <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">
                Type
              </Label>
              <Select
                value={formData.type || 'savings'}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger className="bg-[--background-subtle] border-[--border] h-9 text-sm rounded-[8px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">
                Currency
              </Label>
              <Select
                value={formData.currency || 'INR'}
                onValueChange={(value) =>
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger className="bg-[--background-subtle] border-[--border] h-9 text-sm rounded-[8px]">
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
            <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">
              Balance
            </Label>
            <Input
              type="number"
              step="0.01"
              value={formData.balance ?? ''}
              onChange={(e) =>
                setFormData({ ...formData, balance: e.target.value ? parseFloat(e.target.value) : 0 })
              }
              className="bg-[--background-subtle] border-[--border] focus:border-[--border-strong] h-9 text-sm rounded-[8px] font-mono"
              required
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Account Color</Label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={formData.color ?? '#000000'}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-10 h-10 px-1 py-1 bg-white border-[--border] rounded-[8px] cursor-pointer"
              />
              <span className="text-xs text-[--text-tertiary] font-mono uppercase bg-[--background-subtle] px-2 py-1 rounded-[4px] border border-[--border]">{formData.color || 'None'}</span>
            </div>
          </div>

          <DialogFooter className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-8 px-3 text-sm text-red-600 hover:bg-[--background-muted] hover:text-white hover:bg-red-600 rounded-[8px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-black text-white hover:bg-green-900 h-8 px-3 text-sm font-medium rounded-[8px] shadow-none"
            >
              {loading ? (isEditing ? 'Saving...' : 'Adding...') : (isEditing ? 'Save Changes' : 'Add Account')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
