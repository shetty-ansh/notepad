'use client'

import { Pin, Trash2, MoreHorizontal } from 'lucide-react'
import type { Note } from '@/lib/types'
import { useState } from 'react'

interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string, pinned: boolean) => void
}

export function NoteCard({ note, onEdit, onDelete, onTogglePin }: NoteCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const stripHtml = (html: string) => {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || div.innerText || ''
  }

  const preview = note.content ? stripHtml(note.content).slice(0, 120) : ''
  const timeAgo = note.updated_at
    ? formatTimeAgo(new Date(note.updated_at))
    : ''

  return (
    <div
      className="group relative bg-white border border-black/[0.08] rounded-[12px] p-4 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-black/[0.14] transition-all duration-300 cursor-pointer active:scale-[0.98]"
      onClick={() => onEdit(note)}
    >
      {/* Pin indicator */}
      {note.is_pinned && (
        <div className="absolute top-3 right-3">
          <Pin className="w-3 h-3 text-black/30 fill-black/30" />
        </div>
      )}

      {/* Title */}
      {note.title && (
        <h3 className="text-sm font-semibold text-black tracking-tight pr-6 line-clamp-1 mb-1.5">
          {note.title}
        </h3>
      )}

      {/* Content preview */}
      {preview && (
        <p className="text-[11px] text-black/40 leading-relaxed line-clamp-3 mb-3">
          {preview}
        </p>
      )}

      {!note.title && !preview && (
        <p className="text-[11px] text-black/25 italic mb-3">Empty note</p>
      )}

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {note.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="text-[9px] font-medium tracking-wider uppercase text-black/30 bg-black/[0.04] px-1.5 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-[9px] text-black/20">+{note.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-black/[0.05]">
        <span className="text-[9px] text-black/25">{timeAgo}</span>

        {/* Actions menu */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded hover:bg-black/[0.05] opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="w-3.5 h-3.5 text-black/30" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 bottom-full mb-1 z-50 bg-white border border-black/10 rounded-lg shadow-lg py-1 min-w-[120px]">
                <button
                  onClick={() => { onTogglePin(note.id, !note.is_pinned); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-black/60 hover:bg-black/[0.04] transition-colors"
                >
                  <Pin className="w-3 h-3" />
                  {note.is_pinned ? 'Unpin' : 'Pin'}
                </button>
                <button
                  onClick={() => { onDelete(note.id); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
