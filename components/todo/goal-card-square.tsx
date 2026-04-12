'use client'

import type { Todo } from '@/lib/types'

export function GoalSquareCard({
    item,
    subGoals,
    onClick,
    isExpiring,
}: {
    item: Todo;
    subGoals: Todo[];
    onClick: () => void;
    isExpiring?: boolean;
}) {
    const completedCount = subGoals.filter(sg => sg.status === 'done').length
    const totalCount = subGoals.length
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
    const isDone = totalCount > 0 && completedCount === totalCount

    return (
        <div
            onClick={onClick}
            className={`w-full h-[12rem] sm:w-[16rem] border rounded-lg p-4 transition-all flex flex-col justify-between text-left group cursor-pointer ${isDone
                ? 'bg-emerald-50/30 border-emerald-100 hover:border-emerald-200'
                : isExpiring
                    ? 'bg-red-50 border-red-200 hover:border-red-300'
                    : 'bg-white border-black/10 hover:border-black/25'
                }`}
        >
            <h3 className="text-lg sm:text-2xl font-black text-black leading-snug break-words whitespace-normal group-hover:text-black/70 transition-colors overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {item.title}
            </h3>

            <div className="mt-3 w-full">
                {totalCount > 0 && (
                    <p className="text-[10px] font-bold text-black/35 mb-1.5 tabular-nums">
                        <span className="text-gray-500 text-sm">{completedCount}</span> / <span className="text-black text-sm">{totalCount}</span>
                    </p>
                )}
                <div className="h-[8px] bg-black/8 rounded-[2px] overflow-hidden">
                    <div
                        className={`h-full rounded-[2px] transition-all ${isDone ? 'bg-[#1AB394]' : 'bg-black'}`}
                        style={{ width: totalCount > 0 ? `${progress}%` : '0%' }}
                    />
                </div>
            </div>
        </div>
    )
}