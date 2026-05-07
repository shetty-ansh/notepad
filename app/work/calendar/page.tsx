'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { getAllProjectTasks, getProjects, updateProjectTask } from '@/lib/actions/work'
import type { Project, ProjectTask } from '@/lib/types'
import Loader from '@/components/loader-animation'
import { showToast } from '@/components/toast'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'

export default function WorkCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [tData, pData] = await Promise.all([
        getAllProjectTasks(),
        getProjects()
      ])
      setTasks(tData)
      setProjects(pData)
    } catch (error) {
      showToast('error', 'Failed to load', error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done'
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    try {
      await updateProjectTask(taskId, { status: newStatus })
    } catch {
      loadData() // revert on fail
    }
  }

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between py-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-black flex items-center gap-2">
          {format(currentMonth, 'MMMM yyyy')}
          {selectedDate && !isSameMonth(selectedDate, currentMonth) && (
            <button
              onClick={() => {
                setCurrentMonth(selectedDate)
                setIsPopupOpen(true)
              }}
              className="text-[10px] bg-black/5 text-black/40 px-2 py-0.5 rounded-full hover:bg-black/10 transition-colors"
            >
              Back to selection
            </button>
          )}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-full hover:bg-black/5 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-black/60" />
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-full hover:bg-black/5 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-black/60" />
          </button>
        </div>
      </div>
    )
  }

  const renderDays = () => {
    const days = []
    const startDate = startOfWeek(currentMonth, { weekStartsOn: 1 })
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center text-[10px] font-semibold tracking-widest uppercase text-black/30 py-2">
          {format(addDays(startDate, i), 'EEE')}
        </div>
      )
    }
    return <div className="grid grid-cols-7 border-b border-black/[0.05]">{days}</div>
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const rows = []
    let days = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day
        const isCurrentMonth = isSameMonth(day, monthStart)
        const isToday = isSameDay(day, new Date())
        const isSelected = selectedDate ? isSameDay(day, selectedDate) : false

        const dayTasks = tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), currentDay))

        days.push(
          <div
            key={day.toString()}
            onClick={() => {
              setSelectedDate(currentDay)
              setIsPopupOpen(true)
            }}
            className={`
              relative min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 border-r border-b border-black/[0.05] cursor-pointer transition-all
              ${!isCurrentMonth ? 'bg-black/[0.02] text-black/30' : 'bg-white text-black hover:bg-black/[0.02]'}
              ${isSelected ? 'bg-black/[0.04]' : ''}
            `}
          >
            <div className="flex justify-between items-start">
              <span className={`
                text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                ${isToday ? 'bg-black text-white' : ''}
              `}>
                {format(day, 'd')}
              </span>
            </div>
            
            {/* Task dots/indicators */}
            <div className="mt-1 space-y-1">
              {dayTasks.slice(0, 3).map((task, idx) => {
                const project = projects.find(p => p.id === task.project_id)
                const isDone = task.status === 'done'
                return (
                  <div key={idx} className="flex items-center gap-1">
                    <div 
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDone ? 'opacity-40' : ''}`} 
                      style={{ backgroundColor: project?.color || '#000' }} 
                    />
                    <span className={`text-[9px] truncate hidden sm:block ${isDone ? 'line-through text-black/30' : 'text-black/60'}`}>
                      {task.title}
                    </span>
                  </div>
                )
              })}
              {dayTasks.length > 3 && (
                <div className="text-[9px] text-black/40 pl-2.5">+{dayTasks.length - 3} more</div>
              )}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      )
      days = []
    }
    return <div className="border-l border-t border-black/[0.05]">{rows}</div>
  }

  // Tasks for selected day
  const selectedDayTasks = selectedDate 
    ? tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), selectedDate))
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-3xl sm:text-5xl font-bold">Calendar</h1>
        <p className="text-sm text-gray-600 mt-1">Project task deadlines</p>
      </div>

      <div className="flex-1 bg-white border border-black/[0.08] rounded-2xl p-4 sm:p-6 overflow-y-auto">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>

      {/* Date detail popup */}
      <DialogPrimitive.Root open={isPopupOpen} onOpenChange={setIsPopupOpen}>
        <AnimatePresence>
          {isPopupOpen && (
            <DialogPrimitive.Portal forceMount>
              <DialogPrimitive.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
                />
              </DialogPrimitive.Overlay>
              <DialogPrimitive.Content asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ type: "spring", duration: 0.4, bounce: 0 }}
                  className="fixed z-50 left-[50%] top-[50%] w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-white shadow-2xl p-6 outline-none"
                >
                  <DialogPrimitive.Title className="text-sm font-semibold tracking-tight text-black mb-1">
                    {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : ''}
                  </DialogPrimitive.Title>
                  <p className="text-[11px] text-black/40 mb-6 font-medium">
                    {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'task' : 'tasks'} due
                  </p>

                  <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-2">
                    {selectedDayTasks.length > 0 ? (
                      selectedDayTasks.map(task => {
                        const project = projects.find(p => p.id === task.project_id)
                        const isDone = task.status === 'done'
                        
                        return (
                          <div key={task.id} className="flex items-center gap-3 py-2 group">
                            <button
                              onClick={() => handleToggleTaskStatus(task.id, task.status || 'todo')}
                              className={`
                                w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all
                                ${isDone ? 'bg-black border-black' : 'border-black/20 hover:border-black/40'}
                              `}
                            >
                              {isDone && <Check className="w-3 h-3 text-white" />}
                            </button>
                            
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm truncate transition-colors ${isDone ? 'line-through text-black/30' : 'text-black/80'}`}>
                                {task.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <div 
                                  className="w-1.5 h-1.5 rounded-full shrink-0" 
                                  style={{ backgroundColor: project?.color || '#000' }} 
                                />
                                <p className="text-[9px] text-black/40 truncate uppercase tracking-wide font-medium">
                                  {project?.name}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="py-8 text-center">
                        <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-2">
                          <Check className="w-4 h-4 text-black/20" />
                        </div>
                        <p className="text-[11px] font-medium text-black/40">Nothing due on this day</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          )}
        </AnimatePresence>
      </DialogPrimitive.Root>
    </div>
  )
}
