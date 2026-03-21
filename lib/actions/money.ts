'use server'

import { createClient } from '@/lib/supabase/server'
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
  TransactionFilters,
  GoalStatus,
  BillFrequency,
} from '@/lib/types'

async function getUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return user.id
}

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

export async function updateAccountBalance(id: string, newBalance: number): Promise<void> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { error } = await supabase
    .from('accounts')
    .update({ balance: newBalance })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
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
  } else if (transactionData.type === 'expense' || transactionData.type === 'provision') {
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

  return transaction
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
  } else if (transaction.type === 'expense' || transaction.type === 'provision') {
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

export async function provisionToGoal(goalId: string, amount: number, accountId: string): Promise<void> {
  const supabase = await createClient()
  const userId = await getUserId()

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

  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', accountId)
    .eq('user_id', userId)
    .single()

  if (accountError) throw new Error(accountError.message)

  const { error: updateAccountError } = await supabase
    .from('accounts')
    .update({ balance: (account.balance ?? 0) - amount })
    .eq('id', accountId)
    .eq('user_id', userId)

  if (updateAccountError) throw new Error(updateAccountError.message)

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
