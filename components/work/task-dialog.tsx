'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: { title: string; description: string; priority: string; due_date: string; parent_task_id: string | null } | null
  parentOptions: { id: string; title: string }[]
  onSave: (data: { title: string; description: string; priority: string; due_date: string | null; parent_task_id: string | null }) => void
}

export function TaskDialog({ open, onOpenChange, task, parentOptions, onSave }: TaskDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [parentId, setParentId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? '')
      setDescription(task?.description ?? '')
      setPriority(task?.priority ?? 'medium')
      setDueDate(task?.due_date ?? '')
      setParentId(task?.parent_task_id ?? null)
    }
  }, [open, task])

  const handleSave = () => {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      description: description.trim(),
      priority,
      due_date: dueDate || null,
      parent_task_id: parentId,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden rounded-xl border-black/10">
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06]">
          <span className="text-[10px] tracking-[0.2em] uppercase font-medium text-black/30">
            {task ? 'Edit Task' : 'New Task'}
          </span>
          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1 text-[11px] font-semibold bg-black text-white rounded-md hover:bg-black/80 transition-colors"
          >
            Save
          </button>
        </div>

        <div className="p-4 space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full text-base font-semibold text-black tracking-tight placeholder:text-black/20 outline-none bg-transparent"
            autoFocus
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full min-h-[50px] text-sm text-black/60 placeholder:text-black/20 outline-none bg-transparent resize-none"
          />

          {/* Parent task (subtask support) */}
          {parentOptions.length > 0 && (
            <div>
              <label className="text-[10px] tracking-[0.15em] uppercase font-medium text-black/30 mb-2 block">Parent Task</label>
              <select
                value={parentId ?? ''}
                onChange={(e) => setParentId(e.target.value || null)}
                className="w-full h-10 px-3 rounded-[8px] bg-black/[0.03] border border-black/[0.08] text-sm outline-none"
              >
                <option value="">None (top-level task)</option>
                {parentOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="text-[10px] tracking-[0.15em] uppercase font-medium text-black/30 mb-2 block">Priority</label>
            <div className="flex gap-2">
              {['low', 'medium', 'high'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md border transition-all capitalize ${
                    priority === p
                      ? 'bg-black text-white border-black'
                      : 'bg-transparent text-black/40 border-black/10 hover:border-black/25'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="text-[10px] tracking-[0.15em] uppercase font-medium text-black/30 mb-2 block">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-10 px-3 rounded-[8px] bg-black/[0.03] border border-black/[0.08] text-sm outline-none focus:border-black/20 transition-colors"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
