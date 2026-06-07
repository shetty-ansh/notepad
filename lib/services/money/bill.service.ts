import { redis } from '@/lib/redis'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Bill, NewBill, BillFrequency } from '@/lib/types'
import { invalidateMoneyCache } from './cache.service'

export const billService = {
  async getBills(supabase: SupabaseClient, userId: string): Promise<Bill[]> {
    const cacheKey = `bills:${userId}`
    const cached = await redis.get<Bill[]>(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('next_due_date', { ascending: true })

    if (error) throw new Error(error.message)

    await redis.set(cacheKey, data, { ex: 3600 })
    return data
  },

  async addBill(supabase: SupabaseClient, userId: string, billData: NewBill): Promise<Bill> {
    const { data, error } = await supabase
      .from('bills')
      .insert({ ...billData, is_active: true, user_id: userId })
      .select()
      .single()

    if (error) throw new Error(error.message)
    await invalidateMoneyCache(userId)
    return data
  },

  async updateBill(supabase: SupabaseClient, userId: string, id: string, updateData: Partial<NewBill>): Promise<Bill> {
    const { data, error } = await supabase
      .from('bills')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    await invalidateMoneyCache(userId)
    return data
  },

  async deleteBill(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
    await invalidateMoneyCache(userId)
  },

  async markBillPaid(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
    const { data: bill, error: fetchError } = await supabase
      .from('bills')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError) throw new Error(fetchError.message)

    const currentDueDate = new Date(bill.next_due_date!)
    let newDueDate: Date | null = null
    let isActive = true

    switch (bill.frequency as BillFrequency) {
      case 'monthly':
        newDueDate = new Date(currentDueDate)
        newDueDate.setMonth(newDueDate.getMonth() + 1)
        break
      case 'weekly':
        newDueDate = new Date(currentDueDate)
        newDueDate.setDate(newDueDate.getDate() + 7)
        break
      case 'yearly':
        newDueDate = new Date(currentDueDate)
        newDueDate.setFullYear(newDueDate.getFullYear() + 1)
        break
      case 'once':
        isActive = false
        break
    }

    const updateData: Partial<Bill> = { is_active: isActive }
    if (newDueDate) updateData.next_due_date = newDueDate.toISOString().split('T')[0]

    const { error: updateError } = await supabase
      .from('bills')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)

    if (updateError) throw new Error(updateError.message)
    await invalidateMoneyCache(userId)
  },

  async toggleBillActive(supabase: SupabaseClient, userId: string, id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('bills')
      .update({ is_active: isActive })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
    await invalidateMoneyCache(userId)
  }
}
