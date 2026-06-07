import { redis } from '@/lib/redis'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Ledger, NewLedgerEntry } from '@/lib/types'
import { invalidateMoneyCache } from './cache.service'

export const ledgerService = {
  async getLedger(supabase: SupabaseClient, userId: string): Promise<Ledger[]> {
    const cacheKey = `ledger:${userId}`
    const cached = await redis.get<Ledger[]>(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('ledger')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    await redis.set(cacheKey, data, { ex: 3600 })
    return data
  },

  async addLedgerEntry(supabase: SupabaseClient, userId: string, entryData: NewLedgerEntry): Promise<Ledger> {
    const { data, error } = await supabase
      .from('ledger')
      .insert({ ...entryData, status: 'pending', user_id: userId })
      .select()
      .single()

    if (error) throw new Error(error.message)
    await invalidateMoneyCache(userId)
    return data
  },

  async updateLedgerEntry(supabase: SupabaseClient, userId: string, id: string, entryData: Partial<NewLedgerEntry>): Promise<Ledger> {
    const { data, error } = await supabase
      .from('ledger')
      .update(entryData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    await invalidateMoneyCache(userId)
    return data
  },

  async settleLedgerEntry(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('ledger')
      .update({ status: 'settled' })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
    await invalidateMoneyCache(userId)
  },

  async deleteLedgerEntry(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('ledger')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
    await invalidateMoneyCache(userId)
  }
}
