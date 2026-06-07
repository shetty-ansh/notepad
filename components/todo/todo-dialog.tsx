'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export type TodoFormState = {
    title: string
    note: string
}

export function TodoDialog({
    open,
    onOpenChange,
    value,
    onValueChange,
    onSubmit,
    isEdit,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    value: TodoFormState
    onValueChange: (value: TodoFormState) => void
    onSubmit: () => Promise<void>
    isEdit: boolean
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Todo' : 'Create Todo'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <Input
                        placeholder="Title"
                        value={value.title}
                        onChange={(e) => onValueChange({ ...value, title: e.target.value })}
                    />
                    <div className="rounded-lg border bg-card p-3">
                        <textarea
                            rows={6}
                            className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            placeholder="Take a note..."
                            value={value.note}
                            onChange={(e) => onValueChange({ ...value, note: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                        <Button
                            onClick={() => void onSubmit()}
                            disabled={!value.title.trim()}
                        >
                            {isEdit ? 'Save' : 'Create'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}