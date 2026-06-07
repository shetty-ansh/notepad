'use client'

import { useState, useCallback } from 'react'
import { X, Pin, Hash } from 'lucide-react'
import type { Note } from '@/lib/types'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface NoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  note: Note | null
  onSave: (data: { title: string; content: string; tags: string[]; is_pinned: boolean }) => void
}

export function NoteDialog({ open, onOpenChange, note, onSave }: NoteDialogProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isPinned, setIsPinned] = useState(false)

  // Reset form when note changes
  const prevNoteId = useState<string | null>(null)
  if (open && note?.id !== prevNoteId[0]) {
    prevNoteId[1](note?.id ?? null)
    setTitle(note?.title ?? '')
    setContent(note?.content ?? '')
    setTags(note?.tags ?? [])
    setIsPinned(note?.is_pinned ?? false)
  } else if (open && !note && prevNoteId[0] !== '__new__') {
    prevNoteId[1]('__new__')
    setTitle('')
    setContent('')
    setTags([])
    setIsPinned(false)
  }

  const handleSave = useCallback(() => {
    if (!title.trim() && !content.trim()) return
    onSave({ title: title.trim(), content, tags, is_pinned: isPinned })
  }, [title, content, tags, isPinned, onSave])

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90svh] p-0 gap-0 overflow-hidden rounded-xl border-black/10">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-[0.2em] uppercase font-medium text-black/30">
              {note ? 'Edit Note' : 'New Note'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`p-1.5 rounded-md transition-colors ${isPinned ? 'bg-black/[0.08] text-black' : 'text-black/25 hover:text-black/50'}`}
              title={isPinned ? 'Unpin' : 'Pin'}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="ml-2 px-3 py-1 text-[11px] font-semibold bg-black text-white rounded-md hover:bg-black/80 transition-colors"
            >
              Save
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="w-full text-lg font-semibold text-black tracking-tight placeholder:text-black/20 outline-none bg-transparent"
            autoFocus
          />

          {/* Rich text area (plain textarea fallback — tiptap can be added later) */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing..."
            className="w-full min-h-[200px] sm:min-h-[280px] text-sm text-black/70 leading-relaxed placeholder:text-black/20 outline-none bg-transparent resize-none"
          />

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[10px] font-medium tracking-wider uppercase text-black/50 bg-black/[0.05] px-2 py-0.5 rounded"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-black/30 hover:text-black/60">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Hash className="w-3 h-3 text-black/20" />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addTag() }
                  if (e.key === ',' || e.key === ' ') { e.preventDefault(); addTag() }
                }}
                placeholder="Add tag"
                className="text-xs text-black/50 placeholder:text-black/20 outline-none bg-transparent flex-1"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
