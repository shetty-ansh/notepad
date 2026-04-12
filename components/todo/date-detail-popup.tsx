'use client'

import { format } from 'date-fns'
import { CalendarDays, Target, ListTodo, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export type DateItem = {
    id: string
    title: string
    type: 'task' | 'goal'
    status: string
    period?: string | null
}

export function DateDetailPopup({
    date,
    items,
    onClose,
}: {
    date: Date
    items: DateItem[]
    onClose: () => void
}) {
    const todos = items.filter((i) => i.type === 'task')
    const goals = items.filter((i) => i.type === 'goal')

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(10,20,50,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
        >
            <div
                className="
                    relative w-full sm:max-w-md
                    h-full sm:h-auto sm:max-h-[80vh]
                    flex flex-col
                    bg-white
                    sm:rounded-[12px]
                    overflow-hidden
                    shadow-xl
                    border-t-[3px] border-t-black sm:border sm:border-black/10
                "
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-3 pt-3 pb-3 border-b border-black/8 bg-[#fff9eb] flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="size-8 text-black" />
                        <div>
                            <h3 className="text-xl font-black text-black">{format(date, 'EEEE')}</h3>
                            <p className="text-xs font-bold text-black/40">{format(date, 'MMMM d, yyyy')}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 flex items-center justify-center rounded-full bg-black text-white hover:bg-black/80 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                    {items.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-sm font-bold text-black/30 uppercase tracking-wide">Nothing scheduled for this day</p>
                        </div>
                    ) : (
                        <>
                            {/* Todos */}
                            {todos.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <ListTodo className="size-4 text-black/50" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-black/35">Todos ({todos.length})</span>
                                    </div>
                                    <div className="space-y-2">
                                        {todos.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-3 p-3 rounded-[6px] border border-black/10 bg-white hover:border-black/20 transition-colors"
                                            >
                                                <div className={`size-2.5 rounded-full flex-shrink-0 ${item.status === 'done' ? 'bg-[#1AB394]' : 'bg-black/30'}`} />
                                                <span className={`flex-1 text-sm font-bold ${item.status === 'done' ? 'line-through text-black/40' : 'text-black'}`}>
                                                    {item.title}
                                                </span>
                                                <Badge variant="secondary" className="text-[10px]">
                                                    {item.status === 'done' ? 'Done' : item.status === 'in_progress' ? 'In progress' : 'To do'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Goals */}
                            {goals.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Target className="size-4 text-black" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-black/35">Goals ({goals.length})</span>
                                    </div>
                                    <div className="space-y-2">
                                        {goals.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-3 p-3 rounded-[6px] border border-black/10 bg-black/5 hover:border-black/20 transition-colors"
                                            >
                                                <div className={`size-2.5 rounded-full flex-shrink-0 ${item.status === 'done' ? 'bg-[#1AB394]' : 'bg-black'}`} />
                                                <span className={`flex-1 text-sm font-bold ${item.status === 'done' ? 'line-through text-black/40' : 'text-black'}`}>
                                                    {item.title}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    {item.period && (
                                                        <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
                                                            {item.period === 'long_term_custom' ? 'Long-term' : item.period}
                                                        </Badge>
                                                    )}
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        {item.status === 'done' ? 'Done' : item.status === 'in_progress' ? 'In progress' : 'To do'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
