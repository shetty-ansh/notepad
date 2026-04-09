'use client'

import { Check, Circle, Pencil, Pin, PinOff, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Priority, Todo, TodoStatus } from '@/lib/types'

function getTodoNote(todo: Todo): string {
    const meta = todo.goal_meta
    if (!meta || typeof meta !== 'object') return ''
    const note = (meta as { note?: unknown }).note
    return typeof note === 'string' ? note : ''
}

function statusBadge(status: TodoStatus) {
    if (status === 'done') return <Badge className="bg-emerald-600">Done</Badge>
    if (status === 'in_progress') return <Badge className="bg-blue-600">In progress</Badge>
    return <Badge variant="secondary">To do</Badge>
}

export function TodoRow({
    item,
    onEdit,
    onDelete,
    onTogglePin,
    onToggleStatus,
}: {
    item: Todo
    onEdit: () => void
    onDelete: () => void
    onTogglePin: () => void
    onToggleStatus: () => void
}) {
    const note = getTodoNote(item)
    return (
        <div className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-medium">{item.title}</p>
                        {item.is_pinned ? <Pin className="size-4 text-amber-500" /> : null}
                    </div>
                    {note ? <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{note}</p> : null}
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        {statusBadge((item.status as TodoStatus) ?? 'todo')}
                        <Badge variant="outline">{item.priority ?? 'medium'}</Badge>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={onToggleStatus}>
                        {item.status === 'done' ? <Check className="size-4" /> : <Circle className="size-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={onTogglePin}>
                        {item.is_pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={onEdit}>
                        <Pencil className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={onDelete}>
                        <Trash2 className="size-4 text-red-600" />
                    </Button>
                </div>
            </div>
        </div>
    )
}