'use server'

import type { Habit, HabitLog } from '@/lib/types'
import { revalidatePath } from 'next/cache'
import { habitService } from '@/lib/services/habit.service'
import type { HabitInput } from '@/lib/services/habit.service'
import { getAuthSession } from '@/lib/utils/getAuthSession'

export async function getHabits(): Promise<Habit[]> {
  const { supabase, userId } = await getAuthSession()
  return habitService.getHabits(supabase, userId)
}

export async function createHabit(payload: HabitInput): Promise<Habit> {
  const { supabase, userId } = await getAuthSession()

  const habit = await habitService.createHabit(supabase, userId, payload)
  revalidatePath('/', 'layout')
  return habit
}

export async function updateHabit(id: string, payload: Partial<HabitInput>): Promise<Habit> {
  const { supabase, userId } = await getAuthSession()
  const habit = await habitService.updateHabit(supabase, userId, id, payload)
  revalidatePath('/', 'layout')
  return habit
}

export async function deleteHabit(id: string): Promise<void> {
  const { supabase, userId } = await getAuthSession()

  await habitService.deleteHabit(supabase, userId, id)
  revalidatePath('/', 'layout')
}

// Logs
export async function getAllHabitLogs(): Promise<HabitLog[]> {
  const { supabase, userId } = await getAuthSession()
  return habitService.getAllHabitLogs(supabase, userId)
}

export async function getHabitLogs(habitId: string): Promise<HabitLog[]> {
  const { supabase, userId } = await getAuthSession()
  return habitService.getHabitLogs(supabase, userId, habitId)
}

export async function toggleHabitLog(
  habitId: string,
  date: string,
  completed: boolean
): Promise<HabitLog> {
  const { supabase, userId } = await getAuthSession()
  const log = await habitService.toggleHabitLog(supabase, userId, habitId, date, completed)
  revalidatePath('/', 'layout')
  return log
}
