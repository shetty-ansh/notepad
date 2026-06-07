'use client'

import { useState, useEffect, useMemo } from 'react'
import { Reorder } from 'framer-motion'
import { Plus, Search, Pin } from 'lucide-react'
import { getNotes, createNote, updateNote, deleteNote, reorderNotes, toggleNotePin } from '@/lib/actions/notes'
import { NoteCard } from '@/components/notes/note-card'
import { NoteDialog } from '@/components/notes/note-dialog'
import Loader from '@/components/loader-animation'
import { showToast } from '@/components/toast'
import type { Note } from '@/lib/types'

type Filter = 'all' | 'pinned'

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await getNotes()
      setNotes(data)
    } catch (error) {
      showToast('error', 'Failed to load', error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const filteredNotes = useMemo(() => {
    let result = [...notes]
    if (filter === 'pinned') result = result.filter(n => n.is_pinned)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(n =>
        (n.title?.toLowerCase() || '').includes(q) ||
        (n.content?.toLowerCase() || '').includes(q) ||
        (n.tags || []).some(t => t.toLowerCase().includes(q))
      )
    }
    return result
  }, [notes, filter, search])

  const handleSave = async (data: { title: string; content: string; tags: string[]; is_pinned: boolean }) => {
    try {
      if (editingNote) {
        const updated = await updateNote(editingNote.id, data)
        setNotes(prev => prev.map(n => n.id === updated.id ? updated : n))
        showToast('success', 'Updated', 'Note saved successfully.')
      } else {
        const created = await createNote(data)
        setNotes(prev => [created, ...prev])
        showToast('success', 'Created', 'New note added.')
      }
      setDialogOpen(false)
      setEditingNote(null)
    } catch (error) {
      showToast('error', 'Failed to save', error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  const handleDelete = async (id: string) => {
    const prev = notes
    setNotes(notes.filter(n => n.id !== id))
    try {
      await deleteNote(id)
      showToast('success', 'Deleted', 'Note removed.')
    } catch {
      setNotes(prev)
      showToast('error', 'Delete failed', 'Could not delete note.')
    }
  }

  const handleTogglePin = async (id: string, pinned: boolean) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, is_pinned: pinned } : n))
    try {
      await toggleNotePin(id, pinned)
    } catch {
      loadData()
    }
  }

  const handleReorder = (newOrder: Note[]) => {
    setNotes(newOrder)
  }

  const handleReorderEnd = async () => {
    try {
      await reorderNotes(notes.map(n => n.id))
    } catch {
      loadData()
    }
  }

  const openNew = () => {
    setEditingNote(null)
    setDialogOpen(true)
  }

  const openEdit = (note: Note) => {
    setEditingNote(note)
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
    <div className="h-full overflow-y-auto px-4 py-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl sm:text-7xl font-bold">Notes</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Capture ideas, keep them organized
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/25" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full h-10 pl-9 pr-3 rounded-[8px] bg-white border border-black/[0.08] text-sm outline-none focus:border-black/20 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter(filter === 'pinned' ? 'all' : 'pinned')}
            className={`flex items-center gap-1.5 h-10 px-3 rounded-[8px] border text-xs font-semibold transition-all ${
              filter === 'pinned'
                ? 'bg-black text-white border-black'
                : 'bg-white text-black/60 border-black/[0.08] hover:border-black/20'
            }`}
          >
            <Pin className="w-3 h-3" />
            Pinned
          </button>
        </div>
      </div>

      {/* Notes Grid with Drag-and-Drop */}
      {filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-medium text-black/40">
            {search ? 'No notes match your search' : 'No notes yet'}
          </p>
          <p className="text-xs text-black/25 mt-1">
            {search ? 'Try a different search term' : 'Tap + to create your first note'}
          </p>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={filteredNotes}
          onReorder={handleReorder}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {filteredNotes.map((note) => (
            <Reorder.Item
              key={note.id}
              value={note}
              onDragEnd={handleReorderEnd}
              whileDrag={{ scale: 1.03, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', zIndex: 50 }}
              className="cursor-grab active:cursor-grabbing"
            >
              <NoteCard
                note={note}
                onEdit={openEdit}
                onDelete={handleDelete}
                onTogglePin={handleTogglePin}
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {/* FAB */}
      <button
        onClick={openNew}
        className="fixed bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-[0_4px_14px_0_rgba(0,0,0,0.25)] hover:bg-gray-800 transition-transform duration-200 hover:scale-[1.05] active:scale-95 z-50"
        aria-label="New Note"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Dialog */}
      <NoteDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setTimeout(() => setEditingNote(null), 200)
        }}
        note={editingNote}
        onSave={handleSave}
      />
    </div>
  )
}
