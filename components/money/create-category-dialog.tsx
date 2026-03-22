'use client'

import { useState } from 'react'
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
import { addTransactionCategory } from '@/lib/actions/money'
import { toast } from 'sonner'
import { CustomToast } from '@/components/toastMessage'
import * as LucideIcons from 'lucide-react'

interface CreateCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const PRESET_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#A855F7', // Purple
  '#EC4899', // Pink
  '#64748B', // Slate
]

const PRESET_ICONS = [
  'Wallet', 'ShoppingCart', 'Coffee', 'Utensils', 'Car', 
  'Home', 'Plane', 'Heart', 'Book', 'Gift', 
  'Briefcase', 'GraduationCap', 'Monitor', 'Music', 'Dumbbell',
  'Activity', 'TrendingUp', 'Zap', 'Star', 'Tag'
]

export function CreateCategoryDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCategoryDialogProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('Tag')
  const [color, setColor] = useState('#64748B')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      await addTransactionCategory({
        name: name.trim(),
        icon,
        color,
      })
      toast.custom(() => (
        <CustomToast type="success" title="Category created" message="Your custom category has been saved." />
      ))
      onSuccess()
      onOpenChange(false)
      setName('')
      setIcon('Tag')
      setColor('#64748B')
    } catch (error) {
      toast.custom(() => (
        <CustomToast
          type="error"
          title="Failed to create category"
          message={error instanceof Error ? error.message : 'Something went wrong'}
        />
      ))
    } finally {
      setLoading(false)
    }
  }

  const SelectedIcon = (LucideIcons as any)[icon]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FCF9F5] border border-[--border] rounded-[12px] shadow-md p-6 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">Create Category</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-[--text-secondary] mb-1 block">Category Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white border-[--border] focus:border-[--border-strong] h-9 text-sm rounded-[8px]"
              required
              placeholder="e.g. Groceries"
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-[--text-secondary] mb-2 block">Icon</Label>
            <div className="grid grid-cols-5 gap-2 h-32 overflow-y-auto p-1">
              {PRESET_ICONS.map((iconName) => {
                const IconComponent = (LucideIcons as any)[iconName]
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={`w-10 h-10 flex items-center justify-center rounded-md border ${
                      icon === iconName 
                        ? 'border-gray-800 bg-gray-100' 
                        : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 text-gray-700" />
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-[--text-secondary] mb-2 block">Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    color === c ? 'border-gray-800' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-white border border-[--border] rounded-[8px] flex items-center gap-3">
            <span className="text-xs font-medium text-[--text-secondary]">Preview:</span>
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: color }}
              >
                {SelectedIcon && <SelectedIcon className="w-4 h-4" />}
              </div>
              <span className="text-sm font-medium">{name || 'Category Name'}</span>
            </div>
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
              disabled={loading || !name.trim()}
              className="bg-black text-white hover:bg-green-900 h-8 px-3 text-sm font-medium rounded-[8px] shadow-none"
            >
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
