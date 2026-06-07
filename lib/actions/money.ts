'use server'

import { revalidatePath } from 'next/cache'
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

import { getAuthSession } from '@/lib/utils/getAuthSession'
import { accountService } from '@/lib/services/money/account.service'
import { transactionService } from '@/lib/services/money/transaction.service'
import { categoryService } from '@/lib/services/money/category.service'
import { goalService } from '@/lib/services/money/goal.service'
import { ledgerService } from '@/lib/services/money/ledger.service'
import { billService } from '@/lib/services/money/bill.service'
import { reminderService } from '@/lib/services/money/reminder.service'

// ============================================================================
// ACCOUNT OPERATIONS
// ============================================================================

export async function getAccounts(): Promise<Account[]> {
  const { supabase, userId } = await getAuthSession()
  return accountService.getAccounts(supabase, userId)
}

export async function addAccount(accountData: NewAccount): Promise<Account> {
  const { supabase, userId } = await getAuthSession()
  const data = await accountService.addAccount(supabase, userId, accountData)
  revalidatePath('/', 'layout')
  return data
}

export async function deleteAccount(accountId: string): Promise<void> {
  const { supabase, userId } = await getAuthSession()
  await accountService.deleteAccount(supabase, userId, accountId)
  revalidatePath('/', 'layout')
}

export async function updateAccountBalance(id: string, newBalance: number): Promise<void> {
  const { supabase, userId } = await getAuthSession()
  await accountService.updateAccountBalance(supabase, userId, id, newBalance)
  revalidatePath('/', 'layout')
}

export async function updateAccount(id: string, accountData: Partial<NewAccount & { color?: string | null }>): Promise<Account> {
  const { supabase, userId } = await getAuthSession()
  const data = await accountService.updateAccount(supabase, userId, id, accountData)
  revalidatePath('/', 'layout')
  return data
}

// ============================================================================
// TRANSACTION OPERATIONS
// ============================================================================

export async function getTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
  const { supabase, userId } = await getAuthSession()
  return transactionService.getTransactions(supabase, userId, filters)
}

export async function addTransaction(transactionData: NewTransaction): Promise<Transaction> {
  const { supabase, userId } = await getAuthSession()
  const data = await transactionService.addTransaction(supabase, userId, transactionData)
  revalidatePath('/', 'layout')
  return data
}

export async function transferMoney(
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  description: string,
  txnDate: string
): Promise<void> {
  const { supabase, userId } = await getAuthSession()
  await transactionService.transferMoney(supabase, userId, fromAccountId, toAccountId, amount, description, txnDate)
  revalidatePath('/', 'layout')
}

export async function deleteTransaction(id: string): Promise<void> {
  const { supabase, userId } = await getAuthSession()
  await transactionService.deleteTransaction(supabase, userId, id)
  revalidatePath('/', 'layout')
}

export async function updateTransaction(id: string, updateData: Partial<NewTransaction>): Promise<Transaction> {
  const { supabase, userId } = await getAuthSession()
  const data = await transactionService.updateTransaction(supabase, userId, id, updateData)
  revalidatePath('/', 'layout')
  return data
}

export async function processRecurringTransactions(): Promise<void> {
  try {
    const { supabase, userId } = await getAuthSession()
    await transactionService.processRecurringTransactions(supabase, userId)
    revalidatePath('/', 'layout')
  } catch {
    // Silently return if not authenticated, as this might be called globally
    return
  }
}

// ============================================================================
// TRANSACTION CATEGORY OPERATIONS
// ============================================================================

export async function getTransactionCategories(): Promise<TransactionCategory[]> {
  const { supabase, userId } = await getAuthSession()
  return categoryService.getTransactionCategories(supabase, userId)
}

export async function addTransactionCategory(categoryData: NewTransactionCategory): Promise<TransactionCategory> {
  const { supabase, userId } = await getAuthSession()
  const data = await categoryService.addTransactionCategory(supabase, userId, categoryData)
  revalidatePath('/', 'layout')
  return data
}

export async function deleteTransactionCategory(id: string): Promise<void> {
  const { supabase, userId } = await getAuthSession()
  await categoryService.deleteTransactionCategory(supabase, userId, id)
  revalidatePath('/', 'layout')
}

// ============================================================================
// GOAL OPERATIONS
// ============================================================================

export async function getGoals(): Promise<Goal[]> {
  const { supabase, userId } = await getAuthSession()
  return goalService.getGoals(supabase, userId)
}

export async function addGoal(goalData: NewGoal): Promise<Goal> {
  const { supabase, userId } = await getAuthSession()
  const data = await goalService.addGoal(supabase, userId, goalData)
  revalidatePath('/', 'layout')
  return data
}

export async function updateGoal(id: string, updateData: Partial<NewGoal>): Promise<Goal> {
  const { supabase, userId } = await getAuthSession()
  const data = await goalService.updateGoal(supabase, userId, id, updateData)
  revalidatePath('/', 'layout')
  return data
}

export async function provisionToGoal(goalId: string, amount: number, accountId: string): Promise<void> {
  const { supabase, userId } = await getAuthSession()
  await goalService.provisionToGoal(supabase, userId, goalId, amount, accountId)
  revalidatePath('/', 'layout')
}

export async function updateGoalStatus(id: string, status: GoalStatus): Promise<void> {
  const { supabase, userId } = await getAuthSession()
  await goalService.updateGoalStatus(supabase, userId, id, status)
  revalidatePath('/', 'layout')
}

export async function deleteGoal(id: string): Promise<void> {
  const { supabase, userId } = await getAuthSession()
  await goalService.deleteGoal(supabase, userId, id)
  revalidatePath('/', 'layout')
}

// ============================================================================
// LEDGER OPERATIONS
// ============================================================================

export async function getLedger(): Promise<Ledger[]> {
  const { supabase, userId } = await getAuthSession()
  return ledgerService.getLedger(supabase, userId)
}

export async function addLedgerEntry(entryData: NewLedgerEntry): Promise<Ledger> {
  const { supabase, userId } = await getAuthSession()
  const data = await ledgerService.addLedgerEntry(supabase, userId, entryData)
  revalidatePath('/', 'layout')
  return data
}

export async function updateLedgerEntry(id: string, entryData: Partial<NewLedgerEntry>): Promise<Ledger> {
  const { supabase, userId } = await getAuthSession()
  const data = await ledgerService.updateLedgerEntry(supabase, userId, id, entryData)
  revalidatePath('/', 'layout')
  return data
}

export async function settleLedgerEntry(id: string): Promise<void> {
  const { supabase, userId } = await getAuthSession()
  await ledgerService.settleLedgerEntry(supabase, userId, id)
  revalidatePath('/', 'layout')
}

export async function deleteLedgerEntry(id: string): Promise<void> {
  const { supabase, userId } = await getAuthSession()
  await ledgerService.deleteLedgerEntry(supabase, userId, id)
  revalidatePath('/', 'layout')
}

// ============================================================================
// BILL OPERATIONS
// ============================================================================

export async function getBills(): Promise<Bill[]> {
  const { supabase, userId } = await getAuthSession()
  return billService.getBills(supabase, userId)
}

export async function addBill(billData: NewBill): Promise<Bill> {
  const { supabase, userId } = await getAuthSession()
  const data = await billService.addBill(supabase, userId, billData)
  revalidatePath('/', 'layout')
  return data
}

export async function updateBill(id: string, updateData: Partial<NewBill>): Promise<Bill> {
  const { supabase, userId } = await getAuthSession()
  const data = await billService.updateBill(supabase, userId, id, updateData)
  revalidatePath('/', 'layout')
  return data
}

export async function deleteBill(id: string): Promise<void> {
  const { supabase, userId } = await getAuthSession()
  await billService.deleteBill(supabase, userId, id)
  revalidatePath('/', 'layout')
}

export async function markBillPaid(id: string): Promise<void> {
  const { supabase, userId } = await getAuthSession()
  await billService.markBillPaid(supabase, userId, id)
  revalidatePath('/', 'layout')
}

export async function toggleBillActive(id: string, isActive: boolean): Promise<void> {
  const { supabase, userId } = await getAuthSession()
  await billService.toggleBillActive(supabase, userId, id, isActive)
  revalidatePath('/', 'layout')
}

// ============================================================================
// REMINDER OPERATIONS
// ============================================================================

export async function getReminders(): Promise<Reminder[]> {
  const { supabase, userId } = await getAuthSession()
  return reminderService.getReminders(supabase, userId)
}

export async function addReminder(reminderData: NewReminder): Promise<Reminder> {
  const { supabase, userId } = await getAuthSession()
  const data = await reminderService.addReminder(supabase, userId, reminderData)
  revalidatePath('/', 'layout')
  return data
}

export async function markReminderDone(id: string): Promise<void> {
  const { supabase, userId } = await getAuthSession()
  await reminderService.markReminderDone(supabase, userId, id)
  revalidatePath('/', 'layout')
}
