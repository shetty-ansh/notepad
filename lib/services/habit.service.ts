import type { SupabaseClient } from '@supabase/supabase-js'
import type { Habit, HabitLog } from '@/lib/types'

export type HabitInput = {
  name: string
  color?: string | null
  frequency?: string | null
}

export const habitService = {
  async getHabits(supabase: SupabaseClient, userId: string): Promise<Habit[]> {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)
    return data
  },

  async createHabit(supabase: SupabaseClient, userId: string, payload: HabitInput): Promise<Habit> {
    const { data, error } = await supabase
      .from('habits')
      .insert({
        ...payload,
        is_active: true,
        user_id: userId,
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async updateHabit(
    supabase: SupabaseClient,
    userId: string,
    id: string,
    payload: Partial<HabitInput>
  ): Promise<Habit> {
    const { data, error } = await supabase
      .from('habits')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async deleteHabit(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
    const { data: habit } = await supabase
      .from('habits')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!habit) throw new Error('Not found or unauthorized')

    const { error } = await supabase.from('habits').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async getAllHabitLogs(supabase: SupabaseClient, userId: string): Promise<HabitLog[]> {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
    return data
  },

  async getHabitLogs(supabase: SupabaseClient, userId: string, habitId: string): Promise<HabitLog[]> {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
    return data
  },

  async toggleHabitLog(
    supabase: SupabaseClient,
    userId: string,
    habitId: string,
    date: string,
    completed: boolean
  ): Promise<HabitLog> {
    const { data: existing } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .eq('log_date', date)
      .eq('user_id', userId)
      .single()

    if (existing) {
      const { data, error } = await supabase
        .from('habit_logs')
        .update({ completed })
        .eq('id', existing.id)
        .select('*')
        .single()
      if (error) throw new Error(error.message)
      return data
    } else {
      const { data, error } = await supabase
        .from('habit_logs')
        .insert({
          habit_id: habitId,
          log_date: date,
          completed,
          user_id: userId,
        })
        .select('*')
        .single()
      if (error) throw new Error(error.message)
      return data
    }
  }
}
