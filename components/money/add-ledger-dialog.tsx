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
import { addLedgerEntry, updateLedgerEntry } from '@/lib/actions/money'
import { toast } from 'sonner'
import { CustomToast } from '@/components/toastMessage'
import type { NewLedgerEntry, Ledger } from '@/lib/types'

interface AddLedgerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entryToEdit?: Ledger | null
  onSuccess?: (entry: Ledger, isEdit: boolean) => void
}

export function AddLedgerDialog({ open, onOpenChange, entryToEdit, onSuccess }: AddLedgerDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<NewLedgerEntry>({
    person_name: '',
    amount: 0,
    direction: 'i_owe',
    description: '',
    due_date: null,
    status: 'pending',
  })

  useEffect(() => {
    if (entryToEdit && open) {
      setFormData({
        person_name: entryToEdit.person_name,
        amount: entryToEdit.amount,
        direction: entryToEdit.direction,
        description: entryToEdit.description,
        due_date: entryToEdit.due_date,
        status: entryToEdit.status,
      })
    } else if (!open) {
      // Reset when closing
      setFormData({ person_name: '', amount: 0, direction: 'i_owe', description: '', due_date: null, status: 'pending' })
    }
  }, [entryToEdit, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let result: Ledger
      if (entryToEdit) {
        result = await updateLedgerEntry(entryToEdit.id, formData)
        toast.custom(() => (
          <CustomToast type="success" title="Entry updated" message="Ledger entry has been updated." />
        ))
      } else {
        result = await addLedgerEntry(formData)
        toast.custom(() => (
          <CustomToast type="success" title="Entry added" message="Ledger entry has been recorded." />
        ))
      }
      
      if (onSuccess) onSuccess(result, !!entryToEdit)
      onOpenChange(false)
      if (!onSuccess) router.refresh()
    } catch (error) {
      toast.custom(() => (
        <CustomToast
          type="error"
          title={`Failed to ${entryToEdit ? 'update' : 'add'} entry`}
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
          <DialogTitle className="text-base font-medium">{entryToEdit ? 'Edit Ledger Entry' : 'Add Ledger Entry'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Person Name</Label>
              <Input
                value={formData.person_name}
                onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                className="bg-white border-[--border] focus:border-[--border-strong] h-9 text-sm rounded-[8px]"
                required
              />
            </div>
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
          </div>

          <div>
            <Label className="text-xs font-medium text-[--text-secondary] mb-2 block">Direction</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, direction: 'i_owe' })}
                className={`flex-1 h-9 text-sm rounded-[8px] border transition-colors ${
                  formData.direction === 'i_owe'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-[--text-secondary] border-[--border] hover:bg-gray-50'
                }`}
              >
                I owe
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, direction: 'they_owe' })}
                className={`flex-1 h-9 text-sm rounded-[8px] border transition-colors ${
                  formData.direction === 'they_owe'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-[--text-secondary] border-[--border] hover:bg-gray-50'
                }`}
              >
                They owe me
              </button>
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Description</Label>
            <Input
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-white border-[--border] focus:border-[--border-strong] h-9 text-sm rounded-[8px]"
              required
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Due Date (Optional)</Label>
            <Input
              type="date"
              value={formData.due_date || ''}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value || null })}
              className="bg-white border-[--border] focus:border-[--border-strong] h-9 text-sm rounded-[8px]"
            />
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
              {loading ? (entryToEdit ? 'Saving...' : 'Adding...') : (entryToEdit ? 'Save Changes' : 'Add Entry')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
