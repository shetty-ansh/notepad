'use server'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Note } from '@/lib/types'
import { revalidatePath } from 'next/cache'

const getUserId = cache(async (): Promise<string> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? 'dev-user'
})

export async function getNotes(): Promise<Note[]> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('is_pinned', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

type NoteInput = {
  title?: string | null
  content?: string | null
  section?: string | null
  type?: string | null
  tags?: string[] | null
  is_pinned?: boolean | null
  sort_order?: number | null
}

export async function createNote(payload: NoteInput): Promise<Note> {
  const supabase = await createClient()
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('notes')
    .insert({
      ...payload,
      user_id: userId,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
  return data
}

export async function updateNote(id: string, payload: Partial<NoteInput>): Promise<Note> {
  const supabase = await createClient()
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('notes')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
  return data
}

export async function deleteNote(id: string): Promise<void> {
  const supabase = await createClient()
  const userId = await getUserId()

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function reorderNotes(orderedIds: string[]): Promise<void> {
  const supabase = await createClient()
  const userId = await getUserId()

  for (let i = 0; i < orderedIds.length; i++) {
    await supabase
      .from('notes')
      .update({ sort_order: i })
      .eq('id', orderedIds[i])
      .eq('user_id', userId)
  }

  revalidatePath('/', 'layout')
}

export async function toggleNotePin(id: string, pinned: boolean): Promise<Note> {
  return updateNote(id, { is_pinned: pinned })
}
