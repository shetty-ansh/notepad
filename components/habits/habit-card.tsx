'use client'

import { Flame } from 'lucide-react'
import type { Habit } from '@/lib/types'
import { startOfMonth, isSameMonth } from 'date-fns'

interface HabitCardProps {
  habit: Habit
  currentStreak: number
  monthCompletions: number
  recentLogs: boolean[] // true for completed, false for not, e.g. last 7 or 14 days
  onClick: () => void
  onToggleToday: (e: React.MouseEvent) => void
}

export function HabitCard({ habit, currentStreak, monthCompletions, recentLogs, onClick, onToggleToday }: HabitCardProps) {
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const progress = (monthCompletions / daysInMonth) * 100
  const isTodayCompleted = recentLogs[recentLogs.length - 1]

  return (
    <div
      onClick={onClick}
      className="bg-white border hover:border-black/20 border-black/10 rounded-[12px] p-4 cursor-pointer transition-all shadow-sm hover:shadow group flex flex-col"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="size-3.5 rounded-full"
            style={{ backgroundColor: habit.color || '#de6536' }}
          />
          <h3 className="font-bold text-lg text-black group-hover:text-black/80 transition-colors">{habit.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          {currentStreak > 0 && (
            <div className="hidden sm:flex items-center gap-1 bg-[#fff9eb] border border-[#fde68a] text-[#b45309] px-2 py-0.5 rounded-full">
              <Flame className="size-3 fill-current" />
              <span className="text-[10px] font-black">{currentStreak}</span>
            </div>
          )}
          <button
            onClick={onToggleToday}
            className={`flex items-center justify-center size-7 sm:size-8 rounded-full border transition-all ${
              isTodayCompleted 
                ? 'text-white border-transparent shadow-sm' 
                : 'text-gray-400 border-gray-200 hover:border-black/20 hover:text-black/50 hover:bg-black/5'
            }`}
            style={isTodayCompleted ? { backgroundColor: habit.color || '#de6536' } : {}}
            title={isTodayCompleted ? 'Completed' : 'Mark completed today'}
          >
            <svg
              className={`size-4 sm:size-5 ${isTodayCompleted ? 'opacity-100' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={isTodayCompleted ? 3 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="">
          <p className="text-[10px] font-bold text-black/40 uppercase tracking-wider mb-1 flex justify-between">
            <span>This Month</span>
            <span className="text-black/60">{monthCompletions} / {daysInMonth}</span>
          </p>
          <div className="h-[6px] bg-black/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: habit.color || '#de6536' }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center gap-1 pt-1">
          {recentLogs.map((isDone, idx) => (
            <div
              key={idx}
              className={`flex-1 h-1.5 rounded-full ${isDone ? '' : 'bg-black/5'}`}
              style={isDone ? { backgroundColor: habit.color || '#de6536' } : {}}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
