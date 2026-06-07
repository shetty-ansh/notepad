import { redis } from '@/lib/redis'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Transaction, NewTransaction, TransactionFilters } from '@/lib/types'
import { invalidateMoneyCache } from './cache.service'
import { resolveProvisionShortfall } from './shortfall.service'

export const transactionService = {
  async getTransactions(supabase: SupabaseClient, userId: string, filters?: TransactionFilters): Promise<Transaction[]> {
    const cacheKey = `transactions:${userId}:${JSON.stringify(filters || {})}`
    const cached = await redis.get<Transaction[]>(cacheKey)
    if (cached) return cached

    let query = supabase.from('transactions').select('*').eq('user_id', userId)

    if (filters?.accountId) query = query.eq('account_id', filters.accountId)
    if (filters?.type) query = query.eq('type', filters.type)

    query = query.order('txn_date', { ascending: false })

    const { data, error } = await query
    if (error) throw new Error(error.message)
    
    await redis.set(cacheKey, data, { ex: 3600 })
    return data
  },

  async addTransaction(supabase: SupabaseClient, userId: string, transactionData: NewTransaction): Promise<Transaction> {
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', transactionData.account_id)
      .eq('user_id', userId)
      .single()

    if (accountError) throw new Error(accountError.message)

    let newBalance = account.balance ?? 0
    if (transactionData.type === 'income') {
      newBalance += transactionData.amount
    } else if (transactionData.type === 'expense') {
      if (transactionData.amount > newBalance) {
        throw new Error(`Insufficient funds: Cannot spend more than account balance (₹${newBalance.toLocaleString('en-IN')})`)
      }
      newBalance -= transactionData.amount
    }

    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({ ...transactionData, user_id: userId })
      .select()
      .single()

    if (transactionError) throw new Error(transactionError.message)

    const { error: updateError } = await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', transactionData.account_id)
      .eq('user_id', userId)

    if (updateError) throw new Error(updateError.message)

    if (transactionData.type === 'provision' && transactionData.goal_id) {
      const { data: goal, error: fetchGoalError } = await supabase
        .from('goals')
        .select('saved_amount')
        .eq('id', transactionData.goal_id)
        .eq('user_id', userId)
        .single()

      if (!fetchGoalError && goal) {
        await supabase
          .from('goals')
          .update({ saved_amount: (goal.saved_amount ?? 0) + transactionData.amount })
          .eq('id', transactionData.goal_id)
          .eq('user_id', userId)
      }
    }

    await resolveProvisionShortfall(transactionData.account_id, userId, supabase)
    await invalidateMoneyCache(userId)
    return transaction
  },

  async transferMoney(
    supabase: SupabaseClient,
    userId: string,
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    description: string,
    txnDate: string
  ): Promise<void> {
    if (fromAccountId === toAccountId) throw new Error('Source and destination accounts must be different')
    if (amount <= 0) throw new Error('Amount must be greater than 0')

    const { data: fromAccount, error: fromErr } = await supabase
      .from('accounts')
      .select('balance, name')
      .eq('id', fromAccountId)
      .eq('user_id', userId)
      .single()
    if (fromErr || !fromAccount) throw new Error('Source account not found')

    const { data: toAccount, error: toErr } = await supabase
      .from('accounts')
      .select('balance, name')
      .eq('id', toAccountId)
      .eq('user_id', userId)
      .single()
    if (toErr || !toAccount) throw new Error('Destination account not found')

    if (amount > (fromAccount.balance ?? 0)) {
      throw new Error(`Insufficient funds: Cannot transfer more than source balance (₹${(fromAccount.balance ?? 0).toLocaleString('en-IN')})`)
    }

    const transferDesc = description || `Transfer: ${fromAccount.name} → ${toAccount.name}`

    await supabase
      .from('transactions')
      .insert({
        account_id: fromAccountId,
        amount,
        type: 'transfer',
        category: 'Transfer',
        description: transferDesc,
        txn_date: txnDate,
        user_id: userId,
      })

    await supabase
      .from('transactions')
      .insert({
        account_id: toAccountId,
        amount,
        type: 'transfer',
        category: 'Transfer',
        description: transferDesc,
        txn_date: txnDate,
        user_id: userId,
      })

    await supabase
      .from('accounts')
      .update({ balance: (fromAccount.balance ?? 0) - amount })
      .eq('id', fromAccountId)
      .eq('user_id', userId)

    await supabase
      .from('accounts')
      .update({ balance: (toAccount.balance ?? 0) + amount })
      .eq('id', toAccountId)
      .eq('user_id', userId)

    await resolveProvisionShortfall(fromAccountId, userId, supabase)
    await invalidateMoneyCache(userId)
  },

  async deleteTransaction(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError) throw new Error(fetchError.message)

    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', transaction.account_id)
      .eq('user_id', userId)
      .single()

    if (accountError) throw new Error(accountError.message)

    let newBalance = account.balance ?? 0
    if (transaction.type === 'income') {
      newBalance -= transaction.amount
    } else if (transaction.type === 'expense') {
      newBalance += transaction.amount
    }

    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (deleteError) throw new Error(deleteError.message)

    const { error: updateError } = await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', transaction.account_id)
      .eq('user_id', userId)

    if (updateError) throw new Error(updateError.message)

    if (transaction.type === 'provision' && transaction.goal_id) {
      const { data: goal, error: fetchGoalError } = await supabase
        .from('goals')
        .select('saved_amount')
        .eq('id', transaction.goal_id)
        .eq('user_id', userId)
        .single()

      if (!fetchGoalError && goal) {
        await supabase
          .from('goals')
          .update({ saved_amount: (goal.saved_amount ?? 0) - transaction.amount })
          .eq('id', transaction.goal_id)
          .eq('user_id', userId)
      }
    }

    await resolveProvisionShortfall(transaction.account_id, userId, supabase)
    await invalidateMoneyCache(userId)
  },

  async updateTransaction(supabase: SupabaseClient, userId: string, id: string, updateData: Partial<NewTransaction>): Promise<Transaction> {
    const { data: oldTx, error: matchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (matchError) throw new Error(matchError.message)

    if (oldTx.type === 'income' || oldTx.type === 'expense') {
      const { data: acc } = await supabase.from('accounts').select('balance').eq('id', oldTx.account_id).single()
      if (acc) {
        const adjustment = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount
        await supabase.from('accounts').update({ balance: (acc.balance ?? 0) + adjustment }).eq('id', oldTx.account_id)
      }
    }

    if (oldTx.type === 'provision' && oldTx.goal_id) {
      const { data: goal } = await supabase.from('goals').select('saved_amount').eq('id', oldTx.goal_id).single()
      if (goal) {
        await supabase.from('goals').update({ saved_amount: (goal.saved_amount ?? 0) - oldTx.amount }).eq('id', oldTx.goal_id)
      }
    }

    const { data: newTx, error: updateError } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) throw new Error(updateError.message)

    if (newTx.type === 'income' || newTx.type === 'expense') {
      const { data: acc } = await supabase.from('accounts').select('balance').eq('id', newTx.account_id).single()
      if (acc) {
        const adjustment = newTx.type === 'income' ? newTx.amount : -newTx.amount
        await supabase.from('accounts').update({ balance: (acc.balance ?? 0) + adjustment }).eq('id', newTx.account_id)
      }
    }

    if (newTx.type === 'provision' && newTx.goal_id) {
      const { data: goal } = await supabase.from('goals').select('saved_amount').eq('id', newTx.goal_id).single()
      if (goal) {
        await supabase.from('goals').update({ saved_amount: (goal.saved_amount ?? 0) + newTx.amount }).eq('id', newTx.goal_id)
      }
    }

    await resolveProvisionShortfall(oldTx.account_id, userId, supabase)
    if (newTx.account_id !== oldTx.account_id) {
      await resolveProvisionShortfall(newTx.account_id, userId, supabase)
    }

    await invalidateMoneyCache(userId)
    return newTx
  },

  async processRecurringTransactions(supabase: SupabaseClient, userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0]

    const { data: recurringTxns, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_recurring', true)
      .lte('next_recurrence_date', today)

    if (error || !recurringTxns || recurringTxns.length === 0) return

    for (const txn of recurringTxns) {
      const newTxnData = {
        account_id: txn.account_id || '',
        amount: txn.amount,
        category: txn.category || '',
        description: txn.description || '',
        goal_id: txn.goal_id,
        type: txn.type,
        txn_date: txn.next_recurrence_date || today,
        is_recurring: false,
        recurrence_interval: null,
        next_recurrence_date: null
      }

      try {
        await this.addTransaction(supabase, userId, newTxnData as NewTransaction)
        
        let nextDate = new Date(txn.next_recurrence_date || today)
        switch (txn.recurrence_interval) {
          case 'daily':
            nextDate.setDate(nextDate.getDate() + 1)
            break
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7)
            break
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1)
            break
          case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1)
            break
        }

        await supabase
          .from('transactions')
          .update({ next_recurrence_date: nextDate.toISOString().split('T')[0] })
          .eq('id', txn.id)
          .eq('user_id', userId)

      } catch (e) {
        console.error(`Failed to process recurring transaction ${txn.id}:`, e)
      }
    }
  }
}
