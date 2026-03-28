'use client'

import { useState, useMemo } from 'react'
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfWeek,
} from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Transaction, Account } from '@/lib/types'
import { formatText } from '@/lib/utils'

interface MoneyCalendarProps {
  transactions: Transaction[]
  accounts?: Account[]
}

const colStartClasses = [
  '',
  'col-start-2',
  'col-start-3',
  'col-start-4',
  'col-start-5',
  'col-start-6',
  'col-start-7',
]

export function MoneyCalendar({ transactions, accounts = [] }: MoneyCalendarProps) {
  const today = startOfToday()
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState(format(today, 'MMM-yyyy'))
  const firstDayCurrentMonth = parse(currentMonth, 'MMM-yyyy', new Date())

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  })

  // Pre-compute daily net totals and transaction lists
  const dailyData = useMemo(() => {
    const map = new Map<string, { net: number; income: number; expense: number; txns: Transaction[] }>()
    for (const tx of transactions) {
      if (!tx.txn_date) continue
      const key = tx.txn_date.split('T')[0]
      if (!map.has(key)) map.set(key, { net: 0, income: 0, expense: 0, txns: [] })
      const entry = map.get(key)!
      entry.txns.push(tx)
      if (tx.type === 'income') {
        entry.income += tx.amount || 0
        entry.net += tx.amount || 0
      } else if (tx.type === 'expense') {
        entry.expense += tx.amount || 0
        entry.net -= tx.amount || 0
      }
    }
    return map
  }, [transactions])

  function previousMonth() {
    setCurrentMonth(format(add(firstDayCurrentMonth, { months: -1 }), 'MMM-yyyy'))
  }
  function nextMonth() {
    setCurrentMonth(format(add(firstDayCurrentMonth, { months: 1 }), 'MMM-yyyy'))
  }
  function goToToday() {
    setCurrentMonth(format(today, 'MMM-yyyy'))
  }

  const selectedDayKey = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null
  const selectedDayData = selectedDayKey ? dailyData.get(selectedDayKey) : null

  return (
    <div className="bg-white border border-gray-200 rounded-[12px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-black">
            {format(firstDayCurrentMonth, 'MMMM yyyy')}
          </h2>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            {format(firstDayCurrentMonth, 'MMM d')} – {format(endOfMonth(firstDayCurrentMonth), 'MMM d')}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={previousMonth} className="h-8 w-8 rounded-[6px]">
            <ChevronLeftIcon size={14} />
          </Button>
          <Button variant="outline" onClick={goToToday} className="h-8 px-3 text-xs font-bold rounded-[6px]">
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-[6px]">
            <ChevronRightIcon size={14} />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="py-2 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {days.map((day, dayIdx) => {
          const key = format(day, 'yyyy-MM-dd')
          const data = dailyData.get(key)
          const inMonth = isSameMonth(day, firstDayCurrentMonth)
          const isSelected = selectedDay && isEqual(day, selectedDay)

          return (
            <button
              key={dayIdx}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={cn(
                'relative flex flex-col items-start p-1 md:p-2 min-h-[56px] md:min-h-[80px] border-b border-r border-gray-50 transition-colors text-left',
                dayIdx === 0 && colStartClasses[getDay(day)],
                !inMonth && 'bg-gray-50/50',
                inMonth && 'hover:bg-gray-50',
                isSelected && 'bg-blue-50 ring-1 ring-inset ring-blue-200',
              )}
            >
              <span
                className={cn(
                  'text-[10px] md:text-xs font-bold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full',
                  isToday(day) && 'bg-black text-white',
                  !isToday(day) && inMonth && 'text-black',
                  !inMonth && 'text-gray-300',
                )}
              >
                {format(day, 'd')}
              </span>

              {data && (
                <div className="mt-auto w-full flex flex-col gap-1">
                  <div className="flex flex-wrap gap-0.5 justify-end">
                    {data.txns.slice(0, 5).map((tx, i) => (
                      <div
                        key={i}
                        className={cn(
                          'w-1.5 h-1.5 md:w-2 md:h-2 rounded-full',
                          tx.type === 'income' ? 'bg-green-500' :
                          tx.type === 'expense' ? 'bg-red-500' :
                          tx.type === 'transfer' ? 'bg-blue-500' : 'bg-yellow-500'
                        )}
                        title={tx.type}
                      />
                    ))}
                    {data.txns.length > 5 && (
                      <span className="text-[8px] text-gray-400 inline-flex items-center">+{data.txns.length - 5}</span>
                    )}
                  </div>
                  <p
                    className={cn(
                      'text-[9px] md:text-xs font-mono font-bold text-right truncate',
                      data.net > 0 && 'text-green-600',
                      data.net < 0 && 'text-red-500',
                      data.net === 0 && 'text-gray-400',
                    )}
                  >
                    {data.net >= 0 ? '+' : '−'}₹{Math.abs(data.net).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Day popup */}
      {selectedDay && selectedDayData && (
        <div className="border-t border-gray-200 bg-gray-50/80 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-black">
                {format(selectedDay, 'EEEE, MMM d')}
              </h3>
              <div className="flex gap-3 mt-1">
                {selectedDayData.income > 0 && (
                  <span className="text-[10px] font-bold text-green-600">
                    +₹{selectedDayData.income.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                )}
                {selectedDayData.expense > 0 && (
                  <span className="text-[10px] font-bold text-red-500">
                    −₹{selectedDayData.expense.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
            >
              <X size={12} />
            </button>
          </div>

          <div className="flex flex-col gap-1.5 max-h-[250px] overflow-y-auto">
            {selectedDayData.txns.map(tx => {
              const account = accounts.find(a => a.id === tx.account_id)
              const isIncome = tx.type === 'income'
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between bg-white rounded-[8px] px-3 py-2.5 border border-gray-100"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-black truncate">
                      {formatText(tx.description || '')}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                      {tx.category}{account ? ` · ${account.name}` : ''}
                    </p>
                  </div>
                  <p className={cn(
                    'text-sm md:text-lg font-mono font-bold flex-shrink-0 ml-3',
                    isIncome ? 'text-green-600' : 'text-black',
                  )}>
                    {isIncome ? '+' : '−'}₹{(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
