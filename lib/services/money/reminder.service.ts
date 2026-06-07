import { redis } from '@/lib/redis'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Reminder, NewReminder } from '@/lib/types'
import { invalidateMoneyCache } from './cache.service'

export const reminderService = {
  async getReminders(supabase: SupabaseClient, userId: string): Promise<Reminder[]> {
    const cacheKey = `reminders:${userId}`
    const cached = await redis.get<Reminder[]>(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('remind_on', { ascending: true })

    if (error) throw new Error(error.message)

    await redis.set(cacheKey, data, { ex: 3600 })
    return data
  },

  async addReminder(supabase: SupabaseClient, userId: string, reminderData: NewReminder): Promise<Reminder> {
    const { data, error } = await supabase
      .from('reminders')
      .insert({ ...reminderData, is_done: false, user_id: userId })
      .select()
      .single()

    if (error) throw new Error(error.message)
    await invalidateMoneyCache(userId)
    return data
  },

  async markReminderDone(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('reminders')
      .update({ is_done: true })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
    await invalidateMoneyCache(userId)
  }
}
