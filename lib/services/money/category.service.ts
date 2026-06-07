import { redis } from '@/lib/redis'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { TransactionCategory, NewTransactionCategory } from '@/lib/types'
import { invalidateMoneyCache } from './cache.service'

export const categoryService = {
  async getTransactionCategories(supabase: SupabaseClient, userId: string): Promise<TransactionCategory[]> {
    const cacheKey = `categories:${userId}`
    const cached = await redis.get<TransactionCategory[]>(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('transaction_categories')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)

    await redis.set(cacheKey, data, { ex: 3600 })
    return data
  },

  async addTransactionCategory(supabase: SupabaseClient, userId: string, categoryData: NewTransactionCategory): Promise<TransactionCategory> {
    const { data, error } = await supabase
      .from('transaction_categories')
      .insert({ ...categoryData, user_id: userId })
      .select()
      .single()

    if (error) throw new Error(error.message)
    await invalidateMoneyCache(userId)
    return data
  },

  async deleteTransactionCategory(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('transaction_categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
    await invalidateMoneyCache(userId)
  }
}
