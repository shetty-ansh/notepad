import type { Database } from './database.types'

export type Account = Database['public']['Tables']['accounts']['Row'] & { color?: string | null }
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']
export type Ledger = Database['public']['Tables']['ledger']['Row']
export type Bill = Database['public']['Tables']['bills']['Row']
export type Reminder = Database['public']['Tables']['reminders']['Row']
export type Note = Database['public']['Tables']['notes']['Row']
export type Todo = Database['public']['Tables']['todos']['Row']
export type Habit = Database['public']['Tables']['habits']['Row']
export type HabitLog = Database['public']['Tables']['habit_logs']['Row']
export type Event = Database['public']['Tables']['events']['Row']

// Temporarily defining this manually until Supabase types are regenerated after the table is created
export type TransactionCategory = {
  id: string
  name: string
  icon: string | null
  color: string | null
  user_id: string | null
  created_at: string | null
}

export type TransactionType = 'income' | 'expense' | 'transfer' | 'provision'
export type GoalStatus = 'active' | 'completed' | 'paused'
export type LedgerDirection = 'i_owe' | 'they_owe'
export type LedgerStatus = 'pending' | 'settled'
export type TodoStatus = 'todo' | 'in_progress' | 'done'
export type TodoType = 'task' | 'goal'
export type Priority = 'low' | 'medium' | 'high'
export type Section = 'general' | 'money' | 'work' | 'habits'
export type BillFrequency = 'monthly' | 'weekly' | 'yearly' | 'once'

// Money-specific utility types
export type NewAccount = Omit<Account, 'id' | 'created_at'>
export type NewTransaction = Omit<Transaction, 'id' | 'created_at'>
export type NewGoal = Omit<Goal, 'id' | 'created_at' | 'saved_amount'>
export type NewLedgerEntry = Omit<Ledger, 'id' | 'created_at'>
export type NewBill = Omit<Bill, 'id' | 'created_at'>
export type NewReminder = Omit<Reminder, 'id' | 'created_at'>
export type NewTransactionCategory = Omit<TransactionCategory, 'id' | 'created_at' | 'user_id'>

export type TransactionFilters = {
  accountId?: string
  type?: TransactionType
}