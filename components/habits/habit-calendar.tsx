'use client'

import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, isFuture } from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
  BarChart3,
  CalendarCheck,
  TrendingUp,
  ArrowLeft,
  Settings,
  Check,
  X
} from 'lucide-react'
import type { Habit } from '@/lib/types'
import { Button } from '@/components/ui/button'

interface HabitStats {
  currentStreak: number
  bestStreak: number
  monthCompletions: number
  totalCompletions: number
  completionRate: number
}

interface HabitCalendarProps {
  habit: Habit
  monthDate: Date
  logs: Record<string, boolean> // format: 'yyyy-MM-dd' -> bool
  stats: HabitStats
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  onToggleDate: (dateStr: string, currentState?: boolean) => void
  onBack: () => void
  onEdit: () => void
}

export function HabitCalendar({
  habit,
  monthDate,
  logs,
  stats,
  onPrevMonth,
  onNextMonth,
  onToday,
  onToggleDate,
  onBack,
  onEdit
}: HabitCalendarProps) {
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthStart)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const habitColor = habit.color || '#de6536'

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-black/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-black/5 bg-[#fcfbf8]">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-[4px] hover:bg-black/5">
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="size-4 rounded-full" style={{ backgroundColor: habitColor }} />
            <h2 className="text-xl sm:text-2xl font-black">{habit.name}</h2>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onEdit} className="rounded-[4px] hover:bg-black/5 text-gray-500 hover:text-black">
          <Settings className="size-5" />
        </Button>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard icon={<Flame />} label="Current Streak" value={`${stats.currentStreak} days`} color="#de6536" />
          <StatCard icon={<Trophy />} label="Best Streak" value={`${stats.bestStreak} days`} color="#b45309" />
          <StatCard icon={<BarChart3 />} label="This Month" value={`${stats.monthCompletions} days`} />
          <StatCard icon={<CalendarCheck />} label="Total Done" value={`${stats.totalCompletions}`} />
          <StatCard icon={<TrendingUp />} label="Success Rate" value={`${Math.round(stats.completionRate)}%`} />
        </div>

        {/* Calendar Navigation */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">{format(monthDate, 'MMMM yyyy')}</h3>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={onPrevMonth} className="h-8 w-8 p-0 rounded-[4px] border border-gray-200 shadow-sm">
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onToday} className="h-8 px-3 rounded-[4px] border border-gray-200 shadow-sm font-semibold text-xs">
                Today
              </Button>
              <Button variant="ghost" size="sm" onClick={onNextMonth} className="h-8 w-8 p-0 rounded-[4px] border border-gray-200 shadow-sm">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center font-bold text-[10px] sm:text-xs text-gray-400 py-2 uppercase tracking-wider">
                {d}
              </div>
            ))}
            
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const status = logs[dateStr] // undefined, true, or false
              const future = isFuture(day)
              const today = isToday(day)
              const inMonth = isSameMonth(day, monthStart)
              
              let cellClass = `relative h-12 sm:h-16 rounded-md border flex items-center justify-center cursor-pointer transition-colors select-none `
              let icon = null
              let style: React.CSSProperties = {}

              if (!inMonth) {
                cellClass += `opacity-30 bg-gray-50 border-transparent `
              } else if (future) {
                cellClass += `opacity-30 bg-gray-50 border-gray-200 cursor-not-allowed `
              } else {
                if (status === true) {
                  cellClass += `text-white font-bold border-transparent shadow-sm hover:opacity-90 `
                  style = { backgroundColor: habitColor }
                  icon = <Check className="size-5 absolute opacity-30 right-1 bottom-1" />
                } else if (status === false) {
                  cellClass += `bg-red-50 border-red-100 text-red-700 hover:bg-red-100 `
                  icon = <X className="size-4 absolute opacity-40 right-1 bottom-1" />
                } else {
                  cellClass += `bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 `
                }
              }

              if (today) {
                cellClass += `ring-2 ring-black ring-offset-2 `
              }

              return (
                <div
                  key={dateStr}
                  className={cellClass}
                  style={style}
                  onClick={() => {
                    if (!future) onToggleDate(dateStr, status)
                  }}
                >
                  <span className="font-semibold text-sm sm:text-base">{format(day, 'd')}</span>
                  {icon}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color?: string }) {
  return (
    <div className="bg-[#fcfbf8] border border-black/5 rounded-lg p-3 flex flex-col justify-between">
      <div className="flex items-center gap-1.5 text-gray-500 mb-2">
        <div className="size-4 shrink-0 flex items-center justify-center [&>svg]:size-4" style={color ? { color } : {}}>
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider truncate">{label}</span>
      </div>
      <div className="text-lg font-black">{value}</div>
    </div>
  )
}
