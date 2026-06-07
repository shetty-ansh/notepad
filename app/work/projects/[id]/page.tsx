'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Edit2, Plus, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react'
import { getProject, getProjectTasks, createProjectTask, updateProjectTask, deleteProjectTask, updateProject } from '@/lib/actions/work'
import { TaskRow } from '@/components/work/task-row'
import { TaskDialog } from '@/components/work/task-dialog'
import { ProjectDialog } from '@/components/work/project-dialog'
import Loader from '@/components/loader-animation'
import { showToast } from '@/components/toast'
import type { Project, ProjectTask } from '@/lib/types'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const projectId = id as string

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [loading, setLoading] = useState(true)

  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [inlineDraft, setInlineDraft] = useState('')
  const [inlineDraftActive, setInlineDraftActive] = useState(false)

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    try {
      const [pData, tData] = await Promise.all([
        getProject(projectId),
        getProjectTasks(projectId),
      ])
      setProject(pData)
      setTasks(tData)
    } catch (error) {
      showToast('error', 'Failed to load', error instanceof Error ? error.message : 'Something went wrong')
      router.push('/work/projects')
    } finally {
      setLoading(false)
    }
  }

  const topLevelTasks = useMemo(() => tasks.filter(t => !t.parent_task_id), [tasks])
  const doneCount = tasks.filter(t => t.status === 'done').length
  const totalCount = tasks.length
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const handleSaveTask = async (data: { title: string; description: string; priority: string; due_date: string | null; parent_task_id: string | null }) => {
    try {
      if (editingTask) {
        const updated = await updateProjectTask(editingTask.id, data)
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
        showToast('success', 'Updated', 'Task saved.')
      } else {
        const created = await createProjectTask({ ...data, project_id: projectId })
        setTasks(prev => [...prev, created])
        showToast('success', 'Created', 'New task added.')
      }
      setTaskDialogOpen(false)
      setEditingTask(null)
    } catch (error) {
      showToast('error', 'Failed to save', error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    const prev = tasks
    setTasks(tasks.filter(t => t.id !== taskId && t.parent_task_id !== taskId))
    try {
      await deleteProjectTask(taskId)
      showToast('success', 'Deleted', 'Task removed.')
    } catch {
      setTasks(prev)
      showToast('error', 'Delete failed', 'Could not delete task.')
    }
  }

  const handleToggleTask = async (taskId: string, status: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
    try {
      await updateProjectTask(taskId, { status })
    } catch {
      loadData()
    }
  }

  const handleSaveProject = async (data: { name: string; description: string; color: string; priority: string; due_date: string | null; status: string }) => {
    try {
      const updated = await updateProject(projectId, data)
      setProject(updated)
      setProjectDialogOpen(false)
      showToast('success', 'Updated', 'Project settings saved.')
    } catch (error) {
      showToast('error', 'Failed to save', error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  const handleInlineAdd = async () => {
    if (!inlineDraft.trim()) {
      setInlineDraftActive(false)
      return
    }
    try {
      const created = await createProjectTask({
        project_id: projectId,
        title: inlineDraft.trim(),
        priority: 'medium',
      })
      setTasks(prev => [...prev, created])
      setInlineDraft('')
    } catch (error) {
      showToast('error', 'Failed to add task', 'Something went wrong')
    }
  }

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-[#fcfbf8]">
      {/* Back button area */}
      <div className="sticky top-0 z-10 bg-[#fcfbf8]/80 backdrop-blur-md px-4 py-3 border-b border-black/[0.05]">
        <button
          onClick={() => router.push('/work/projects')}
          className="flex items-center gap-1.5 text-xs font-semibold text-black/40 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-8">
        {/* Project Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color || '#000' }} />
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-black">{project.name}</h1>
              </div>
              {project.description && (
                <p className="text-sm text-black/50 leading-relaxed max-w-xl pl-5.5">
                  {project.description}
                </p>
              )}
            </div>
            <button
              onClick={() => setProjectDialogOpen(true)}
              className="p-2 rounded-md border border-black/10 text-black/40 hover:text-black hover:border-black/30 transition-all shrink-0"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 pl-5.5 text-xs text-black/40 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="capitalize">{project.status}</span>
            </div>
            {project.due_date && (
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" />
                Due {new Date(project.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full bg-black/20`} />
              <span className="capitalize">{project.priority} priority</span>
            </div>
          </div>

          {/* Progress */}
          <div className="pl-5.5 pt-2">
            <div className="flex justify-between mb-1.5">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-black/30">Progress</span>
              <span className="text-[10px] font-mono text-black/40">{progress}% ({doneCount}/{totalCount})</span>
            </div>
            <div className="h-1.5 bg-black/[0.05] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: project.color || '#000' }}
              />
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-black/[0.05]" />

        {/* Tasks List */}
        <div>
          <div className="flex items-center justify-between mb-4 pl-5.5">
            <h2 className="text-lg font-bold text-black tracking-tight">Tasks</h2>
          </div>

          <div className="space-y-1">
            {topLevelTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                subtasks={tasks.filter(t => t.parent_task_id === task.id)}
                allTasks={tasks}
                onToggleStatus={handleToggleTask}
                onEdit={(t) => { setEditingTask(t); setTaskDialogOpen(true); }}
                onDelete={handleDeleteTask}
              />
            ))}

            {/* Inline Add */}
            <div className="pl-[26px] mt-2">
              {inlineDraftActive ? (
                <div className="flex items-center gap-2 py-1">
                  <div className="w-4.5 h-4.5 rounded border border-black/20 opacity-50 shrink-0" />
                  <input
                    type="text"
                    value={inlineDraft}
                    onChange={(e) => setInlineDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleInlineAdd()
                      if (e.key === 'Escape') setInlineDraftActive(false)
                    }}
                    onBlur={handleInlineAdd}
                    placeholder="New task..."
                    className="flex-1 text-sm bg-transparent outline-none border-b border-black/10 focus:border-black/30 pb-0.5"
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  onClick={() => setInlineDraftActive(true)}
                  className="flex items-center gap-2 py-1 text-sm text-black/30 hover:text-black/60 transition-colors group"
                >
                  <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Add task
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FAB (fallback for explicit task creation) */}
      <button
        onClick={() => { setEditingTask(null); setTaskDialogOpen(true) }}
        className="fixed bottom-6 right-6 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:bg-black/80 transition-transform hover:scale-105 active:scale-95 z-50 md:hidden"
        aria-label="New Task"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* Dialogs */}
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={(open) => {
          setTaskDialogOpen(open)
          if (!open) setTimeout(() => setEditingTask(null), 200)
        }}
        task={editingTask ? {
          title: editingTask.title,
          description: editingTask.description || '',
          priority: editingTask.priority || 'medium',
          due_date: editingTask.due_date || '',
          parent_task_id: editingTask.parent_task_id || null,
        } : null}
        parentOptions={tasks.filter(t => !t.parent_task_id && t.id !== editingTask?.id).map(t => ({ id: t.id, title: t.title }))}
        onSave={handleSaveTask}
      />

      <ProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        project={{
          name: project.name,
          description: project.description || '',
          color: project.color || '#000000',
          priority: project.priority || 'medium',
          due_date: project.due_date || '',
          status: project.status || 'active',
        }}
        onSave={handleSaveProject}
      />
    </div>
  )
}
