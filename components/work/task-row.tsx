'use client'

import { useState } from 'react'
import { Check, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import type { ProjectTask } from '@/lib/types'

interface TaskRowProps {
  task: ProjectTask
  subtasks: ProjectTask[]
  allTasks: ProjectTask[]
  onToggleStatus: (id: string, status: string) => void
  onEdit: (task: ProjectTask) => void
  onDelete: (id: string) => void
}

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-emerald-400',
}

export function TaskRow({ task, subtasks, allTasks, onToggleStatus, onEdit, onDelete }: TaskRowProps) {
  const [expanded, setExpanded] = useState(true)
  const isDone = task.status === 'done'
  const dueLabel = task.due_date
    ? new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : null

  return (
    <div>
      <div className="flex items-center gap-2 py-2 px-1 group">
        {/* Expand toggle for tasks with subtasks */}
        {subtasks.length > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-5 h-5 flex items-center justify-center text-black/30 hover:text-black/60 shrink-0"
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Checkbox */}
        <button
          type="button"
          onClick={() => onToggleStatus(task.id, isDone ? 'todo' : 'done')}
          className={`w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
            isDone ? 'bg-black border-black' : 'border-black/20 hover:border-black/40'
          }`}
        >
          {isDone && <Check className="w-3 h-3 text-white" />}
        </button>

        {/* Title */}
        <button
          type="button"
          onClick={() => onEdit(task)}
          className={`flex-1 text-left text-sm transition-colors ${
            isDone ? 'line-through text-black/25' : 'text-black/75 hover:text-black'
          }`}
        >
          {task.title}
        </button>

        {/* Priority dot */}
        {task.priority && (
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] || 'bg-black/15'}`} />
        )}

        {/* Due date */}
        {dueLabel && (
          <span className="text-[9px] text-black/25 shrink-0">{dueLabel}</span>
        )}

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="p-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subtasks */}
      {expanded && subtasks.length > 0 && (
        <div className="ml-7 pl-3 border-l border-black/[0.06]">
          {subtasks.map((sub) => {
            const subSubtasks = allTasks.filter(t => t.parent_task_id === sub.id)
            return (
              <TaskRow
                key={sub.id}
                task={sub}
                subtasks={subSubtasks}
                allTasks={allTasks}
                onToggleStatus={onToggleStatus}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
