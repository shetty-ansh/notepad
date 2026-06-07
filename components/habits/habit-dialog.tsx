'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export const HABIT_COLORS = [
  '#000000', // black
  '#3b7a57', // green
  '#5b6abf', // indigo
  '#c0392b', // red
  '#b45309', // amber
  '#0891b2', // cyan
  '#7c3aed', // purple
  '#e11d48', // pink
]

export interface HabitFormState {
  name: string
  color: string
  frequency: string
}

interface HabitDialogProps {
  open: boolean
  onOpenChange: (val: boolean) => void
  value: HabitFormState
  onValueChange: (val: HabitFormState) => void
  onSubmit: () => void
  onDelete?: () => void
  isEdit: boolean
}

export function HabitDialog({
  open,
  onOpenChange,
  value,
  onValueChange,
  onSubmit,
  onDelete,
  isEdit,
}: HabitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 bg-white border border-gray-200 shadow-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-wider">
            {isEdit ? 'Edit Habit' : 'New Habit'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Name</label>
            <Input
              value={value.name}
              onChange={(e) => onValueChange({ ...value, name: e.target.value })}
              placeholder="E.g., Read 10 pages"
              className="mt-1 h-10 border-gray-300 font-medium"
              autoFocus
            />
          </div>

          <div className="space-y-2 flex flex-col">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Color</label>
            <div className="flex flex-wrap gap-3">
              {HABIT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onValueChange({ ...value, color })}
                  className={`size-8 rounded-full transition-transform ${
                    value.color === color ? 'scale-110 ring-2 ring-black ring-offset-2' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1 flex flex-col">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Frequency</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {['daily', 'weekdays', 'weekends', 'custom'].map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => onValueChange({ ...value, frequency: freq })}
                  className={`px-3 py-1.5 rounded-[4px] text-xs font-bold border transition-colors ${
                    value.frequency === freq
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-100">
          {isEdit && onDelete ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 h-auto"
            >
              <Trash2 className="size-4" />
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-500 font-semibold border border-transparent hover:border-gray-300 rounded-[4px]">
              Cancel
            </Button>
            <Button onClick={onSubmit} className="bg-black text-white font-bold px-6 shadow hover:bg-black/90 rounded-[4px]">
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
