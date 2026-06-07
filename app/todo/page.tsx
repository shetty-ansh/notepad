
'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  addDays,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  format,
  isSameMonth,
  isSameQuarter,
  isSameWeek,
  isWithinInterval,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
} from 'date-fns'
import { CalendarDays, Check, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { FullScreenCalendar } from '@/components/ui/fullscreen-calendar'
import { FilterDropdown } from '@/components/ui/filter-dropdown'
import { MobileCarousel } from '@/components/money/mobile-carousel'
import Loader from '@/components/loader-animation'
import { showToast } from '@/components/toast'
import type { GoalPeriod, Priority, Todo, TodoStatus } from '@/lib/types'
import {
  createTodo,
  deleteTodo,
  getTodosByType,
  toggleTodoPin,
  toggleTodoStatus,
  updateTodo,
} from '@/lib/actions/todo'
import { TodoRow } from '@/components/todo/todo-row'
import { GoalSquareCard } from '@/components/todo/goal-card-square'
import { TodoDialog, type TodoFormState } from '@/components/todo/todo-dialog'
import { GoalDialog, type GoalFormState } from '@/components/todo/goal-dialog'
import { GoalDetailModal } from '@/components/todo/goal-detail-modal'
import { DateDetailPopup, type DateItem } from '@/components/todo/date-detail-popup'
import { formatText } from '@/lib/utils'

type Mode = 'todos' | 'goals'
type TodoFilter = 'all' | 'pinned' | 'Daywise'
type GoalFilter = 'all' | GoalPeriod

const defaultTodoForm: TodoFormState = {
  title: '',
  note: '',
}

const defaultGoalForm: GoalFormState = {
  title: '',
  status: 'todo',
  priority: 'medium',
  dueDate: null,
  goalPeriod: 'weekly',
  subGoals: [],
}

function toDateInput(dateStr?: string | null): Date | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return Number.isNaN(d.getTime()) ? null : d
}

function toDateString(date: Date | null): string | null {
  return date ? format(date, 'yyyy-MM-dd') : null
}

function toTitle(period: GoalPeriod): string {
  if (period === 'long_term_custom') return 'Long-term'
  return period.charAt(0).toUpperCase() + period.slice(1)
}

function getPeriodRangeLabel(period: GoalPeriod): string {
  const now = new Date()
  let start: Date
  let end: Date

  switch (period) {
    case 'weekly':
      start = startOfWeek(now, { weekStartsOn: 1 })
      end = endOfWeek(now, { weekStartsOn: 1 })
      return `This Week [${format(start, 'd/M')} - ${format(end, 'd/M')}]`
    case 'monthly':
      start = startOfMonth(now)
      end = endOfMonth(now)
      return `This Month [${format(start, 'd/M')} - ${format(end, 'd/M')}]`
    case 'quarterly':
      start = startOfQuarter(now)
      end = endOfQuarter(now)
      return `This Quarter [${format(start, 'd/M')} - ${format(end, 'd/M')}]`
    default:
      return 'Long-term'
  }
}

function isGoalInCurrentPeriod(item: Todo): boolean {
  if (item.goal_period === 'long_term_custom' || !item.goal_period) return true
  const now = new Date()
  const refDate = item.due_date ? new Date(item.due_date) : new Date(item.created_at!)

  switch (item.goal_period) {
    case 'weekly':
      return isSameWeek(refDate, now, { weekStartsOn: 1 })
    case 'monthly':
      return isSameMonth(refDate, now)
    case 'quarterly':
      return isSameQuarter(refDate, now)
    default:
      return true
  }
}

function getIsExpiring(item: Todo): boolean {
  if (item.status === 'done' || !item.goal_period || item.goal_period === 'long_term_custom') return false
  const now = new Date()
  let end: Date

  switch (item.goal_period) {
    case 'weekly':
      end = endOfWeek(now, { weekStartsOn: 1 })
      // Red tint if today is Fri, Sat, or Sun
      return isWithinInterval(now, { start: addDays(end, -2), end })
    case 'monthly':
      end = endOfMonth(now)
      // Red tint if last 3 days
      return isWithinInterval(now, { start: addDays(end, -3), end })
    case 'quarterly':
      end = endOfQuarter(now)
      // Red tint if last 5 days
      return isWithinInterval(now, { start: addDays(end, -5), end })
    default:
      return false
  }
}

function getTodoNote(todo: Todo): string {
  const meta = todo.goal_meta
  if (!meta || typeof meta !== 'object') return ''
  const note = (meta as { note?: unknown }).note
  return typeof note === 'string' ? note : ''
}

export default function TodoPage() {
  const [mode, setMode] = useState<Mode>('todos')
  const [todoFilter, setTodoFilter] = useState<TodoFilter>('Daywise')
  const [goalFilter, setGoalFilter] = useState<GoalFilter>('all')
  const [todos, setTodos] = useState<Todo[]>([])
  const [goals, setGoals] = useState<Todo[]>([])
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const [todoDialogOpen, setTodoDialogOpen] = useState(false)
  const [goalDialogOpen, setGoalDialogOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [editingGoal, setEditingGoal] = useState<Todo | null>(null)
  const [todoForm, setTodoForm] = useState<TodoFormState>(defaultTodoForm)
  const [goalForm, setGoalForm] = useState<GoalFormState>(defaultGoalForm)
  const [selectedGoal, setSelectedGoal] = useState<Todo | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<GoalPeriod | null>(null)
  const [subGoals, setSubGoals] = useState<Todo[]>([])
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [inlineDraft, setInlineDraft] = useState<Record<string, string>>({})
  const [datePopup, setDatePopup] = useState<{ date: Date; items: DateItem[] } | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [activeInlineDate, setActiveInlineDate] = useState<string | null>(null)
  const [todosHovered, setTodosHovered] = useState(false)

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    if (todoFilter !== 'Daywise') setTodosHovered(false)
  }, [todoFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [todoRows, goalRows] = await Promise.all([getTodosByType('task'), getTodosByType('goal')])
      setTodos(todoRows)
      const mainGoals = goalRows.filter(g => !g.goal_meta || !(g.goal_meta as { parent_id?: string }).parent_id)
      setGoals(mainGoals)
      setSubGoals(goalRows.filter(g => g.goal_meta && (g.goal_meta as { parent_id?: string }).parent_id))
    } catch (error) {
      showToast('error', 'Failed to load', error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const filteredTodos = useMemo(() => {
    let next = [...todos]
    if (todoFilter === 'pinned') next = next.filter((t) => t.is_pinned)
    if (todoFilter === 'Daywise') next = next.filter((t) => t.day_date)
    return next
  }, [todos, todoFilter])

  const filteredGoals = useMemo(() => {
    let next = goals.filter(isGoalInCurrentPeriod)
    if (goalFilter !== 'all') next = next.filter((g) => g.goal_period === goalFilter)
    if (selectedCalendarDate) next = next.filter((g) => g.due_date === selectedCalendarDate)
    return next
  }, [goals, goalFilter, selectedCalendarDate])

  const unfinishedGoals = useMemo(() => {
    return goals.filter(g => !isGoalInCurrentPeriod(g) && g.status !== 'done')
  }, [goals])

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const weekDaywiseTodos = useMemo(() => {
    const start = weekStart
    const end = addDays(weekStart, 6)
    const onlyDaywise = todos.filter((t) => t.type === 'task' && t.day_date)
    const map = new Map<string, Todo[]>()
    for (const todo of onlyDaywise) {
      const d = new Date(todo.day_date as string)
      if (Number.isNaN(d.getTime())) continue
      if (!isWithinInterval(d, { start, end })) continue
      const key = format(d, 'yyyy-MM-dd')
      map.set(key, [...(map.get(key) ?? []), todo])
    }
    return map
  }, [todos, weekStart])

  const calendarData = useMemo(() => {
    const byDate = new Map<string, { id: number; name: string; time: string; datetime: string }[]>()
    let counter = 0

    // Add todos by day_date
    todos.forEach((item) => {
      const date = item.day_date
      if (!date) return
      counter++
      const list = byDate.get(date) ?? []
      list.push({ id: counter, name: item.title, time: item.priority ?? 'task', datetime: date })
      byDate.set(date, list)
    })

    // Add goals by due_date
    goals.forEach((item) => {
      const date = item.due_date
      if (!date) return
      counter++
      const list = byDate.get(date) ?? []
      list.push({ id: counter, name: item.title, time: item.goal_period ?? 'goal', datetime: date })
      byDate.set(date, list)
    })

    return Array.from(byDate.entries()).map(([date, events]) => ({
      day: new Date(date),
      events,
    }))
  }, [todos, goals])

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const items: DateItem[] = []

    todos.forEach((t) => {
      if (t.day_date === dateStr) {
        items.push({ id: t.id, title: t.title, type: 'task', status: t.status ?? 'todo' })
      }
    })

    goals.forEach((g) => {
      if (g.due_date === dateStr) {
        items.push({ id: g.id, title: g.title, type: 'goal', status: g.status ?? 'todo', period: g.goal_period })
      }
    })

    setDatePopup({ date, items })
  }

  const openNewTodoDialog = () => {
    setEditingTodo(null)
    setTodoForm(defaultTodoForm)
    setTodoDialogOpen(true)
  }

  const openEditTodoDialog = (todo: Todo) => {
    setEditingTodo(todo)
    setTodoForm({
      title: todo.title,
      note: getTodoNote(todo),
    })
    setTodoDialogOpen(true)
  }

  const openNewGoalDialog = (period?: GoalPeriod) => {
    setEditingGoal(null)
    setGoalForm(period ? { ...defaultGoalForm, goalPeriod: period } : defaultGoalForm)
    setGoalDialogOpen(true)
  }

  const openEditGoalDialog = (goal: Todo) => {
    setEditingGoal(goal)
    const goalSubGoals = subGoals.filter(sg => (sg.goal_meta as { parent_id?: string })?.parent_id === goal.id)
    setGoalForm({
      title: goal.title,
      status: (goal.status as TodoStatus) ?? 'todo',
      priority: (goal.priority as Priority) ?? 'medium',
      dueDate: toDateInput(goal.due_date),
      goalPeriod: (goal.goal_period as GoalPeriod) ?? 'weekly',
      subGoals: goalSubGoals.map(sg => sg.title),
    })
    setGoalDialogOpen(true)
  }

  const submitTodo = async () => {
    if (!todoForm.title.trim()) return

    try {
      if (editingTodo) {
        const prevMeta =
          editingTodo.goal_meta && typeof editingTodo.goal_meta === 'object' && !Array.isArray(editingTodo.goal_meta)
            ? (editingTodo.goal_meta as Record<string, unknown>)
            : {}
        const nextMeta: Record<string, unknown> = { ...prevMeta, note: todoForm.note }
        const optimistic: Todo = {
          ...editingTodo,
          title: todoForm.title.trim(),
          status: editingTodo.status ?? 'todo',
          priority: editingTodo.priority ?? 'medium',
          due_date: null,
          goal_meta: nextMeta as unknown as Todo['goal_meta'],
        }
        setTodos((prev) => prev.map((t) => (t.id === optimistic.id ? optimistic : t)))
        setTodoDialogOpen(false)
        await updateTodo(editingTodo.id, {
          title: optimistic.title,
          due_date: null,
          goal_meta: nextMeta,
        })
        showToast('success', 'Todo updated', 'Your todo was updated successfully.')
        setEditingTodo(null)
      } else {
        const created = await createTodo({
          title: todoForm.title.trim(),
          type: 'task',
          status: 'todo',
          priority: 'medium',
          due_date: null,
          day_date: null,
          goal_meta: { note: todoForm.note },
        })
        setTodos((prev) => [created, ...prev])
        setTodoDialogOpen(false)
        showToast('success', 'Todo created', 'A new todo has been added.')
      }
    } catch (error) {
      showToast('error', 'Failed to save', error instanceof Error ? error.message : 'Something went wrong')
      await loadData()
    }
  }

  const submitGoal = async () => {
    if (!goalForm.title.trim()) return

    try {
      if (editingGoal) {
        const optimistic: Todo = {
          ...editingGoal,
          title: goalForm.title.trim(),
          status: goalForm.status,
          priority: goalForm.priority,
          due_date: toDateString(goalForm.dueDate),
          goal_period: goalForm.goalPeriod,
        }
        setGoals((prev) => prev.map((g) => (g.id === optimistic.id ? optimistic : g)))
        setGoalDialogOpen(false)

        await updateTodo(editingGoal.id, {
          title: optimistic.title,
          status: optimistic.status as TodoStatus,
          priority: optimistic.priority as Priority,
          due_date: optimistic.due_date,
          goal_period: optimistic.goal_period as GoalPeriod,
        })

        const existingSubGoals = subGoals.filter(sg => (sg.goal_meta as { parent_id?: string })?.parent_id === editingGoal.id)
        const formSubGoals = goalForm.subGoals

        // Update existing sub-goals that changed title
        for (let i = 0; i < Math.min(existingSubGoals.length, formSubGoals.length); i++) {
          if (existingSubGoals[i].title !== formSubGoals[i]) {
            await updateTodo(existingSubGoals[i].id, { title: formSubGoals[i] })
            setSubGoals(prev => prev.map(sg => sg.id === existingSubGoals[i].id ? { ...sg, title: formSubGoals[i] } : sg))
          }
        }

        // Delete removed sub-goals (existing ones beyond the form list length)
        for (let i = formSubGoals.length; i < existingSubGoals.length; i++) {
          await deleteTodo(existingSubGoals[i].id)
          setSubGoals(prev => prev.filter(sg => sg.id !== existingSubGoals[i].id))
        }

        // Create truly new sub-goals (form entries beyond existing count)
        for (let i = existingSubGoals.length; i < formSubGoals.length; i++) {
          if (formSubGoals[i].trim()) {
            const created = await createTodo({
              title: formSubGoals[i].trim(),
              type: 'goal',
              status: 'todo',
              priority: goalForm.priority,
              goal_period: goalForm.goalPeriod,
              goal_meta: { parent_id: editingGoal.id },
            })
            setSubGoals(prev => [...prev, created])
          }
        }

        showToast('success', 'Goal updated', 'Your goal was updated successfully.')
        setEditingGoal(null)
      } else {
        const created = await createTodo({
          title: goalForm.title.trim(),
          type: 'goal',
          status: 'todo',
          priority: goalForm.priority,
          due_date: toDateString(goalForm.dueDate),
          goal_period: goalForm.goalPeriod,
        })
        setGoals((prev) => [created, ...prev])

        for (const subGoalTitle of goalForm.subGoals) {
          if (subGoalTitle.trim()) {
            const subGoal = await createTodo({
              title: subGoalTitle.trim(),
              type: 'goal',
              status: 'todo',
              priority: goalForm.priority,
              goal_period: goalForm.goalPeriod,
              goal_meta: { parent_id: created.id },
            })
            setSubGoals(prev => [...prev, subGoal])
          }
        }

        setGoalDialogOpen(false)
        showToast('success', 'Goal created', 'A new goal has been added.')
      }
    } catch (error) {
      showToast('error', 'Failed to save', error instanceof Error ? error.message : 'Something went wrong')
      await loadData()
    }
  }

  const onDelete = (item: Todo) => {
    showToast('confirmDelete', 'Delete item?', `Delete "${item.title}" permanently?`, async () => {
      const previous = item.type === 'goal' ? goals : todos
      if (item.type === 'goal') setGoals((prev) => prev.filter((g) => g.id !== item.id))
      else setTodos((prev) => prev.filter((t) => t.id !== item.id))

      try {
        await deleteTodo(item.id)
        showToast('success', 'Deleted', 'Item removed successfully.')
      } catch (error) {
        if (item.type === 'goal') setGoals(previous)
        else setTodos(previous)
        showToast('error', 'Delete failed', error instanceof Error ? error.message : 'Something went wrong')
      }
    })
  }

  const onTogglePin = (item: Todo) => {
    const nextPinned = !item.is_pinned
    const updateLocal = (list: Todo[]) => {
      const updated = list.map((x) => (x.id === item.id ? { ...x, is_pinned: nextPinned } : x))
      return updated.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
        const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
        const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
        return bCreated - aCreated
      })
    }
    if (item.type === 'goal') setGoals((prev) => updateLocal(prev))
    else setTodos((prev) => updateLocal(prev))
    toggleTodoPin(item.id, nextPinned)
      .then(() => {
        showToast('success', nextPinned ? 'Pinned' : 'Unpinned', 'Updated successfully.')
      })
      .catch(async (error) => {
        await loadData()
        showToast('error', 'Update failed', error instanceof Error ? error.message : 'Something went wrong')
      })
  }

  const onToggleStatus = (item: Todo) => {
    const nextStatus: TodoStatus = item.status === 'done' ? 'todo' : 'done'
    const updateLocal = (list: Todo[]) =>
      list.map((x) => (x.id === item.id ? { ...x, status: nextStatus } : x))
    if (item.type === 'goal') setGoals((prev) => updateLocal(prev))
    else setTodos((prev) => updateLocal(prev))
    toggleTodoStatus(item.id, nextStatus)
      .then(() => {
        showToast('success', 'Status updated', 'State synced successfully.')
      })
      .catch(async (error) => {
        await loadData()
        showToast('error', 'Update failed', error instanceof Error ? error.message : 'Something went wrong')
      })
  }

  const createDaywiseTodo = async (day: Date, title: string) => {
    const trimmed = title.trim()
    if (!trimmed) return
    const dayStr = format(day, 'yyyy-MM-dd')
    try {
      const created = await createTodo({
        title: trimmed,
        type: 'task',
        status: 'todo',
        priority: 'medium',
        due_date: null,
        day_date: dayStr,
      })
      setTodos((prev) => [created, ...prev])
      setInlineDraft((prev) => ({ ...prev, [dayStr]: '' }))
      setActiveInlineDate(null)
      showToast('success', 'Added', 'Day-wise todo created.')
    } catch (error) {
      showToast('error', 'Failed to add', error instanceof Error ? error.message : 'Something went wrong')
      await loadData()
    }
  }

  const rolloverGoal = async (goal: Todo) => {
    try {
      const now = new Date()
      let nextDue: string | null = null

      if (goal.goal_period === 'weekly') nextDue = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      else if (goal.goal_period === 'monthly') nextDue = format(endOfMonth(now), 'yyyy-MM-dd')
      else if (goal.goal_period === 'quarterly') nextDue = format(endOfQuarter(now), 'yyyy-MM-dd')

      await updateTodo(goal.id, {
        due_date: nextDue,
      })

      showToast('success', 'Goal rolled over', `"${goal.title}" moved to current period.`)
      await loadData()
    } catch (error) {
      showToast('error', 'Rollover failed', error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4 sm:p-6 space-y-2 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-4xl sm:text-7xl font-bold">ToDos</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Manage your daily tasks and goals
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex w-full p-1.5 md:p-2 rounded-[6px] gap-2 border border-[#e4dfcc] shadow-[0px_0px_10px_0px_rgba(255,255,255,)] ">
          <button
            onClick={() => setMode('todos')}
            // className={`w-1/2 py-2 text-md font-semibold rounded-[4px] ${mode === 'todos' ? 'bg-[#de6536] shadow text-white border border-gray-200' : 'bg-transparent hover:bg-[#0D1717]/10'
            className={`w-1/2 py-1.5 md:py-2 text-md font-semibold rounded-[4px] ${mode === 'todos' ? 'bg-[#de6536] shadow text-white border border-gray-200' : 'bg-transparent hover:bg-[#e4dfcc]'
              }`}
          >
            TODOS
          </button>
          <button
            onClick={() => setMode('goals')}
            className={`w-1/2 py-1.5 md:py-2 text-md font-semibold rounded-[4px] ${mode === 'goals' ? 'bg-[#de6536] shadow text-white border border-gray-200' : 'bg-transparent hover:bg-[#e4dfcc]  '
              }`}
          >
            GOALS
          </button>
        </div>
        <div className='flex gap-2'>
          {mode === 'todos' ? (
            <>
              <div>
                <FilterDropdown
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'pinned', label: 'Pinned' },
                  ]}
                  value={todoFilter}
                  onChange={(v) => setTodoFilter(v as TodoFilter)}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <FilterDropdown
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'quarterly', label: 'Quarterly' },
                    { value: 'long_term_custom', label: 'Long-term' },
                  ]}
                  value={goalFilter}
                  onChange={(v) => setGoalFilter(v as GoalFilter)}
                />
              </div>
            </>
          )}
          <div className="flex items-center gap-2">
            <Button
              className="xl:hidden bg-white text-black border border-gray-300 h-10 px-3 text-sm font-semibold rounded-[6px] shadow-none"
              variant="outline"
              onClick={() => setCalendarOpen(true)}
            >
              <CalendarDays className="size-4 mr-1" />
              Calendar
            </Button>
            <Button
              className="bg-black text-white hover:bg-green-900 h-10 px-4 text-sm font-medium rounded-[6px] shadow-none"
              onClick={() => (mode === 'todos' ? openNewTodoDialog() : openNewGoalDialog())}
            >
              <Plus className="size-4 mr-1" />
              {mode === 'todos' ? 'Todo' : 'Goal'}
            </Button>
          </div>
        </div>

        {mode === 'goals' && unfinishedGoals.length > 0 && (
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${showArchived ? 'bg-[#de6536]' : 'bg-black'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showArchived ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest cursor-pointer" onClick={() => setShowArchived(!showArchived)}>
              {showArchived ? 'Hide Unfinished' : `Show Unfinished (${unfinishedGoals.length})`}
            </span>
          </div>
        )}

        {selectedCalendarDate && (
          <Button variant="ghost" onClick={() => setSelectedCalendarDate(null)}>
            Clear Date Filter ({selectedCalendarDate})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <Loader />
            </div>
          ) : mode === 'todos' ? (
            <>
              <button
                type="button"
                onClick={() => setTodoFilter((prev) => (prev === 'Daywise' ? 'all' : 'Daywise'))}
                onPointerEnter={(e) => {
                  if (e.pointerType === 'mouse') setTodosHovered(true)
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType === 'mouse') setTodosHovered(false)
                }}
                onPointerDown={() => setTodosHovered(false)}
                className={`relative overflow-hidden w-full text-left rounded-lg border bg-card p-4 transition-colors ${todoFilter === 'Daywise' ? 'shadow border-black/20' : 'text-black border-gray-300 hover:border-black/20'}`}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 120%, rgba(253, 224, 71, 0.4) 0%, transparent 60%), radial-gradient(circle at 50% 130%, rgba(251, 191, 36, 0.4) 0%, transparent 70%), radial-gradient(circle at 50% 140%, rgba(244, 114, 182, 0.5) 0%, transparent 80%), linear-gradient(180deg, #ffffff 0%, #fff9eb 100%)', opacity: todosHovered || todoFilter === 'Daywise' ? 1 : 0,
                    transitionProperty: 'opacity',
                    transitionDuration: todoFilter === 'Daywise' ? '0ms' : '700ms',
                    transitionTimingFunction: 'ease-out',
                  }}
                />
                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xl sm:text-3xl font-bold">{todoFilter === 'Daywise' ? 'Weekly View' : 'Normal View'}</div>
                    <div className="text-xs sm:text-sm text-gray-600 font-semibold">{todoFilter === 'Daywise' ? 'Your week at a glance' : 'Click to open day-wise view'}
                    </div>
                  </div>
                </div>
              </button>

              {todoFilter === 'Daywise' ? (
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <div className="text-lg font-bold">Weekly ToDo List</div>
                      <div className="mt-1 text-2xl sm:text-3xl font-bold text-black">
                        {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d')}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button className="rounded-[4px] py-2 px-4 font-semibold bg-white text-black shadow hover:bg-black/5" onClick={() => setWeekStart((d) => addDays(d, -7))}>Prev</Button>
                      <Button className="rounded-[4px] py-2 px-4 font-semibold bg-white text-black shadow hover:bg-black/5" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>This week</Button>
                      <Button className="rounded-[4px] py-2 px-4 font-semibold bg-white text-black shadow hover:bg-black/5" onClick={() => setWeekStart((d) => addDays(d, 7))}>Next</Button>
                    </div>
                  </div>

                  <div className="mt-6 space-y-6">
                    {weekDays.map((day) => {
                      const key = format(day, 'yyyy-MM-dd')
                      const items = (weekDaywiseTodos.get(key) ?? []).slice().sort((a, b) => {
                        const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
                        const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
                        return aCreated - bCreated
                      })

                      const draft = inlineDraft[key] ?? ''
                      const isActive = activeInlineDate === key

                      return (
                        <div key={key}>
                          <div className="h-10 rounded-md bg-muted/80 flex items-center px-3 font-bold">
                            <span className='text-black font-bold text-2xl'>{format(day, 'EEE')}</span>
                          </div>

                          <div className="mt-2 space-y-2">
                            {items.map((item) => (
                              <div key={item.id} className="flex items-center gap-2 px-1">
                                <button
                                  type="button"
                                  onClick={() => onToggleStatus(item)}
                                  className="size-5 rounded border flex items-center justify-center"
                                  aria-label={item.status === 'done' ? 'Mark as to do' : 'Mark as done'}
                                >
                                  {item.status === 'done' ? <Check className="size-4" /> : null}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditTodoDialog(item)}
                                  className={`flex-1 text-left text-sm ${item.status === 'done' ? 'line-through text-muted-foreground' : ''}`}
                                >
                                  {item.title}
                                </button>
                                <Button size="icon" variant="ghost" onClick={() => onDelete(item)}>
                                  <Trash2 className="size-4 text-red-600" />
                                </Button>
                              </div>
                            ))}

                            {isActive ? (
                              <div className="flex items-center gap-2 px-1">
                                <div className="size-5 rounded border opacity-50" />
                                <Input
                                  autoFocus
                                  value={draft}
                                  placeholder="To-do"
                                  onChange={(e) => setInlineDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') void createDaywiseTodo(day, draft)
                                    if (e.key === 'Escape') setActiveInlineDate(null)
                                  }}
                                  onBlur={() => {
                                    if (draft.trim()) void createDaywiseTodo(day, draft)
                                    else setActiveInlineDate(null)
                                  }}
                                />
                              </div>
                            ) : null}

                            {isActive ? (
                              <div className="w-full text-left px-1 text-sm text-muted-foreground opacity-70 select-none">
                                + To-do
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActiveInlineDate(key)}
                                className="w-full text-left px-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                              >
                                + To-do
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : filteredTodos.length === 0 ? (
                <div className="text-sm text-muted-foreground">No todos found for selected filters.</div>
              ) : (
                filteredTodos.map((item) => (
                  <TodoRow
                    key={item.id}
                    item={item}
                    onEdit={() => openEditTodoDialog(item)}
                    onDelete={() => onDelete(item)}
                    onTogglePin={() => onTogglePin(item)}
                    onToggleStatus={() => onToggleStatus(item)}
                  />
                ))
              )}
            </>
          ) : filteredGoals.length === 0 ? (
            <div className="text-sm text-muted-foreground">No goals found for selected filters.</div>
          ) : (
            <>
              {showArchived && unfinishedGoals.length > 0 && (
                <div className="mb-8 space-y-4 p-4 rounded-xl border-2 border-dashed border-black/20 bg-black/5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
                      Unfinished from Past Periods
                    </h2>
                  </div>
                  <div className="hidden md:flex gap-4 p-3 overflow-x-auto pb-4 custom-scrollbar">
                    {unfinishedGoals.map((item) => (
                      <div key={item.id} className="relative group shrink-0">
                        <GoalSquareCard
                          item={item}
                          subGoals={subGoals.filter(sg => (sg.goal_meta as { parent_id?: string })?.parent_id === item.id)}
                          onClick={() => setSelectedGoal(item)}
                        />
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            rolloverGoal(item);
                          }}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-black text-white text-[10px] h-6 px-2 font-bold rounded shadow-lg transition-all z-10 hover:bg-black/80"
                        >
                          Rollover
                        </Button>
                      </div>
                    ))}
                  </div>
                  <MobileCarousel className="md:hidden py-3">
                    {unfinishedGoals.map((item) => (
                      <div key={item.id} className="relative group h-full">
                        <GoalSquareCard
                          item={item}
                          subGoals={subGoals.filter(sg => (sg.goal_meta as { parent_id?: string })?.parent_id === item.id)}
                          onClick={() => setSelectedGoal(item)}
                        />
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            rolloverGoal(item);
                          }}
                          className="absolute top-2 right-2 bg-black text-white text-[10px] h-6 px-2 font-bold rounded shadow-lg transition-all z-10 hover:bg-black/80"
                        >
                          Rollover
                        </Button>
                      </div>
                    ))}
                  </MobileCarousel>
                </div>
              )}

              {(['weekly', 'monthly', 'quarterly', 'long_term_custom'] as const).map((period) => {
                const periodGoals = filteredGoals.filter(g => g.goal_period === period)
                if (periodGoals.length === 0 && goalFilter !== 'all') return null

                return (
                  <div key={period} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-black uppercase tracking-tight text-black">
                        {period === 'long_term_custom' ? 'Long-term' : formatText(getPeriodRangeLabel(period))}
                      </h2>
                      <Button
                        onClick={() => {
                          openNewGoalDialog(period as GoalPeriod)
                          setSelectedPeriod(period)
                        }}
                        className="bg-black text-white hover:bg-black/80 h-8 px-3 text-xs font-bold rounded-[4px] shadow-none"
                      >
                        <Plus className="size-3" />
                        Add
                      </Button>
                    </div>

                    {periodGoals.length === 0 ? (
                      <div className="text-sm text-muted-foreground italic mb-10">No current {period} goals</div>
                    ) : (
                      <>
                        <div className="hidden md:flex gap-4 p-3 overflow-x-auto pb-4 custom-scrollbar">
                          {periodGoals.map((item) => (
                            <div key={item.id} className="shrink-0">
                              <GoalSquareCard
                                item={item}
                                subGoals={subGoals.filter(sg => (sg.goal_meta as { parent_id?: string })?.parent_id === item.id)}
                                onClick={() => setSelectedGoal(item)}
                                isExpiring={getIsExpiring(item)}
                              />
                            </div>
                          ))}
                        </div>
                        <MobileCarousel className="md:hidden py-3">
                          {periodGoals.map((item) => (
                            <div key={item.id} className="h-full">
                              <GoalSquareCard
                                item={item}
                                subGoals={subGoals.filter(sg => (sg.goal_meta as { parent_id?: string })?.parent_id === item.id)}
                                onClick={() => setSelectedGoal(item)}
                                isExpiring={getIsExpiring(item)}
                              />
                            </div>
                          ))}
                        </MobileCarousel>
                      </>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>

        <div className="hidden xl:block rounded-lg border bg-card p-2">
          <FullScreenCalendar data={calendarData} onDateClick={handleDateClick} />
          <div className="px-2 py-3 text-xs text-muted-foreground">
            Calendar shows all dated todos and goals.
          </div>
        </div>
      </div>

      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="max-w-xl p-2 sm:p-4">
          <DialogHeader>
            <DialogTitle>Calendar</DialogTitle>
          </DialogHeader>
          <FullScreenCalendar data={calendarData} onDateClick={(date) => { setCalendarOpen(false); handleDateClick(date); }} />
          <div className="px-2 py-3 text-xs text-muted-foreground">
            Calendar shows all dated todos and goals.
          </div>
        </DialogContent>
      </Dialog>

      <TodoDialog
        open={todoDialogOpen}
        onOpenChange={setTodoDialogOpen}
        value={todoForm}
        onValueChange={setTodoForm}
        onSubmit={submitTodo}
        isEdit={Boolean(editingTodo)}
      />

      <GoalDialog
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        value={goalForm}
        onValueChange={setGoalForm}
        onSubmit={submitGoal}
        isEdit={Boolean(editingGoal)}
        goalPeriod={selectedPeriod as GoalPeriod}
      />

      {selectedGoal && (
        <GoalDetailModal
          goal={selectedGoal}
          subGoals={subGoals.filter(sg => (sg.goal_meta as { parent_id?: string })?.parent_id === selectedGoal.id)}
          onClose={() => setSelectedGoal(null)}
          onEdit={() => {
            openEditGoalDialog(selectedGoal)
            setSelectedGoal(null)
          }}
          onDelete={() => {
            onDelete(selectedGoal)
            setSelectedGoal(null)
          }}
          onToggleSubGoal={async (subGoal) => {
            const nextStatus: TodoStatus = subGoal.status === 'done' ? 'todo' : 'done'
            setSubGoals(prev => prev.map(sg => sg.id === subGoal.id ? { ...sg, status: nextStatus } : sg))

            try {
              await toggleTodoStatus(subGoal.id, nextStatus)

              const updatedSubGoals = subGoals.map(sg => sg.id === subGoal.id ? { ...sg, status: nextStatus } : sg)
              const allDone = updatedSubGoals.every(sg => sg.status === 'done')

              if (allDone && selectedGoal.status !== 'done') {
                await toggleTodoStatus(selectedGoal.id, 'done')
                setGoals(prev => prev.map(g => g.id === selectedGoal.id ? { ...g, status: 'done' } : g))
                setSelectedGoal({ ...selectedGoal, status: 'done' })
                showToast('success', 'Goal completed!', 'All sub-goals are done.')
              } else if (!allDone && selectedGoal.status === 'done') {
                await toggleTodoStatus(selectedGoal.id, 'todo')
                setGoals(prev => prev.map(g => g.id === selectedGoal.id ? { ...g, status: 'todo' } : g))
                setSelectedGoal({ ...selectedGoal, status: 'todo' })
              }
            } catch (error) {
              await loadData()
              showToast('error', 'Update failed', error instanceof Error ? error.message : 'Something went wrong')
            }
          }}
        />
      )}

      {datePopup && (
        <DateDetailPopup
          date={datePopup.date}
          items={datePopup.items}
          onClose={() => setDatePopup(null)}
        />
      )}
    </div>
  )
}