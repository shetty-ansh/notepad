'use client'

import { useMemo, useState } from 'react'
import { startOfYear, endOfYear, eachDayOfInterval, format, startOfWeek, addDays, getDay, isSameMonth } from 'date-fns'

interface HabitHeatmapProps {
  logs: Record<string, boolean>
  color: string
  year: number
}

// A simple Github-style activity heatmap
export function HabitHeatmap({ logs, color, year }: HabitHeatmapProps) {
  const [view, setView] = useState<'yearly' | 'monthly'>('yearly')
  const now = new Date()
  const displayYear = year

  const { weeks, monthLabels } = useMemo(() => {
    const start = startOfWeek(startOfYear(new Date(displayYear, 0, 1)))
    const end = endOfYear(new Date(displayYear, 11, 31))
    const days = eachDayOfInterval({ start, end })

    const weeksArray: Date[][] = []
    let currentWeek: Date[] = []

    days.forEach(day => {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        weeksArray.push(currentWeek)
        currentWeek = []
      }
    })
    if (currentWeek.length > 0) {
      weeksArray.push(currentWeek)
    }

    const mLabels: { month: string, xIndex: number }[] = []
    let currentMonth = -1
    weeksArray.forEach((w, i) => {
      const firstDay = w[0]
      if (firstDay.getMonth() !== currentMonth) {
        currentMonth = firstDay.getMonth()
        mLabels.push({ month: format(firstDay, 'MMM'), xIndex: i })
      }
    })

    return { weeks: weeksArray, monthLabels: mLabels }
  }, [displayYear])

  const getDayOpacity = (dateStr: string) => {
    if (logs[dateStr]) return 1
    if (logs[dateStr] === false) return 0.1 // faint red handled normally, but here just faint color
    return 0 // unmatched 
  }

  return (
    <div className="bg-white rounded-xl border border-black/10 p-4 sm:p-6 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm text-gray-500 uppercase tracking-widest">Consistency</h3>
        <div className="flex bg-gray-100 p-0.5 rounded-[6px]">
          <button
            onClick={() => setView('yearly')}
            className={`px-3 py-1 text-xs font-bold rounded-[4px] transition-colors ${
              view === 'yearly' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'
            }`}
          >
            Year
          </button>
          <button
            onClick={() => setView('monthly')}
            className={`px-3 py-1 text-xs font-bold rounded-[4px] transition-colors ${
              view === 'monthly' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-2 scrollbar-hide">
        <div className="min-w-[700px]">
          {/* Month labels */}
          {view === 'yearly' && (
            <div className="flex relative h-5 mb-1 text-[10px] font-bold text-gray-400">
              {monthLabels.map((m, i) => (
                <div key={i} className="absolute" style={{ left: `${(m.xIndex / weeks.length) * 100}%` }}>
                  {m.month}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-1 items-start">
            {/* Days labels */}
            <div className="flex flex-col gap-1 text-[9px] font-bold text-gray-400 pr-2 pt-1 h-full justify-between">
              <span className="h-3 leading-3">Mon</span>
              <span className="h-3 leading-3">Wed</span>
              <span className="h-3 leading-3">Fri</span>
            </div>

            {/* Grid */}
            <div className="flex gap-1 flex-1">
              {weeks.map((week, wIndex) => {
                // If monthly view, filter to just current month
                if (view === 'monthly' && !week.some(d => isSameMonth(d, now))) return null

                return (
                  <div key={wIndex} className="flex flex-col gap-1 flex-1">
                    {week.map((day, dIndex) => {
                      const dateStr = format(day, 'yyyy-MM-dd')
                      const isActive = logs[dateStr] === true
                      const isMissed = logs[dateStr] === false

                      let bg = 'bg-gray-100'
                      let style: React.CSSProperties = {}

                      if (isActive) {
                        bg = ''
                        style = { backgroundColor: color, opacity: getDayOpacity(dateStr) }
                      } else if (isMissed) {
                        bg = 'bg-red-50'
                      }

                      return (
                        <div
                          key={dIndex}
                          title={`${dateStr}: ${isActive ? 'Done' : isMissed ? 'Missed' : 'No data'}`}
                          className={`w-full aspect-square rounded-[2px] transition-all ${bg}`}
                          style={style}
                        />
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
