'use client'

import type { Project, ProjectTask } from '@/lib/types'
import Link from 'next/link'

interface ProjectCardProps {
  project: Project
  tasks: ProjectTask[]
  onEdit: (project: Project) => void
  onDelete: (id: string) => void
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500',
  completed: 'bg-black',
  archived: 'bg-black/20',
}

const PRIORITY_LABELS: Record<string, string> = {
  high: 'High',
  medium: 'Med',
  low: 'Low',
}

export function ProjectCard({ project, tasks, onEdit, onDelete }: ProjectCardProps) {
  const projectTasks = tasks.filter(t => t.project_id === project.id && !t.parent_task_id)
  const allTasks = tasks.filter(t => t.project_id === project.id)
  const doneTasks = allTasks.filter(t => t.status === 'done')
  const progress = allTasks.length > 0 ? Math.round((doneTasks.length / allTasks.length) * 100) : 0
  const dueLabel = project.due_date
    ? new Date(project.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : null

  return (
    <Link
      href={`/work/projects/${project.id}`}
      className="block group bg-white border border-black/[0.08] rounded-[12px] p-4 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-black/[0.14] transition-all duration-300 active:scale-[0.98]"
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: project.color || '#000' }}
          />
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[project.status || 'active']}`} />
        </div>
        {project.priority && (
          <span className="text-[9px] tracking-[0.15em] uppercase font-medium text-black/30">
            {PRIORITY_LABELS[project.priority] || project.priority}
          </span>
        )}
      </div>

      {/* Name */}
      <h3 className="text-sm font-semibold text-black tracking-tight line-clamp-1 mb-0.5">
        {project.name}
      </h3>
      {project.description && (
        <p className="text-[11px] text-black/35 line-clamp-2 leading-relaxed mb-3">
          {project.description}
        </p>
      )}

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-medium text-black/40">
            {doneTasks.length}/{allTasks.length} tasks
          </span>
          <span className="text-[10px] font-mono text-black/30">{progress}%</span>
        </div>
        <div className="h-[3px] bg-black/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              backgroundColor: project.color || '#000',
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-black/[0.05]">
        <span className="text-[9px] text-black/25">
          {projectTasks.length} top-level tasks
        </span>
        {dueLabel && (
          <span className="text-[9px] text-black/30 font-medium">
            Due {dueLabel}
          </span>
        )}
      </div>
    </Link>
  )
}
