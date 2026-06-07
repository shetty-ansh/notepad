'use server'

import type { Note } from '@/lib/types'
import { revalidatePath } from 'next/cache'
import { notesService } from '@/lib/services/notes.service'
import type { NoteInput } from '@/lib/services/notes.service'
import { getAuthSession } from '@/lib/utils/getAuthSession'

export async function getNotes(): Promise<Note[]> {
  const { supabase, userId } = await getAuthSession()
  return notesService.getNotes(supabase, userId)
}

export async function createNote(payload: NoteInput): Promise<Note> {
  const { supabase, userId } = await getAuthSession()
  const note = await notesService.createNote(supabase, userId, payload)
  revalidatePath('/', 'layout')
  return note
}

export async function updateNote(id: string, payload: Partial<NoteInput>): Promise<Note> {
  const { supabase, userId } = await getAuthSession()
  const note = await notesService.updateNote(supabase, userId, id, payload)
  revalidatePath('/', 'layout')
  return note
}

export async function deleteNote(id: string): Promise<void> {
  const { supabase, userId } = await getAuthSession()
  await notesService.deleteNote(supabase, userId, id)
  revalidatePath('/', 'layout')
}

export async function reorderNotes(orderedIds: string[]): Promise<void> {
  const { supabase, userId } = await getAuthSession()
  await notesService.reorderNotes(supabase, userId, orderedIds)
  revalidatePath('/', 'layout')
}

export async function toggleNotePin(id: string, pinned: boolean): Promise<Note> {
  return updateNote(id, { is_pinned: pinned })
}
