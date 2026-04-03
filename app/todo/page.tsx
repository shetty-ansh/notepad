'use client'

import { useEffect, useMemo, useState } from 'react'
import { addDays, format, isWithinInterval, startOfWeek } from 'date-fns'
import {
  CalendarDays,
  Check,
  Circle,
  Flag,
  Pin,
  PinOff,
  Plus,
  Target,
  Trash2,
  Pencil,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { DateWheelPicker } from '@/components/date-wheel-picker'
import { FullScreenCalendar } from '@/components/ui/fullscreen-calendar'
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

type Mode = 'todos' | 'goals'
type TodoFilter = 'all' | 'pinned' | 'daywise'
type GoalFilter = 'all' | GoalPeriod

type TodoFormState = {
  title: string
  note: string
}

type GoalFormState = {
  title: string
  status: TodoStatus
  priority: Priority
  dueDate: Date | null
  goalPeriod: GoalPeriod
  subGoals: string[]
}

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

function statusBadge(status: TodoStatus) {
  if (status === 'done') return <Badge className="bg-emerald-600">Done</Badge>
  if (status === 'in_progress') return <Badge className="bg-blue-600">In progress</Badge>
  return <Badge variant="secondary">To do</Badge>
}

function getTodoNote(todo: Todo): string {
  const meta = todo.goal_meta
  if (!meta || typeof meta !== 'object') return ''
  const note = (meta as { note?: unknown }).note
  return typeof note === 'string' ? note : ''
}

export default function TodoPage() {
  const [mode, setMode] = useState<Mode>('todos')
  const [todoFilter, setTodoFilter] = useState<TodoFilter>('daywise')
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
  const [subGoals, setSubGoals] = useState<Todo[]>([])
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [inlineDraft, setInlineDraft] = useState<Record<string, string>>({})
  const [activeInlineDate, setActiveInlineDate] = useState<string | null>(null)
  const [todosHovered, setTodosHovered] = useState(false)

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    if (todoFilter !== 'daywise') setTodosHovered(false)
  }, [todoFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [todoRows, goalRows] = await Promise.all([getTodosByType('task'), getTodosByType('goal')])
      setTodos(todoRows)
      // Filter out sub-goals from main goals list
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
    if (todoFilter === 'daywise') next = next.filter((t) => t.day_date)
    return next
  }, [todos, todoFilter])

  const filteredGoals = useMemo(() => {
    let next = [...goals]
    if (goalFilter !== 'all') next = next.filter((g) => g.goal_period === goalFilter)
    if (selectedCalendarDate) next = next.filter((g) => g.due_date === selectedCalendarDate)
    return next
  }, [goals, goalFilter, selectedCalendarDate])

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
    const source = mode === 'todos' ? filteredTodos : filteredGoals
    const byDate = new Map<string, { id: number; name: string; time: string; datetime: string }[]>()
    source.forEach((item, index) => {
      const date = mode === 'goals' ? item.due_date : null
      if (!date) return
      const list = byDate.get(date) ?? []
      list.push({
        id: index + 1,
        name: item.title,
        time: mode === 'goals' ? (item.goal_period ?? 'goal') : (item.priority ?? 'task'),
        datetime: date,
      })
      byDate.set(date, list)
    })

    return Array.from(byDate.entries()).map(([date, events]) => ({
      day: new Date(date),
      events,
    }))
  }, [filteredGoals, filteredTodos, mode])

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

  const openNewGoalDialog = () => {
    setEditingGoal(null)
    setGoalForm(defaultGoalForm)
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

        // Handle sub-goals
        const existingSubGoals = subGoals.filter(sg => (sg.goal_meta as { parent_id?: string })?.parent_id === editingGoal.id)
        const existingTitles = existingSubGoals.map(sg => sg.title)
        const newSubGoalTitles = goalForm.subGoals.filter(title => !existingTitles.includes(title))
        
        // Create new sub-goals
        for (const title of newSubGoalTitles) {
          const created = await createTodo({
            title,
            type: 'goal',
            status: 'todo',
            priority: goalForm.priority,
            goal_period: goalForm.goalPeriod,
            goal_meta: { parent_id: editingGoal.id },
          })
          setSubGoals(prev => [...prev, created])
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

        // Create sub-goals
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
      // Re-sort by pinned status and creation date
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

  return (
    <div className="h-full overflow-y-auto px-4 py-4 sm:p-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-6xl font-bold">ToDo Workspace</h1>
          {/* <p className="text-2xl text-black">Manage daily tasks and period-based goals in one place.</p> */}
        </div>
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
            onClick={mode === 'todos' ? openNewTodoDialog : openNewGoalDialog}
          >
            <Plus className="size-4 mr-1" />
            {mode === 'todos' ? 'Add Todo' : 'Add Goal'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex w-full bg-[#e4dfcc] p-2 rounded-[6px] gap-2 border border-[#faf2d7] shadow-[0px_0px_10px_0px_rgba(255,255,255,)] ">
          <button
            onClick={() => setMode('todos')}
            className={`w-1/2 py-2 text-md font-semibold rounded-[4px] ${mode === 'todos' ? 'bg-[#de6536] shadow text-white border border-gray-200' : 'bg-transparent hover:bg-[#0D1717]/10'
              }`}
          >
            TODOS
          </button>
          <button
            onClick={() => setMode('goals')}
            className={`w-1/2 py-2 text-md font-semibold rounded-[4px] ${mode === 'goals' ? 'bg-[#de6536] shadow text-white border border-gray-200' : 'bg-transparent hover:bg-[#0D1717]/10'
              }`}
          >
            GOALS
          </button>
        </div>
        {mode === 'todos' ? (
          <>
            <Button className={`rounded-[4px] py-2 px-3 sm:py-4 sm:px-6 font-bold ${todoFilter === 'all' ? 'bg-black text-white shadow' : 'bg-white text-black border-gray-300  '}`} onClick={() => setTodoFilter('all')}>All</Button>
            <Button className={`rounded-[4px] py-2 px-3 sm:py-4 sm:px-6 font-bold ${todoFilter === 'pinned' ? 'bg-black text-white shadow' : 'bg-white text-black border-gray-300  '}`} onClick={() => setTodoFilter('pinned')}>Pinned</Button>
          </>
        ) : (
          <>
            <Button className={`rounded-[4px] py-2 px-3 sm:py-4 sm:px-6 font-bold ${goalFilter === 'all' ? 'bg-black text-white shadow' : 'bg-white text-black border-gray-300  '}`} onClick={() => setGoalFilter('all')}>All</Button>
            <Button className={`rounded-[4px] py-2 px-3 sm:py-4 sm:px-6 font-bold ${goalFilter === 'weekly' ? 'bg-black text-white shadow' : 'bg-white text-black border-gray-300  '}`} onClick={() => setGoalFilter('weekly')}>Weekly</Button>
            <Button className={`rounded-[4px] py-2 px-3 sm:py-4 sm:px-6 font-bold ${goalFilter === 'monthly' ? 'bg-black text-white shadow' : 'bg-white text-black border-gray-300  '}`} onClick={() => setGoalFilter('monthly')}>Monthly</Button>
            <Button className={`rounded-[4px] py-2 px-3 sm:py-4 sm:px-6 font-bold ${goalFilter === 'quarterly' ? 'bg-black text-white shadow' : 'bg-white text-black border-gray-300  '}`} onClick={() => setGoalFilter('quarterly')}>Quarterly</Button>
            <Button
              className={`rounded-[6px] py-2 px-3 sm:py-4 sm:px-6 font-bold ${goalFilter === 'long_term_custom' ? 'bg-black text-white shadow' : 'bg-white text-black border-gray-300  '}`}
              onClick={() => setGoalFilter('long_term_custom')}
            >
              Long-term
            </Button>
          </>
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
                onClick={() => setTodoFilter((prev) => (prev === 'daywise' ? 'all' : 'daywise'))}
                onPointerEnter={(e) => {
                  if (e.pointerType === 'mouse') setTodosHovered(true)
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType === 'mouse') setTodosHovered(false)
                }}
                onPointerDown={() => setTodosHovered(false)}
                className={`relative overflow-hidden w-full text-left rounded-lg border bg-card p-4 transition-colors ${todoFilter === 'daywise' ? 'shadow border-black/20' : 'text-black border-gray-300 hover:border-black/20'}`}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 120%, rgba(253, 224, 71, 0.4) 0%, transparent 60%), radial-gradient(circle at 50% 130%, rgba(251, 191, 36, 0.4) 0%, transparent 70%), radial-gradient(circle at 50% 140%, rgba(244, 114, 182, 0.5) 0%, transparent 80%), linear-gradient(180deg, #ffffff 0%, #fff9eb 100%)', opacity: todosHovered || todoFilter === 'daywise' ? 1 : 0,
                    transitionProperty: 'opacity',
                    transitionDuration: todoFilter === 'daywise' ? '0ms' : '700ms',
                    transitionTimingFunction: 'ease-out',
                  }}
                />
                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xl sm:text-3xl font-bold">{todoFilter === 'daywise' ? 'Weekly View' : 'Normal View'}</div>
                    <div className="text-xs sm:text-sm text-gray-600 font-semibold">{todoFilter === 'daywise' ? 'Your week at a glance' : 'Click to open day-wise view'}
                    </div>
                  </div>
                </div>
              </button>

              {todoFilter === 'daywise' ? (
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <div className="text-lg font-bold">Weekly ToDo List</div>
                      <div className="mt-1 text-2xl sm:text-3xl font-bold text-[#de6536]">
                        {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d')}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button className="rounded-[4px] py-2 px-4 font-semibold bg-white text-black shadow hover:bg-[#de6536]/40" onClick={() => setWeekStart((d) => addDays(d, -7))}>Prev</Button>
                      <Button className="rounded-[4px] py-2 px-4 font-semibold bg-white text-black shadow hover:bg-[#de6536]/40" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>This week</Button>
                      <Button className="rounded-[4px] py-2 px-4 font-semibold bg-white text-black shadow hover:bg-[#de6536]/40" onClick={() => setWeekStart((d) => addDays(d, 7))}>Next</Button>
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

                            {/* Keep "+ To-do" visible even while typing */}
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
              )
              }
            </>
          ) : filteredGoals.length === 0 ? (
            <div className="text-sm text-muted-foreground">No goals found for selected filters.</div>
          ) : (
            <>
              {(['weekly', 'monthly', 'quarterly', 'long_term_custom'] as const).map((period) => {
                const periodGoals = filteredGoals.filter(g => g.goal_period === period)
                if (periodGoals.length === 0 && goalFilter !== 'all') return null
                
                return (
                  <div key={period} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black">
                        {toTitle(period as GoalPeriod)}
                      </h2>
                      <Button
                        onClick={() => {
                          setGoalForm({ ...defaultGoalForm, goalPeriod: period as GoalPeriod })
                          openNewGoalDialog()
                        }}
                        className="bg-[#de6536] text-white hover:bg-[#c55530] h-8 px-3 text-xs font-bold rounded-[6px] shadow-none"
                      >
                        <Plus className="size-3 mr-1" />
                        Add
                      </Button>
                    </div>
                    
                    {periodGoals.length === 0 ? (
                      <div className="text-sm text-muted-foreground italic">No {period} goals yet</div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {periodGoals.map((item) => (
                          <GoalSquareCard
                            key={item.id}
                            item={item}
                            subGoals={subGoals.filter(sg => (sg.goal_meta as { parent_id?: string })?.parent_id === item.id)}
                            onClick={() => setSelectedGoal(item)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div >

        <div className="hidden xl:block rounded-lg border bg-card p-2">
          <FullScreenCalendar data={calendarData} />
          <div className="px-2 py-3 text-xs text-muted-foreground">
            Calendar mirrors goal target dates.
          </div>
        </div>
      </div >

      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="max-w-xl p-2 sm:p-4">
          <DialogHeader>
            <DialogTitle>Calendar</DialogTitle>
          </DialogHeader>
          <FullScreenCalendar data={calendarData} />
          <div className="px-2 py-3 text-xs text-muted-foreground">
            Calendar mirrors goal target dates.
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
              
              // Check if all sub-goals are done
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
    </div >
  )
}

function TodoRow({
  item,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleStatus,
}: {
  item: Todo
  onEdit: () => void
  onDelete: () => void
  onTogglePin: () => void
  onToggleStatus: () => void
}) {
  const note = getTodoNote(item)
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{item.title}</p>
            {item.is_pinned ? <Pin className="size-4 text-amber-500" /> : null}
          </div>
          {note ? <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{note}</p> : null}
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            {statusBadge((item.status as TodoStatus) ?? 'todo')}
            <Badge variant="outline">{item.priority ?? 'medium'}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={onToggleStatus}>
            {item.status === 'done' ? <Check className="size-4" /> : <Circle className="size-4" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={onTogglePin}>
            {item.is_pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={onEdit}>
            <Pencil className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete}>
            <Trash2 className="size-4 text-red-600" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function GoalCardRow({
  item,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleStatus,
}: {
  item: Todo
  onEdit: () => void
  onDelete: () => void
  onTogglePin: () => void
  onToggleStatus: () => void
}) {
  return (
    <div className="border border-grey-900 border-2 rounded-[6px] p-4 cursor-pointer hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="size-5 text-indigo-500" />
          <h3 className="text-base md:text-2xl font-bold text-black truncate">
            {item.title}
          </h3>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleStatus}
            className="text-black hover:text-white hover:bg-black p-2 rounded-full"
            title={item.status === 'done' ? 'Mark as to do' : 'Mark as done'}
          >
            {item.status === 'done' ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onTogglePin}
            className="text-black hover:text-white hover:bg-black p-2 rounded-full"
            title={item.is_pinned ? 'Unpin' : 'Pin'}
          >
            {item.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="text-black hover:text-white hover:bg-black p-2 rounded-full"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-red-600 hover:text-white hover:bg-red-600 p-2 rounded-full"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
        {statusBadge((item.status as TodoStatus) ?? 'todo')}
        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
          {toTitle(((item.goal_period as GoalPeriod) ?? 'weekly'))}
        </Badge>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          <Flag className="size-3 mr-1" />
          {item.priority ?? 'medium'}
        </Badge>
        {item.due_date && (
          <span className="text-black font-mono font-semibold">
            Target: {item.due_date}
          </span>
        )}
      </div>
    </div>
  )
}

function GoalSquareCard({ item, subGoals, onClick }: { item: Todo; subGoals: Todo[]; onClick: () => void }) {
  const completedCount = subGoals.filter(sg => sg.status === 'done').length
  const totalCount = subGoals.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <button
      onClick={onClick}
      className="aspect-square border-2 border-black rounded-[8px] p-4 hover:shadow-lg transition-all bg-white hover:bg-[#fff9eb] flex flex-col items-center justify-center text-center group"
    >
      <h3 className="text-sm sm:text-base font-black text-black line-clamp-3 group-hover:text-[#de6536] transition-colors">
        {item.title}
      </h3>
      {totalCount > 0 && (
        <div className="mt-3 w-full">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1AB394] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs font-bold text-gray-600 mt-1">
            {completedCount}/{totalCount}
          </p>
        </div>
      )}
    </button>
  )
}

function TodoDialog({
  open,
  onOpenChange,
  value,
  onValueChange,
  onSubmit,
  isEdit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: TodoFormState
  onValueChange: (value: TodoFormState) => void
  onSubmit: () => Promise<void>
  isEdit: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Todo' : 'Create Todo'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Title"
            value={value.title}
            onChange={(e) => onValueChange({ ...value, title: e.target.value })}
          />
          <div className="rounded-lg border bg-card p-3">
            <textarea
              rows={6}
              className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Take a note..."
              value={value.note}
              onChange={(e) => onValueChange({ ...value, note: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button
              onClick={() => void onSubmit()}
              disabled={!value.title.trim()}
            >
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function GoalDialog({
  open,
  onOpenChange,
  value,
  onValueChange,
  onSubmit,
  isEdit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: GoalFormState
  onValueChange: (value: GoalFormState) => void
  onSubmit: () => Promise<void>
  isEdit: boolean
}) {
  const [newSubGoal, setNewSubGoal] = useState('')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">{isEdit ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Goal Title</label>
            <Input
              placeholder="Enter goal title"
              value={value.title}
              onChange={(e) => onValueChange({ ...value, title: e.target.value })}
              className="font-semibold"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Status</label>
              <Select value={value.status} onValueChange={(v) => onValueChange({ ...value, status: v as TodoStatus })}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To do</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Priority</label>
              <Select value={value.priority} onValueChange={(v) => onValueChange({ ...value, priority: v as Priority })}>
                <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Period</label>
              <Select
                value={value.goalPeriod}
                onValueChange={(v) => onValueChange({ ...value, goalPeriod: v as GoalPeriod })}
              >
                <SelectTrigger><SelectValue placeholder="Period" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="long_term_custom">Long-term</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border-2 border-black p-3 bg-[#fff9eb]">
            <p className="text-sm font-bold mb-2">Target Date</p>
            <DateWheelPicker
              value={value.dueDate ?? new Date()}
              onChange={(d) => onValueChange({ ...value, dueDate: d })}
              maxYear={2100}
              minYear={2000}
            />
            <Button variant="ghost" className="mt-2 text-xs" onClick={() => onValueChange({ ...value, dueDate: null })}>
              Clear target date
            </Button>
          </div>

          <div className="rounded-md border-2 border-black p-3 bg-white">
            <p className="text-sm font-bold mb-2">Sub-Goals (Tasks to complete)</p>
            <div className="space-y-2 mb-3">
              {value.subGoals.map((sg, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                  <span className="flex-1 text-sm font-medium">{sg}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onValueChange({ ...value, subGoals: value.subGoals.filter((_, i) => i !== idx) })}
                    className="h-6 w-6"
                  >
                    <Trash2 className="size-3 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a sub-goal..."
                value={newSubGoal}
                onChange={(e) => setNewSubGoal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSubGoal.trim()) {
                    onValueChange({ ...value, subGoals: [...value.subGoals, newSubGoal.trim()] })
                    setNewSubGoal('')
                  }
                }}
                className="text-sm"
              />
              <Button
                onClick={() => {
                  if (newSubGoal.trim()) {
                    onValueChange({ ...value, subGoals: [...value.subGoals, newSubGoal.trim()] })
                    setNewSubGoal('')
                  }
                }}
                className="bg-[#de6536] hover:bg-[#c55530] text-white"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="font-bold">Cancel</Button>
            <Button
              onClick={() => void onSubmit()}
              className="bg-black text-white hover:bg-[#de6536] font-bold"
            >
              {isEdit ? 'Save Changes' : 'Create Goal'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function GoalDetailModal({
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,20,50,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[12px] overflow-hidden bg-white shadow-xl border-4 border-black"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b-4 border-black bg-[#fff9eb]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black text-white hover:bg-[#de6536] transition-colors font-bold"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-start gap-3 pr-12">
            <Target className="size-8 text-[#de6536] flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-2xl sm:text-3xl font-black text-black mb-2">{goal.title}</h3>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {statusBadge((goal.status as TodoStatus) ?? 'todo')}
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold">
                  {toTitle(((goal.goal_period as GoalPeriod) ?? 'weekly'))}
                </Badge>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-bold">
                  <Flag className="size-3 mr-1" />
                  {goal.priority ?? 'medium'}
                </Badge>
                {goal.due_date && (
                  <span className="text-black font-mono font-bold">
                    Target: {goal.due_date}
                  </span>
                )}
              </div>
            </div>
          </div>

          {totalCount > 0 && (
            <div className="mt-4">
              <div className="h-6 bg-gray-200 rounded-full overflow-hidden border-2 border-black">
                <div
                  className="h-full bg-[#1AB394] rounded-full transition-all flex items-center justify-end pr-2"
                  style={{ width: `${progress}%` }}
                >
                  {progress > 20 && (
                    <span className="text-xs font-black text-white">{Math.round(progress)}%</span>
                  )}
                </div>
              </div>
              <p className="text-sm font-bold text-gray-600 mt-2">
                {completedCount} of {totalCount} sub-goals completed
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-black uppercase tracking-wide text-black">Sub-Goals</h4>
            <div className="flex gap-2">
              <Button
                onClick={onEdit}
                className="h-8 px-3 text-xs bg-black text-white hover:bg-[#de6536] rounded-[6px] font-bold"
              >
                <Pencil className="size-3 mr-1" />
                Edit
              </Button>
              <Button
                onClick={onDelete}
                className="h-8 px-3 text-xs bg-red-600 text-white hover:bg-red-700 rounded-[6px] font-bold"
              >
                <Trash2 className="size-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>

          {subGoals.length === 0 ? (
            <div className="py-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                No sub-goals added yet
              </p>
              <Button onClick={onEdit} variant="ghost" className="mt-2 text-xs font-bold">
                Add sub-goals to track progress
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {subGoals.map((subGoal) => (
                <div
                  key={subGoal.id}
                  className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-black transition-colors bg-white"
                >
                  <button
                    type="button"
                    onClick={() => onToggleSubGoal(subGoal)}
                    className={`size-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      subGoal.status === 'done'
                        ? 'bg-[#1AB394] border-[#1AB394]'
                        : 'border-gray-400 hover:border-black'
                    }`}
                    aria-label={subGoal.status === 'done' ? 'Mark as to do' : 'Mark as done'}
                  >
                    {subGoal.status === 'done' ? <Check className="size-4 text-white" /> : null}
                  </button>
                  <span
                    className={`flex-1 font-semibold ${
                      subGoal.status === 'done' ? 'line-through text-gray-400' : 'text-black'
                    }`}
                  >
                    {subGoal.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

