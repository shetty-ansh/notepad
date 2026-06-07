'use server'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Habit, HabitLog } from '@/lib/types'
import { revalidatePath } from 'next/cache'

AUTH DISABLED FOR NOW
const getUserId = cache(async (): Promise<string> => {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return user.id
})
const getUserId = cache(async (): Promise<string> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? 'dev-user'
})

export async function getHabits(): Promise<Habit[]> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    // You can sort them however you like, maybe by created timestamp if there was one,
    // or just name. We'll sort by name here to keep it stable.
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

type HabitInput = {
  name: string
  color?: string | null
  frequency?: string | null
}

export async function createHabit(payload: HabitInput): Promise<Habit> {
  const supabase = await createClient()
  const userId = await getUserId()

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
  revalidatePath('/', 'layout')
  return data
}

export async function updateHabit(id: string, payload: Partial<HabitInput>): Promise<Habit> {
  const supabase = await createClient()
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('habits')
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
  return data
}

export async function deleteHabit(id: string): Promise<void> {
  const supabase = await createClient()
  const userId = await getUserId()

  // First verify it belongs to user
  const { data: habit } = await supabase
    .from('habits')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (!habit) throw new Error('Not found or unauthorized')

  // Hard delete (if you prefer soft delete, update is_active instead)
  const { error } = await supabase.from('habits').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

// Logs
export async function getAllHabitLogs(): Promise<HabitLog[]> {
  const supabase = await createClient()
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return data
}

export async function getHabitLogs(habitId: string): Promise<HabitLog[]> {
  const supabase = await createClient()
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('habit_id', habitId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return data
}

export async function toggleHabitLog(
  habitId: string,
  date: string,
  completed: boolean
): Promise<HabitLog> {
  const supabase = await createClient()
  const userId = await getUserId()

  // check if exists
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
    revalidatePath('/', 'layout')
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
    revalidatePath('/', 'layout')
    return data
  }
}
