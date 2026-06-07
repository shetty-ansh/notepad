'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: { name: string; description: string; notes: string; color: string; priority: string; due_date: string; status: string } | null
  onSave: (data: { name: string; description: string; notes: string; color: string; priority: string; due_date: string | null; status: string }) => void
}

const COLORS = ['#000000', '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4']

export function ProjectDialog({ open, onOpenChange, project, onSave }: ProjectDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [color, setColor] = useState('#000000')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState('active')

  useEffect(() => {
    if (open) {
      setName(project?.name ?? '')
      setDescription(project?.description ?? '')
      setNotes(project?.notes ?? '')
      setColor(project?.color ?? '#000000')
      setPriority(project?.priority ?? 'medium')
      setDueDate(project?.due_date ?? '')
      setStatus(project?.status ?? 'active')
    }
  }, [open, project])

  const handleSave = () => {
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      description: description.trim(),
      notes: notes.trim(),
      color,
      priority,
      due_date: dueDate || null,
      status,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden rounded-xl border-black/10">
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06]">
          <span className="text-[10px] tracking-[0.2em] uppercase font-medium text-black/30">
            {project ? 'Edit Project' : 'New Project'}
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            className="w-full text-lg font-semibold text-black tracking-tight placeholder:text-black/20 outline-none bg-transparent"
            autoFocus
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full min-h-[60px] text-sm text-black/60 placeholder:text-black/20 outline-none bg-transparent resize-none"
          />

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full min-h-[100px] text-sm text-black/60 placeholder:text-black/20 outline-none bg-transparent resize-none border border-black/10 rounded-md p-2"
          />

          {/* Color picker */}
          <div>
            <label className="text-[10px] tracking-[0.15em] uppercase font-medium text-black/30 mb-2 block">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    color === c ? 'border-black scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

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

          {/* Status (only for edit) */}
          {project && (
            <div>
              <label className="text-[10px] tracking-[0.15em] uppercase font-medium text-black/30 mb-2 block">Status</label>
              <div className="flex gap-2">
                {['active', 'completed', 'archived'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md border transition-all capitalize ${
                      status === s
                        ? 'bg-black text-white border-black'
                        : 'bg-transparent text-black/40 border-black/10 hover:border-black/25'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

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
