'use client'

import { useState, useEffect, useMemo } from 'react'
import { getProjects, getAllProjectTasks } from '@/lib/actions/work'
import { ProjectCard } from '@/components/work/project-card'
import { MobileCarousel } from '@/components/money/mobile-carousel'
import Loader from '@/components/loader-animation'
import { showToast } from '@/components/toast'
import type { Project, ProjectTask } from '@/lib/types'
import Link from 'next/link'
import { format, isAfter, isBefore, addDays } from 'date-fns'

export default function WorkDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [p, t] = await Promise.all([getProjects(), getAllProjectTasks()])
      setProjects(p)
      setTasks(t)
    } catch (error) {
      showToast('error', 'Failed to load', error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const activeProjects = useMemo(() => projects.filter(p => p.status === 'active'), [projects])
  const completedProjects = useMemo(() => projects.filter(p => p.status === 'completed'), [projects])

  const totalTasks = tasks.length
  const doneTasks = tasks.filter(t => t.status === 'done').length
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
  const overallProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  // Tasks due in next 7 days
  const upcomingTasks = useMemo(() => {
    const now = new Date()
    const weekLater = addDays(now, 7)
    return tasks
      .filter(t => t.due_date && t.status !== 'done' && isBefore(new Date(t.due_date), weekLater) && isAfter(new Date(t.due_date), addDays(now, -1)))
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 8)
  }, [tasks])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl sm:text-7xl font-bold">Work</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Projects, tasks, and progress
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-black/[0.08] rounded-[12px] p-4">
          <p className="text-[9px] font-medium uppercase tracking-wider text-black/30">Projects</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold font-mono">{activeProjects.length}</p>
        </div>
        <div className="bg-white border border-black/[0.08] rounded-[12px] p-4">
          <p className="text-[9px] font-medium uppercase tracking-wider text-black/30">Total Tasks</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold font-mono">{totalTasks}</p>
        </div>
        <div className="bg-white border border-black/[0.08] rounded-[12px] p-4">
          <p className="text-[9px] font-medium uppercase tracking-wider text-black/30">Completed</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold font-mono text-emerald-600">{doneTasks}</p>
        </div>
        <div className="bg-white border border-black/[0.08] rounded-[12px] p-4">
          <p className="text-[9px] font-medium uppercase tracking-wider text-black/30">Progress</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold font-mono">{overallProgress}%</p>
        </div>
      </div>

      {/* Active Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-black/40">
            Active Projects
          </h2>
          <Link
            href="/work/projects"
            className="text-xs border border-[0.5px] border-black rounded-[4px] px-2 py-1 hover:bg-black hover:text-white transition-colors"
          >
            View all →
          </Link>
        </div>

        {activeProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-black/[0.08] rounded-[12px]">
            <p className="text-sm font-medium text-black/40">No active projects</p>
            <p className="text-xs text-black/25 mt-1">Create one to get started</p>
          </div>
        ) : (
          <>
            {/* Desktop grid */}
            <div className="hidden md:grid grid-cols-3 gap-3">
              {activeProjects.slice(0, 3).map(p => (
                <ProjectCard key={p.id} project={p} tasks={tasks} onEdit={() => {}} onDelete={() => {}} />
              ))}
            </div>
            {/* Mobile carousel */}
            <MobileCarousel>
              {activeProjects.map(p => (
                <ProjectCard key={p.id} project={p} tasks={tasks} onEdit={() => {}} onDelete={() => {}} />
              ))}
            </MobileCarousel>
          </>
        )}
      </div>

      {/* Upcoming Deadlines */}
      {upcomingTasks.length > 0 && (
        <div>
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-black/40 mb-4">
            Upcoming Deadlines
          </h2>
          <div className="bg-white border border-black/[0.08] rounded-[12px] divide-y divide-black/[0.05]">
            {upcomingTasks.map((task) => {
              const project = projects.find(p => p.id === task.project_id)
              return (
                <div key={task.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: project?.color || '#000' }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-black/75 truncate">{task.title}</p>
                      <p className="text-[10px] text-black/30">{project?.name}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-black/35 shrink-0 ml-3">
                    {format(new Date(task.due_date!), 'd MMM')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Completed Projects */}
      {completedProjects.length > 0 && (
        <div>
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-black/40 mb-4">
            Completed ({completedProjects.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 opacity-60">
            {completedProjects.slice(0, 3).map(p => (
              <ProjectCard key={p.id} project={p} tasks={tasks} onEdit={() => {}} onDelete={() => {}} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
