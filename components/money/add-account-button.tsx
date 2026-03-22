'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AddAccountDialog } from './add-account-dialog'
import { Plus } from 'lucide-react'

interface AddAccountButtonProps {
  className?: string
  onSuccess?: () => void
}

export function AddAccountButton({ className, onSuccess }: AddAccountButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={`bg-black text-white hover:bg-green-900 h-10 px-4 text-sm font-medium rounded-8px shadow-none ${className || ''}`}
      >
        <Plus className="w-4 h-4 mr-1.5" />
        Add Account
      </Button>
      <AddAccountDialog open={open} onOpenChange={setOpen} onSuccess={onSuccess} />
    </>
  )
}
