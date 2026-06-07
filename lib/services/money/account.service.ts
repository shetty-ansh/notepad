import { redis } from '@/lib/redis'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Account, NewAccount } from '@/lib/types'
import { invalidateMoneyCache } from './cache.service'
import { resolveProvisionShortfall } from './shortfall.service'

export const accountService = {
  async getAccounts(supabase: SupabaseClient, userId: string): Promise<Account[]> {
    const cacheKey = `accounts:${userId}`
    const cached = await redis.get<Account[]>(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) throw new Error(error.message)
    
    await redis.set(cacheKey, data, { ex: 3600 })
    return data
  },

  async addAccount(supabase: SupabaseClient, userId: string, accountData: NewAccount): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .insert({ ...accountData, user_id: userId })
      .select()
      .single()

    if (error) throw new Error(error.message)
    await invalidateMoneyCache(userId)
    return data
  },

  async deleteAccount(supabase: SupabaseClient, userId: string, accountId: string): Promise<void> {
    // 1. Find all goals that belong to this account and clean them up
    const { data: accountGoals } = await supabase
      .from('goals')
      .select('id')
      .eq('account_id', accountId)
      .eq('user_id', userId)

    if (accountGoals && accountGoals.length > 0) {
      const goalIds = accountGoals.map(g => g.id)
      // Delete all provisions targeting these goals (from any account)
      await supabase
        .from('transactions')
        .delete()
        .in('goal_id', goalIds)
        .eq('type', 'provision')
        .eq('user_id', userId)
      
      // Delete the goals themselves
      await supabase
        .from('goals')
        .delete()
        .in('id', goalIds)
        .eq('user_id', userId)
    }

    // 2. Delete all bills associated with this account
    await supabase
      .from('bills')
      .delete()
      .eq('account_id', accountId)
      .eq('user_id', userId)

    // 3. Revert provisions targeting other accounts' goals, and delete all transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .eq('user_id', userId)

    if (transactions && transactions.length > 0) {
      for (const tx of transactions) {
        if (tx.type === 'provision' && tx.goal_id) {
          const { data: goal } = await supabase
            .from('goals')
            .select('saved_amount')
            .eq('id', tx.goal_id)
            .eq('user_id', userId)
            .single()

          if (goal) {
            await supabase
              .from('goals')
              .update({ saved_amount: Math.max(0, (goal.saved_amount ?? 0) - tx.amount) })
              .eq('id', tx.goal_id)
              .eq('user_id', userId)
          }
        }
      }

      await supabase
        .from('transactions')
        .delete()
        .eq('account_id', accountId)
        .eq('user_id', userId)
    }

    // 4. Finally, delete the account
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
    await invalidateMoneyCache(userId)
  },

  async updateAccountBalance(supabase: SupabaseClient, userId: string, id: string, newBalance: number): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
    await resolveProvisionShortfall(id, userId, supabase)
    await invalidateMoneyCache(userId)
  },

  async updateAccount(supabase: SupabaseClient, userId: string, id: string, accountData: Partial<NewAccount & { color?: string | null }>): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .update(accountData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    await resolveProvisionShortfall(id, userId, supabase)
    await invalidateMoneyCache(userId)
    return data
  }
}
