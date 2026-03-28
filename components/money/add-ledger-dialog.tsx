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
  const [amountStr, setAmountStr] = useState('')
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
      setAmountStr(entryToEdit.amount ? String(entryToEdit.amount) : '')
    } else if (!open) {
      setFormData({ person_name: '', amount: 0, direction: 'i_owe', description: '', due_date: null, status: 'pending' })
      setAmountStr('')
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
      <DialogContent className="bg-[#FCF9F5] border border-gray-200 rounded-[6px] shadow-md p-5 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{entryToEdit ? 'Edit Ledger Entry' : 'Add Ledger Entry'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">Person Name</label>
              <Input
                value={formData.person_name}
                onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                placeholder="Who?"
                className="bg-white border-2 border-gray-300 focus:border-black h-9 text-sm rounded-[6px]"
                required
              />
            </div>
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
          </div>

          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">Direction</label>
            <div className="flex bg-gray-100 rounded-[6px] p-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, direction: 'i_owe' })}
                className={`flex-1 px-2 py-1.5 text-[11px] font-medium rounded-[4px] transition-all ${
                  formData.direction === 'i_owe'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                I owe
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, direction: 'they_owe' })}
                className={`flex-1 px-2 py-1.5 text-[11px] font-medium rounded-[4px] transition-all ${
                  formData.direction === 'they_owe'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                They owe me
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">Description</label>
            <Input
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What for?"
              className="bg-white border-2 border-gray-300 focus:border-black h-9 text-sm rounded-[6px]"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary] mb-1.5 block">Due Date</label>
            <Input
              type="date"
              value={formData.due_date || ''}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value || null })}
              className="bg-white border-2 border-gray-300 focus:border-black h-9 text-sm rounded-[6px]"
            />
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
              {loading ? (entryToEdit ? 'Saving...' : 'Adding...') : (entryToEdit ? 'Save Changes' : 'Add Entry')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
