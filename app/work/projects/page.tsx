'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { getProjects, createProject, updateProject, deleteProject, getAllProjectTasks } from '@/lib/actions/work'
import { ProjectCard } from '@/components/work/project-card'
import { ProjectDialog } from '@/components/work/project-dialog'
import Loader from '@/components/loader-animation'
import { showToast } from '@/components/toast'
import type { Project, ProjectTask } from '@/lib/types'

type StatusFilter = 'all' | 'active' | 'completed' | 'archived'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('active')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

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

  const filtered = useMemo(() => {
    if (filter === 'all') return projects
    return projects.filter(p => p.status === filter)
  }, [projects, filter])

  const handleSave = async (data: { name: string; description: string; color: string; priority: string; due_date: string | null; status: string }) => {
    try {
      if (editingProject) {
        const updated = await updateProject(editingProject.id, data)
        setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
        showToast('success', 'Updated', 'Project saved.')
      } else {
        const created = await createProject(data)
        setProjects(prev => [created, ...prev])
        showToast('success', 'Created', 'New project added.')
      }
      setDialogOpen(false)
      setEditingProject(null)
    } catch (error) {
      showToast('error', 'Failed to save', error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  const handleDelete = async (id: string) => {
    const prev = projects
    setProjects(projects.filter(p => p.id !== id))
    try {
      await deleteProject(id)
      showToast('success', 'Deleted', 'Project removed.')
    } catch {
      setProjects(prev)
      showToast('error', 'Delete failed', 'Could not delete project.')
    }
  }

  const openEdit = (project: Project) => {
    setEditingProject(project)
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl sm:text-5xl font-bold">Projects</h1>
          <p className="text-sm text-gray-600 mt-1">{projects.length} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['all', 'active', 'completed', 'archived'] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border whitespace-nowrap transition-all capitalize ${
              filter === f
                ? 'bg-black text-white border-black'
                : 'bg-transparent text-black/40 border-black/10 hover:border-black/25'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-medium text-black/40">
            No {filter !== 'all' ? filter : ''} projects
          </p>
          <p className="text-xs text-black/25 mt-1">Tap + to create one</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              tasks={tasks}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => { setEditingProject(null); setDialogOpen(true) }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-[0_4px_14px_0_rgba(0,0,0,0.25)] hover:bg-gray-800 transition-transform duration-200 hover:scale-[1.05] active:scale-95 z-50"
        aria-label="New Project"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Dialog */}
      <ProjectDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setTimeout(() => setEditingProject(null), 200)
        }}
        project={editingProject ? {
          name: editingProject.name,
          description: editingProject.description || '',
          color: editingProject.color || '#000000',
          priority: editingProject.priority || 'medium',
          due_date: editingProject.due_date || '',
          status: editingProject.status || 'active',
        } : null}
        onSave={handleSave}
      />
    </div>
  )
}
