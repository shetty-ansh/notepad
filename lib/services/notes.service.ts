import type { SupabaseClient } from '@supabase/supabase-js'
import type { Note } from '@/lib/types'

export type NoteInput = {
  title?: string | null
  content?: string | null
  section?: string | null
  type?: string | null
  tags?: string[] | null
  is_pinned?: boolean | null
  sort_order?: number | null
}

export const notesService = {
  async getNotes(supabase: SupabaseClient, userId: string): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('is_pinned', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('updated_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
  },

  async createNote(supabase: SupabaseClient, userId: string, payload: NoteInput): Promise<Note> {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        ...payload,
        user_id: userId,
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async updateNote(
    supabase: SupabaseClient,
    userId: string,
    id: string,
    payload: Partial<NoteInput>
  ): Promise<Note> {
    const { data, error } = await supabase
      .from('notes')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async deleteNote(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  },

  async reorderNotes(supabase: SupabaseClient, userId: string, orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await supabase
        .from('notes')
        .update({ sort_order: i })
        .eq('id', orderedIds[i])
        .eq('user_id', userId)
    }
  }
}
