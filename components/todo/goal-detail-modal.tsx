'use client'

import { Check, Flag, Pencil, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { GoalPeriod, Todo, TodoStatus } from '@/lib/types'
import { formatText } from '@/lib/utils'

function toTitle(period: GoalPeriod): string {
    if (period === 'long_term_custom') return 'Long-term'
    return period.charAt(0).toUpperCase() + period.slice(1)
}

function statusLabel(status: TodoStatus): string {
    if (status === 'done') return 'Done'
    if (status === 'in_progress') return 'In progress'
    return 'To do'
}

export function GoalDetailModal({
    goal,
    subGoals,
    onClose,
    onEdit,
    onDelete,
    onToggleSubGoal,
}: {
    goal: Todo
    subGoals: Todo[]
    onClose: () => void
    onEdit: () => void
    onDelete: () => void
    onToggleSubGoal: (subGoal: Todo) => void
}) {
    const completedCount = subGoals.filter(sg => sg.status === 'done').length
    const totalCount = subGoals.length
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
    const isDone = goal.status === 'done'

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
        >
            <div
                className="relative w-full sm:max-w-lg max-h-[95vh] sm:max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-[6px] overflow-hidden bg-white shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 pt-5 pb-4 flex-shrink-0 bg-black/5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-2xl sm:text-3xl font-black text-black leading-tight mb-2">
                                {formatText(goal.title)}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                                <span className={`px-2 py-0.5 rounded-[6px] ${isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-black/5 text-black/50'}`}>
                                    {statusLabel((goal.status as TodoStatus) ?? 'todo')}
                                </span>
                                <span className="px-2 py-0.5 rounded-[6px] bg-black/10 text-black">
                                    {toTitle((goal.goal_period as GoalPeriod) ?? 'weekly')}
                                </span>
                                <span className="px-2 py-0.5 rounded-[6px] bg-amber-50 text-amber-600 flex items-center gap-1">
                                    <Flag className="size-2.5" />
                                    {formatText(goal.priority ?? 'Medium')}
                                </span>
                                {goal.due_date && (
                                    <span className="px-2 py-0.5 rounded-full bg-black/5 text-black/50 font-mono text-[10px]">
                                        {goal.due_date}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="size-7 flex items-center justify-center rounded-full text-black/30 hover:bg-black/5 hover:text-black transition-colors flex-shrink-0"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* Progress bar */}
                    {totalCount > 0 && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-black/30">
                                    Progress
                                </span>
                                <span className="text-xs font-bold text-black/40 tabular-nums">
                                    {completedCount}/{totalCount}
                                </span>
                            </div>
                            <div className="h-[8px] bg-black/8 rounded-[2px] overflow-hidden">
                                <div
                                    className={`h-full rounded-[2px] transition-all ${isDone ? 'bg-[#1AB394]' : 'bg-black'}`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="h-px bg-black/6 mx-5" />

                {/* Sub-goals list */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {subGoals.length === 0 ? (
                        <div className="py-10 text-center">
                            <p className="text-sm font-bold text-black/25">No sub-goals yet</p>
                            <button onClick={onEdit} className="mt-2 text-xs font-bold text-black/60 hover:text-black hover:underline">
                                Add sub-goals to track progress
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {subGoals.map((subGoal) => {
                                const done = subGoal.status === 'done'
                                return (
                                    <button
                                        key={subGoal.id}
                                        type="button"
                                        onClick={() => onToggleSubGoal(subGoal)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-black/3 transition-colors text-left group"
                                    >
                                        <span className={`size-5 rounded flex items-center justify-center flex-shrink-0 transition-colors border ${done
                                            ? 'bg-emerald-500 border-emerald-500'
                                            : 'border-black/15 group-hover:border-black/30'
                                            }`}
                                        >
                                            {done && <Check className="size-3 text-white" strokeWidth={3} />}
                                        </span>
                                        <span className={`flex-1 text-sm font-semibold transition-colors ${done ? 'line-through text-black/30' : 'text-black'}`}>
                                            {subGoal.title}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                <div className="px-5 py-3 border-t border-black/6 flex items-center justify-between flex-shrink-0">
                    <Button
                        onClick={onDelete}
                        variant="ghost"
                        className="h-8 px-3 text-xs font-bold bg-red-50 text-red-500 hover:text-white hover:bg-red-500 rounded-[4px]"
                    >
                        <Trash2 className="size-3 mr-1.5" />
                        Delete
                    </Button>
                    <Button
                        onClick={onEdit}
                        className="h-8 px-4 text-xs font-bold bg-black text-white hover:bg-black/80 rounded-[4px] shadow-none"
                    >
                        <Pencil className="size-3 mr-1.5" />
                        Edit goal
                    </Button>
                </div>
            </div>
        </div>
    )
}