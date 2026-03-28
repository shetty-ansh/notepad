'use server'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Account,
  Transaction,
  Goal,
  Ledger,
  Bill,
  Reminder,
  NewAccount,
  NewTransaction,
  NewGoal,
  NewLedgerEntry,
  NewBill,
  NewReminder,
  TransactionCategory,
  NewTransactionCategory,
  TransactionFilters,
  GoalStatus,
  BillFrequency,
} from '@/lib/types'

const getUserId = cache(async (): Promise<string> => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return user.id
})

// ============================================================================
// ACCOUNT OPERATIONS
// ============================================================================

export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error) throw new Error(error.message)
  return data
}

export async function addAccount(accountData: NewAccount): Promise<Account> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('accounts')
    .insert({ ...accountData, user_id: userId })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteAccount(accountId: string): Promise<void> {
  const supabase = await createClient()
  const userId = await getUserId()

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
}


export async function updateAccountBalance(id: string, newBalance: number): Promise<void> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { error } = await supabase
    .from('accounts')
    .update({ balance: newBalance })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  await resolveProvisionShortfall(id, userId, supabase)
}

export async function updateAccount(id: string, accountData: Partial<NewAccount & { color?: string | null }>): Promise<Account> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('accounts')
    .update(accountData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  await resolveProvisionShortfall(id, userId, supabase)
  return data
}

// ============================================================================
// TRANSACTION OPERATIONS
// ============================================================================

export async function getTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
  const supabase = await createClient()
  const userId = await getUserId()
  let query = supabase.from('transactions').select('*').eq('user_id', userId)

  if (filters?.accountId) query = query.eq('account_id', filters.accountId)
  if (filters?.type) query = query.eq('type', filters.type)

  query = query.order('txn_date', { ascending: false })

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function addTransaction(transactionData: NewTransaction): Promise<Transaction> {
  const supabase = await createClient()
  const userId = await getUserId()

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
  return transaction
}

export async function transferMoney(
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  description: string,
  txnDate: string
): Promise<void> {
  if (fromAccountId === toAccountId) throw new Error('Source and destination accounts must be different')
  if (amount <= 0) throw new Error('Amount must be greater than 0')

  const supabase = await createClient()
  const userId = await getUserId()

  // Get both accounts
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

  // Create debit transaction (from source)
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

  // Create credit transaction (to destination)
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

  // Update balances
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
}

export async function deleteTransaction(id: string): Promise<void> {
  const supabase = await createClient()
  const userId = await getUserId()

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
}

export async function updateTransaction(id: string, updateData: Partial<NewTransaction>): Promise<Transaction> {
  const supabase = await createClient()
  const userId = await getUserId()

  const { data: oldTx, error: matchError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (matchError) throw new Error(matchError.message)

  // To keep it clean, simply delete and re-add if balance-affecting fields changed
  // However we shouldn't change the ID. 
  // Let's do the math carefully here.

  // Revert old values
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

  // Apply update
  const { data: newTx, error: updateError } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (updateError) throw new Error(updateError.message)

  // Apply new values
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

  return newTx
}

export async function processRecurringTransactions(): Promise<void> {
  const supabase = await createClient()
  let userId: string
  try {
    userId = await getUserId()
  } catch {
    return // Not authenticated
  }
  
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
      await addTransaction(newTxnData)
      
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

// ============================================================================
// TRANSACTION CATEGORY OPERATIONS
// ============================================================================

export async function getTransactionCategories(): Promise<TransactionCategory[]> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('transaction_categories')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function addTransactionCategory(categoryData: NewTransactionCategory): Promise<TransactionCategory> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('transaction_categories')
    .insert({ ...categoryData, user_id: userId })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteTransactionCategory(id: string): Promise<void> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { error } = await supabase
    .from('transaction_categories')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

// ============================================================================
// GOAL OPERATIONS
// ============================================================================

export async function getGoals(): Promise<Goal[]> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return data
}

export async function addGoal(goalData: NewGoal): Promise<Goal> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('goals')
    .insert({ ...goalData, saved_amount: 0, status: 'active', user_id: userId })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateGoal(id: string, updateData: Partial<NewGoal>): Promise<Goal> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('goals')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function provisionToGoal(goalId: string, amount: number, accountId: string): Promise<void> {
  const supabase = await createClient()
  const userId = await getUserId()

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

  // Provisioning no longer updates account balance based on user requirements.
  // const { data: account, error: accountError } = await supabase
  //   .from('accounts')
  //   .select('balance')
  //   .eq('id', accountId)
  //   .eq('user_id', userId)
  //   .single()
  //
  // if (accountError) throw new Error(accountError.message)
  //
  // const { error: updateAccountError } = await supabase
  //   .from('accounts')
  //   .update({ balance: (account.balance ?? 0) - amount })
  //   .eq('id', accountId)
  //   .eq('user_id', userId)
  //
  // if (updateAccountError) throw new Error(updateAccountError.message)

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
}

export async function updateGoalStatus(id: string, status: GoalStatus): Promise<void> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { error } = await supabase
    .from('goals')
    .update({ status })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

export async function deleteGoal(id: string): Promise<void> {
  const supabase = await createClient()
  const userId = await getUserId()

  // First delete associated provision transactions
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
}

// ============================================================================
// LEDGER OPERATIONS
// ============================================================================

export async function getLedger(): Promise<Ledger[]> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('ledger')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function addLedgerEntry(entryData: NewLedgerEntry): Promise<Ledger> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('ledger')
    .insert({ ...entryData, status: 'pending', user_id: userId })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateLedgerEntry(id: string, entryData: Partial<NewLedgerEntry>): Promise<Ledger> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('ledger')
    .update(entryData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function settleLedgerEntry(id: string): Promise<void> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { error } = await supabase
    .from('ledger')
    .update({ status: 'settled' })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

export async function deleteLedgerEntry(id: string): Promise<void> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { error } = await supabase
    .from('ledger')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

// ============================================================================
// BILL OPERATIONS
// ============================================================================

export async function getBills(): Promise<Bill[]> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('next_due_date', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function addBill(billData: NewBill): Promise<Bill> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('bills')
    .insert({ ...billData, is_active: true, user_id: userId })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateBill(id: string, updateData: Partial<NewBill>): Promise<Bill> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('bills')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteBill(id: string): Promise<void> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { error } = await supabase
    .from('bills')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

export async function markBillPaid(id: string): Promise<void> {
  const supabase = await createClient()
  const userId = await getUserId()

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
}

export async function toggleBillActive(id: string, isActive: boolean): Promise<void> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { error } = await supabase
    .from('bills')
    .update({ is_active: isActive })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

// ============================================================================
// REMINDER OPERATIONS
// ============================================================================

export async function getReminders(): Promise<Reminder[]> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .order('remind_on', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function addReminder(reminderData: NewReminder): Promise<Reminder> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('reminders')
    .insert({ ...reminderData, is_done: false, user_id: userId })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function markReminderDone(id: string): Promise<void> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { error } = await supabase
    .from('reminders')
    .update({ is_done: true })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

// ============================================================================
// HELPER FOR SHORTFALLS
// ============================================================================

async function resolveProvisionShortfall(accountId: string | null, userId: string, supabase: SupabaseClient): Promise<void> {
  if (!accountId) return
  const { data: account } = await supabase.from('accounts').select('balance').eq('id', accountId).eq('user_id', userId).single()
  if (!account) return

  const currentBalance = account.balance || 0

  const { data: provisions } = await supabase
    .from('transactions')
    .select('*')
    .eq('account_id', accountId)
    .eq('user_id', userId)
    .eq('type', 'provision')
    .order('created_at', { ascending: false })

  if (!provisions || provisions.length === 0) return

  const totalProvisioned = provisions.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

  if (currentBalance >= totalProvisioned) return

  let shortfall = totalProvisioned - currentBalance

  for (const prov of provisions) {
    if (shortfall <= 0) break

    const currentProvAmount = prov.amount || 0
    if (currentProvAmount <= 0) continue

    const deduction = Math.min(shortfall, currentProvAmount)
    const newProvAmount = currentProvAmount - deduction

    if (newProvAmount <= 0) {
      await supabase.from('transactions').delete().eq('id', prov.id).eq('user_id', userId)
    } else {
      await supabase.from('transactions').update({ amount: newProvAmount }).eq('id', prov.id).eq('user_id', userId)
    }

    if (prov.goal_id) {
      const { data: goal } = await supabase.from('goals').select('saved_amount').eq('id', prov.goal_id).eq('user_id', userId).single()
      if (goal) {
        const newGoalSavedAmount = Math.max(0, (goal.saved_amount || 0) - deduction)
        await supabase.from('goals').update({ saved_amount: newGoalSavedAmount }).eq('id', prov.goal_id).eq('user_id', userId)
      }
    }

    shortfall -= deduction
  }
}

