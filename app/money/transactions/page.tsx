'use client'

import { useState, useEffect } from 'react'
import { getAccounts, getTransactions, getGoals, getTransactionCategories } from '@/lib/actions/money'
import { TransactionRow } from '@/components/money/transaction-row'
import { AddTransactionDialog } from '@/components/money/add-transaction-dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import type { Account, Transaction, Goal, TransactionType, TransactionCategory } from '@/lib/types'

export default function TransactionsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [categories, setCategories] = useState<TransactionCategory[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all')
  const [accountFilter, setAccountFilter] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [typeFilter, accountFilter])

  const loadData = async () => {
    const [accountsData, goalsData, categoriesData] = await Promise.all([
      getAccounts(),
      getGoals(),
      getTransactionCategories(),
    ])
    setAccounts(accountsData)
    setGoals(goalsData)
    setCategories(categoriesData)

    const filters: { accountId?: string; type?: TransactionType } = {}
    if (accountFilter !== 'all') filters.accountId = accountFilter
    if (typeFilter !== 'all') filters.type = typeFilter

    const transactionsData = await getTransactions(
      Object.keys(filters).length > 0 ? filters : undefined
    )
    setTransactions(transactionsData)
  }

  const groupTransactionsByDate = (transactions: Transaction[]) => {
    const groups: { [key: string]: Transaction[] } = {}
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    transactions.forEach((txn) => {
      const txnDate = new Date(txn.txn_date || '')
      const dateStr = txn.txn_date || ''

      let label = dateStr
      if (txnDate.toDateString() === today.toDateString()) {
        label = 'Today'
      } else if (txnDate.toDateString() === yesterday.toDateString()) {
        label = 'Yesterday'
      } else {
        label = txnDate.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
        })
      }

      if (!groups[label]) groups[label] = []
      groups[label].push(txn)
    })

    return groups
  }

  const groupedTransactions = groupTransactionsByDate(transactions)

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between h-14 px-6 border-b border-[--border] shrink-0">
        <h1 className="text-[20px] font-medium">Transactions</h1>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-[--accent] text-[--accent-foreground] hover:bg-[--accent-hover] h-8 px-3 text-sm font-medium rounded-[--radius-md] shadow-none"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Transaction
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TransactionType | 'all')}>
            <SelectTrigger className="w-[180px] bg-[--background-subtle] border-[--border] h-9 text-sm rounded-[--radius-md]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="provision">Provision</SelectItem>
            </SelectContent>
          </Select>

          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-[180px] bg-[--background-subtle] border-[--border] h-9 text-sm rounded-[--radius-md]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Transaction List */}
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-[--text-secondary]">
              No transactions yet
            </p>
            <p className="text-xs text-[--text-tertiary] mt-1">
              Add one to get started
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="mt-4 bg-[--accent] text-[--accent-foreground] hover:bg-[--accent-hover] h-8 px-3 text-sm font-medium rounded-[--radius-md] shadow-none"
            >
              Add Transaction
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([date, txns]) => (
              <div key={date}>
                <h3 className="text-xs font-medium text-[--text-secondary] mb-2">
                  {date}
                </h3>
                <div>
                  {txns.map((transaction) => {
                    const account = accounts.find(
                      (acc) => acc.id === transaction.account_id
                    )
                    return (
                      <TransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        account={account}
                        colour={categories.find(c => c.name === transaction.category)?.color || '#64748B'}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddTransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        accounts={accounts}
        goals={goals}
        categories={categories}
        onCategoryAdded={loadData}
      />
    </div>
  )
}
