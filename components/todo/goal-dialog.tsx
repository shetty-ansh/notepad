'use client'

import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import type { GoalPeriod, Priority, TodoStatus } from '@/lib/types'

export type GoalFormState = {
    title: string
    status: TodoStatus
    priority: Priority
    dueDate: Date | null
    goalPeriod: GoalPeriod
    subGoals: string[]
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <label className="text-[10px] font-black uppercase tracking-widest text-black/35 mb-1.5 block">
            {children}
        </label>
    )
}

export function GoalDialog({
    open,
    onOpenChange,
    value,
    onValueChange,
    onSubmit,
    isEdit,
    goalPeriod,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    value: GoalFormState
    onValueChange: (value: GoalFormState) => void
    onSubmit: () => Promise<void>
    isEdit: boolean
    goalPeriod?: GoalPeriod | null
}) {
    const [newSubGoal, setNewSubGoal] = useState('')
    const [editingIdx, setEditingIdx] = useState<number | null>(null)
    const [editingText, setEditingText] = useState('')

    const startEdit = (idx: number) => {
        setEditingIdx(idx)
        setEditingText(value.subGoals[idx])
    }

    const commitEdit = () => {
        if (editingIdx === null) return
        const trimmed = editingText.trim()
        if (trimmed) {
            const next = [...value.subGoals]
            next[editingIdx] = trimmed
            onValueChange({ ...value, subGoals: next })
        }
        setEditingIdx(null)
        setEditingText('')
    }

    const cancelEdit = () => {
        setEditingIdx(null)
        setEditingText('')
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Mobile: full screen. Desktop: constrained sheet */}
            <DialogContent className="
        flex flex-col gap-0 p-0 overflow-hidden
        bg-white
        border border-black/10 border-t-[3px] border-t-[#de6536]
        rounded-none sm:rounded-[12px]
        shadow-xl
        w-full h-full max-h-full sm:h-auto sm:max-h-[90vh]
        max-w-full sm:max-w-lg
        inset-0 sm:inset-auto
        translate-x-0 translate-y-0 sm:-translate-x-1/2 sm:-translate-y-1/2
        sm:left-1/2 sm:top-1/2
        sm:fixed
      ">
                <DialogHeader className="px-5 pt-5 pb-4 border-b border-black/8 flex-shrink-0 bg-[#fff9eb]">
                    <DialogTitle className="text-2xl font-black text-black">
                        {isEdit ? 'Edit goal' : 'New goal'}
                    </DialogTitle>
                </DialogHeader>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

                    {/* Title */}
                    <div>
                        <FieldLabel>Goal title</FieldLabel>
                        <Input
                            placeholder="What do you want to achieve?"
                            value={value.title}
                            onChange={(e) => onValueChange({ ...value, title: e.target.value })}
                            className="bg-white font-bold text-black border-black/15 focus:border-[#de6536] placeholder:text-black/25 h-10 rounded-[4px]"
                        />
                    </div>

                    {/* Status / Priority / Period */}
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <FieldLabel>Status</FieldLabel>
                            <Select value={value.status} onValueChange={(v) => onValueChange({ ...value, status: v as TodoStatus })}>
                                <SelectTrigger className="h-9 text-xs font-bold border-black/15 rounded-[4px] bg-white">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="rounded-[4px]">
                                    <SelectItem value="todo">To do</SelectItem>
                                    <SelectItem value="in_progress">In progress</SelectItem>
                                    <SelectItem value="done">Done</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <FieldLabel>Priority</FieldLabel>
                            <Select value={value.priority} onValueChange={(v) => onValueChange({ ...value, priority: v as Priority })}>
                                <SelectTrigger className="h-9 text-xs font-bold border-black/15 rounded-[4px] bg-white">
                                    <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent className="rounded-[4px]">
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <FieldLabel>Period</FieldLabel>
                            <Select
                                value={value.goalPeriod}
                                onValueChange={(v) => onValueChange({ ...value, goalPeriod: v as GoalPeriod })}
                            >
                                <SelectTrigger className="h-9 text-xs font-bold border-black/15 rounded-[4px] bg-white">
                                    <SelectValue placeholder="Period" />
                                </SelectTrigger>
                                <SelectContent className="rounded-[4px]">
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                    <SelectItem value="long_term_custom">Long-term</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Target date */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <FieldLabel>Target date</FieldLabel>
                            {value.dueDate && (
                                <button
                                    onClick={() => onValueChange({ ...value, dueDate: null })}
                                    className="text-[10px] font-black uppercase tracking-wider text-black/30 hover:text-black/60 transition-colors mb-1.5"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <input
                            type="date"
                            value={value.dueDate ? format(value.dueDate, 'yyyy-MM-dd') : ''}
                            onChange={(e) => {
                                const val = e.target.value
                                onValueChange({ ...value, dueDate: val ? new Date(val + 'T00:00:00') : null })
                            }}
                            className="w-full h-10 px-3 border border-black/15 rounded-[4px] bg-white text-sm font-bold text-black focus:border-[#de6536] focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Sub-goals — timeline style with inline editing */}
                    <div>
                        <FieldLabel>Sub-goals</FieldLabel>
                        <div className="border border-black/10 rounded-[4px] bg-white overflow-hidden">
                            {value.subGoals.length > 0 && (
                                <div className="px-4 pt-3 pb-1">
                                    <div className="relative">
                                        {/* Continuous vertical line */}
                                        <div className="absolute left-[5px] top-2 bottom-2 w-px bg-black/12" />
                                        <div className="space-y-0">
                                            {value.subGoals.map((sg, idx) => (
                                                <div key={idx} className="flex items-center gap-3 py-2 group">
                                                    {/* Timeline dot */}
                                                    <span className="size-[11px] rounded-full border-2 border-black/25 bg-white flex-shrink-0 z-10" />

                                                    {editingIdx === idx ? (
                                                        <Input
                                                            autoFocus
                                                            value={editingText}
                                                            onChange={(e) => setEditingText(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') commitEdit()
                                                                if (e.key === 'Escape') cancelEdit()
                                                            }}
                                                            onBlur={commitEdit}
                                                            className="flex-1 text-sm font-bold border-black/15 focus:border-[#de6536] h-7 rounded-[4px] px-2 bg-[#fff9eb]"
                                                        />
                                                    ) : (
                                                        <span
                                                            className="flex-1 text-sm font-bold text-black cursor-pointer hover:text-[#de6536] transition-colors"
                                                            onClick={() => startEdit(idx)}
                                                            title="Click to edit"
                                                        >
                                                            {sg}
                                                        </span>
                                                    )}

                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        {editingIdx !== idx && (
                                                            <button
                                                                onClick={() => startEdit(idx)}
                                                                className="text-black/25 hover:text-[#de6536] transition-all"
                                                            >
                                                                <Pencil className="size-3" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => onValueChange({ ...value, subGoals: value.subGoals.filter((_, i) => i !== idx) })}
                                                            className="text-black/25 hover:text-red-500 transition-all"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Add input row */}
                            <div className={`flex items-center gap-2 px-3 py-2 ${value.subGoals.length > 0 ? 'border-t border-black/6' : ''}`}>
                                <Input
                                    placeholder="Add a sub-goal…"
                                    value={newSubGoal}
                                    onChange={(e) => setNewSubGoal(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newSubGoal.trim()) {
                                            onValueChange({ ...value, subGoals: [...value.subGoals, newSubGoal.trim()] })
                                            setNewSubGoal('')
                                        }
                                    }}
                                    className="text-sm font-bold border-0 shadow-none focus-visible:ring-0 px-1 placeholder:text-black/25 h-8 bg-transparent rounded-none"
                                />
                                <button
                                    onClick={() => {
                                        if (newSubGoal.trim()) {
                                            onValueChange({ ...value, subGoals: [...value.subGoals, newSubGoal.trim()] })
                                            setNewSubGoal('')
                                        }
                                    }}
                                    className="size-6 flex items-center justify-center rounded-[4px] bg-[#de6536] text-white hover:bg-[#c55530] transition-colors flex-shrink-0"
                                >
                                    <Plus className="size-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-black/8 flex items-center justify-between flex-shrink-0 bg-[#fff9eb]">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="text-xs font-black uppercase tracking-wider text-black/35 hover:text-black/60 transition-colors"
                    >
                        Cancel
                    </button>
                    <Button
                        onClick={() => void onSubmit()}
                        disabled={!value.title.trim()}
                        className="h-9 px-5 text-xs font-black bg-[#de6536] text-white hover:bg-[#c55530] rounded-[4px] transition-colors disabled:opacity-30"
                    >
                        {isEdit ? 'Save changes' : 'Create goal'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}