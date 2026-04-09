'use client'

import { Check, Circle, Flag, Pencil, Pin, PinOff, Target, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { GoalPeriod, Priority, Todo, TodoStatus } from '@/lib/types'

function statusBadge(status: TodoStatus) {
    if (status === 'done') return <Badge className="bg-emerald-600">Done</Badge>
    if (status === 'in_progress') return <Badge className="bg-blue-600">In progress</Badge>
    return <Badge variant="secondary">To do</Badge>
}

function toTitle(period: GoalPeriod): string {
    if (period === 'long_term_custom') return 'Long-term'
    return period.charAt(0).toUpperCase() + period.slice(1)
}

export function GoalCardRow({
    item,
    onEdit,
    onDelete,
    onTogglePin,
    onToggleStatus,
    isExpiring,
}: {
    item: Todo
    onEdit: () => void
    onDelete: () => void
    onTogglePin: () => void
    onToggleStatus: () => void
    isExpiring?: boolean
}) {
    const isDone = item.status === 'done'
    return (
        <div className={`border rounded-[6px] p-4 cursor-pointer hover:shadow-md transition-all ${isDone
            ? 'bg-emerald-50/30 border-emerald-100 hover:border-emerald-200'
            : isExpiring
                ? 'bg-red-50 border-red-200 hover:border-red-300'
                : 'bg-white border-black/10 hover:border-black/25'
            }`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Target className="size-5 text-indigo-500" />
                    <h3 className="text-base md:text-2xl font-bold text-black truncate">
                        {item.title}
                    </h3>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleStatus}
                        className="text-black hover:text-white hover:bg-black p-2 rounded-full"
                        title={item.status === 'done' ? 'Mark as to do' : 'Mark as done'}
                    >
                        {item.status === 'done' ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onTogglePin}
                        className="text-black hover:text-white hover:bg-black p-2 rounded-full"
                        title={item.is_pinned ? 'Unpin' : 'Pin'}
                    >
                        {item.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onEdit}
                        className="text-black hover:text-white hover:bg-black p-2 rounded-full"
                        title="Edit"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onDelete}
                        className="text-red-600 hover:text-white hover:bg-red-600 p-2 rounded-full"
                        title="Delete"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
                {statusBadge((item.status as TodoStatus) ?? 'todo')}
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    {toTitle(((item.goal_period as GoalPeriod) ?? 'weekly'))}
                </Badge>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    <Flag className="size-3 mr-1" />
                    {item.priority ?? 'medium'}
                </Badge>
                {item.due_date && (
                    <span className="text-black font-mono font-semibold">
                        Target: {item.due_date}
                    </span>
                )}
            </div>
        </div>
    )
}