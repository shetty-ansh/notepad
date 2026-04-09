'use client'

import { useEffect, useMemo, useState } from 'react'
import { startOfMonth, subDays, format, isSameMonth, addDays, getDay, isBefore, isSameDay } from 'date-fns'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Loader from '@/components/loader-animation'
import { showToast } from '@/components/toast'
import type { Habit, HabitLog } from '@/lib/types'
import {
  getHabits,
  getAllHabitLogs,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabitLog
} from '@/lib/actions/habit'
import { HabitDialog, type HabitFormState, HABIT_COLORS } from '@/components/habits/habit-dialog'
import { HabitCard } from '@/components/habits/habit-card'
import { HabitCalendar } from '@/components/habits/habit-calendar'
import { HabitHeatmap } from '@/components/habits/habit-heatmap'

const defaultForm: HabitFormState = {
  name: '',
  color: HABIT_COLORS[0],
  frequency: 'daily',
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [loading, setLoading] = useState(true)

  // Selection states
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [heatmapYear, setHeatmapYear] = useState(() => new Date().getFullYear())

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [form, setForm] = useState<HabitFormState>(defaultForm)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [h, l] = await Promise.all([getHabits(), getAllHabitLogs()])
      setHabits(h)
      setLogs(l)
    } catch (error) {
      showToast('error', 'Failed to load', error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Helper to compute stats for a specific habit
  const computeStats = (habitId: string) => {
    const sortedLogs = logs
      .filter((l) => l.habit_id === habitId && l.completed && l.log_date)
      .map((l) => new Date(l.log_date!))
      .sort((a, b) => b.getTime() - a.getTime()) // newest first

    let currentStreak = 0
    let bestStreak = 0
    let totalCompletions = sortedLogs.length
    
    // Calculate streaks
    if (sortedLogs.length > 0) {
      const today = new Date()
      // Normalize today to start of day
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const yesterdayStart = subDays(todayStart, 1)

      // Check if current streak is active (logged today or yesterday)
      const mostRecent = new Date(sortedLogs[0].getFullYear(), sortedLogs[0].getMonth(), sortedLogs[0].getDate())
      
      if (mostRecent.getTime() === todayStart.getTime() || mostRecent.getTime() === yesterdayStart.getTime()) {
        currentStreak = 1
        for (let i = 1; i < sortedLogs.length; i++) {
          const expected = subDays(mostRecent, i)
          const actual = new Date(sortedLogs[i].getFullYear(), sortedLogs[i].getMonth(), sortedLogs[i].getDate())
          if (actual.getTime() === expected.getTime()) {
            currentStreak++
          } else {
            break
          }
        }
      }

      // Best streak calculation
      let currentRun = 1
      bestStreak = 1
      for (let i = 1; i < sortedLogs.length; i++) {
        const d1 = new Date(sortedLogs[i - 1].getFullYear(), sortedLogs[i - 1].getMonth(), sortedLogs[i - 1].getDate())
        const d2 = new Date(sortedLogs[i].getFullYear(), sortedLogs[i].getMonth(), sortedLogs[i].getDate())
        if (d1.getTime() - d2.getTime() === 86400000) { // 1 day difference
          currentRun++
          bestStreak = Math.max(bestStreak, currentRun)
        } else if (d1.getTime() !== d2.getTime()) {
          currentRun = 1
        }
      }
    }

    // Month completions
    const thisMonthLogs = sortedLogs.filter((d) => isSameMonth(d, calendarMonth)).length

    // Completion rate
    const creationDateStr = logs.filter(l => l.habit_id === habitId).map(l => l.log_date).sort()[0];
    let completionRate = 0
    if (creationDateStr) {
      const created = new Date(creationDateStr)
      const now = new Date()
      const daysSinceCreation = Math.max(1, Math.floor((now.getTime() - created.getTime()) / 86400000) + 1)
      completionRate = Math.min((totalCompletions / daysSinceCreation) * 100, 100)
    }

    return {
      currentStreak,
      bestStreak,
      monthCompletions: thisMonthLogs,
      totalCompletions,
      completionRate
    }
  }

  const openNewDialog = () => {
    setEditingHabit(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  const openEditDialog = (habit: Habit) => {
    setEditingHabit(habit)
    setForm({
      name: habit.name,
      color: habit.color || HABIT_COLORS[0],
      frequency: habit.frequency || 'daily',
    })
    setDialogOpen(true)
  }

  const submitHabit = async () => {
    if (!form.name.trim()) return

    try {
      if (editingHabit) {
        // Optimistic
        const updatedInfo = { ...editingHabit, ...form, name: form.name.trim() }
        setHabits((prev) => prev.map((h) => (h.id === editingHabit.id ? updatedInfo : h)))
        setDialogOpen(false)

        await updateHabit(editingHabit.id, {
          name: form.name.trim(),
          color: form.color,
          frequency: form.frequency,
        })
        showToast('success', 'Habit updated', 'Your habit was saved successfully.')
      } else {
        setDialogOpen(false)
        const created = await createHabit({
          name: form.name.trim(),
          color: form.color,
          frequency: form.frequency,
        })
        setHabits((prev) => [created, ...prev])
        showToast('success', 'Habit created', 'Time to start building the streak!')
      }
    } catch (error) {
      showToast('error', 'Failed to save', error instanceof Error ? error.message : 'Something went wrong')
      await loadData()
    }
  }

  const handleDeleteHabit = async () => {
    if (!editingHabit) return
    showToast('confirmDelete', 'Delete Habit?', `Are you sure you want to delete "${editingHabit.name}" and all its history?`, async () => {
      setHabits((prev) => prev.filter((h) => h.id !== editingHabit.id))
      setDialogOpen(false)
      if (selectedHabitId === editingHabit.id) setSelectedHabitId(null)

      try {
        await deleteHabit(editingHabit.id)
        showToast('success', 'Deleted', 'Habit deleted successfully.')
      } catch (error) {
        showToast('error', 'Delete failed', error instanceof Error ? error.message : 'Something went wrong')
        await loadData()
      }
    })
  }

  const toggleDate = async (habitId: string, dateStr: string, currentState?: boolean, forceState?: boolean) => {
    // If forceState is given, use it, otherwise cycle: undefined -> true -> false -> undefined
    const nextState = forceState !== undefined 
      ? forceState 
      : (currentState === undefined ? true : currentState === true ? false : undefined)
    
    // Optimistic update
    if (nextState === undefined) {
      // Remove it locally
      setLogs((prev) => prev.filter((l) => !(l.habit_id === habitId && l.log_date === dateStr)))
    } else {
      // Update/Add locally
      setLogs((prev) => {
        const filtered = prev.filter((l) => !(l.habit_id === habitId && l.log_date === dateStr))
        return [...filtered, {
          id: 'temp-' + Date.now(),
          habit_id: habitId,
          log_date: dateStr,
          completed: nextState,
          note: null,
          user_id: 'temp'
        }]
      })
    }

    // Server update
    try {
      // For false to undefined (removing log) we just set completed to false in DB, but actually deleting it might be cleaner. 
      // toggleHabitLog currently upserts completed status. Let's just pass nextState boolean.
      // If nextState is undefined, we store false for now, as deleteHabitLog isn't implemented.
      // Wait, let's treat undefined as false. In UI we toggled yes -> no -> neutral (missing row).
      const finalState = nextState === undefined ? false : nextState
      const result = await toggleHabitLog(habitId, dateStr, finalState)
      
      // Update with exact server result to replace temp IDs 
      setLogs((prev) => {
        const filtered = prev.filter((l) => !(l.habit_id === habitId && l.log_date === dateStr) && !l.id.startsWith('temp-'))
        return [...filtered, result]
      })
    } catch (error) {
      showToast('error', 'Update failed', error instanceof Error ? error.message : 'Something went wrong')
      await loadData()
    }
  }

  // -- Render State: Detail View --
  if (selectedHabitId) {
    const habit = habits.find((h) => h.id === selectedHabitId)
    if (!habit) {
      setSelectedHabitId(null)
      return null
    }

    const dictLogs: Record<string, boolean> = {}
    logs.forEach((l) => {
      if (l.habit_id === habit.id && l.log_date) {
        dictLogs[l.log_date] = l.completed ?? false
      }
    })

    const stats = computeStats(habit.id)

    return (
      <div className="h-full overflow-y-auto px-4 py-4 sm:p-6 space-y-6 pb-20">
        <HabitCalendar
          habit={habit}
          monthDate={calendarMonth}
          logs={dictLogs}
          stats={stats}
          onPrevMonth={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
          onNextMonth={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
          onToday={() => setCalendarMonth(new Date())}
          onToggleDate={(dateStr, curr) => toggleDate(habit.id, dateStr, curr)}
          onBack={() => setSelectedHabitId(null)}
          onEdit={() => openEditDialog(habit)}
        />
        
        <HabitHeatmap
          logs={dictLogs}
          color={habit.color || HABIT_COLORS[0]}
          year={heatmapYear}
        />

        <HabitDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          value={form}
          onValueChange={setForm}
          onSubmit={submitHabit}
          onDelete={handleDeleteHabit}
          isEdit={true}
        />
      </div>
    )
  }

  // -- Render State: List View --
  return (
    <div className="h-full overflow-y-auto px-4 py-4 sm:p-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-6xl font-bold">Habits</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="bg-black text-white hover:bg-[#de6536] h-10 px-4 text-sm font-medium rounded-[6px] shadow-none transition-colors border border-transparent"
            onClick={openNewDialog}
          >
            <Plus className="size-4 mr-1" />
            Add Habit
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader />
        </div>
      ) : habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center border-2 border-dashed border-gray-200 rounded-[12px] bg-white">
          <div className="text-4xl mb-4">🌱</div>
          <h3 className="text-lg font-bold">No habits yet</h3>
          <p className="text-sm text-gray-500 mb-4 max-w-sm">
            Create a habit to start building streaks and visualizing your progress on a beautiful calendar.
          </p>
          <Button onClick={openNewDialog} className="bg-black text-white rounded-[4px] shadow font-bold">
            Create your first habit
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {habits.map((habit) => {
            const stats = computeStats(habit.id)
            
            // Build recent logs array for the mini sparkline
            const recentLogs: boolean[] = []
            for (let i = 6; i >= 0; i--) {
              const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
              const exists = logs.find(l => l.habit_id === habit.id && l.log_date === d && l.completed === true)
              recentLogs.push(Boolean(exists))
            }

            return (
              <HabitCard
                key={habit.id}
                habit={habit}
                currentStreak={stats.currentStreak}
                monthCompletions={stats.monthCompletions}
                recentLogs={recentLogs}
                onClick={() => {
                  setSelectedHabitId(habit.id)
                  setCalendarMonth(new Date()) // snap to current month when opening
                }}
                onToggleToday={(e) => {
                  e.stopPropagation()
                  const todayStr = format(new Date(), 'yyyy-MM-dd')
                  const isTodayCompleted = recentLogs[6]
                  // If completed, clear it (undefined). If not completed, mark it true.
                  toggleDate(habit.id, todayStr, undefined, isTodayCompleted ? undefined : true)
                }}
              />
            )
          })}
        </div>
      )}

      <HabitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        value={form}
        onValueChange={setForm}
        onSubmit={submitHabit}
        isEdit={false}
      />
    </div>
  )
}
