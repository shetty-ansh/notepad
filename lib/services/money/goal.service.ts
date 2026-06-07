import { redis } from '@/lib/redis'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Goal, NewGoal, GoalStatus } from '@/lib/types'
import { invalidateMoneyCache } from './cache.service'

export const goalService = {
  async getGoals(supabase: SupabaseClient, userId: string): Promise<Goal[]> {
    const cacheKey = `goals:${userId}`
    const cached = await redis.get<Goal[]>(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)

    if (error) throw new Error(error.message)

    await redis.set(cacheKey, data, { ex: 3600 })
    return data
  },

  async addGoal(supabase: SupabaseClient, userId: string, goalData: NewGoal): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .insert({ ...goalData, saved_amount: 0, status: 'active', user_id: userId })
      .select()
      .single()

    if (error) throw new Error(error.message)
    await invalidateMoneyCache(userId)
    return data
  },

  async updateGoal(supabase: SupabaseClient, userId: string, id: string, updateData: Partial<NewGoal>): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    await invalidateMoneyCache(userId)
    return data
  },

  async provisionToGoal(supabase: SupabaseClient, userId: string, goalId: string, amount: number, accountId: string): Promise<void> {
    const { data: account } = await supabase.from('accounts').select('balance').eq('id', accountId).eq('user_id', userId).single()
    if (!account) throw new Error('Account not found')

    const { data: provisions } = await supabase
      .from('transactions')
      .select('amount')
      .eq('account_id', accountId)
      .eq('user_id', userId)
      .eq('type', 'provision')

    const totalProvisioned = (provisions || []).reduce((sum, p) => sum + (p.amount || 0), 0)
    const freeMoney = (account.balance || 0) - totalProvisioned

    if (amount > freeMoney) {
      throw new Error(`Cannot provision more than available free money (₹${freeMoney.toLocaleString('en-IN')})`)
    }

    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        account_id: accountId,
        goal_id: goalId,
        amount,
        type: 'provision',
        category: 'Goal Provision',
        description: 'Provision to goal',
        txn_date: new Date().toISOString().split('T')[0],
        user_id: userId,
      })

    if (transactionError) throw new Error(transactionError.message)

    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('saved_amount')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single()

    if (goalError) throw new Error(goalError.message)

    const { error: updateGoalError } = await supabase
      .from('goals')
      .update({ saved_amount: (goal.saved_amount ?? 0) + amount })
      .eq('id', goalId)
      .eq('user_id', userId)

    if (updateGoalError) throw new Error(updateGoalError.message)
    await invalidateMoneyCache(userId)
  },

  async updateGoalStatus(supabase: SupabaseClient, userId: string, id: string, status: GoalStatus): Promise<void> {
    const { error } = await supabase
      .from('goals')
      .update({ status })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
    await invalidateMoneyCache(userId)
  },

  async deleteGoal(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
    await supabase
      .from('transactions')
      .delete()
      .eq('goal_id', id)
      .eq('type', 'provision')
      .eq('user_id', userId)

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
    await invalidateMoneyCache(userId)
  }
}
