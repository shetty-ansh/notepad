'use client'

import { useState, useEffect } from 'react'
import {
  getAccounts,
  getTransactions,
  getGoals,
  getLedger,
  getBills,
  getTransactionCategories,
} from '@/lib/actions/money'
import { AccountCard } from '@/components/money/account-card'
import { AddAccountButton } from '@/components/money/add-account-button'
import { TransactionRow } from '@/components/money/transaction-row'
import { GoalCard } from '@/components/money/goal-card'
import { ProvisionDialog } from '@/components/money/provision-dialog'
import { AccountDetailsDialog } from '@/components/money/account-details-dialog'
import { AddTransactionDialog } from '@/components/money/add-transaction-dialog'
import { LedgerRow } from '@/components/money/ledger-row'
import { BillRow } from '@/components/money/bill-row'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { Account, Transaction, Goal, Ledger, Bill, TransactionCategory } from '@/lib/types'

export default function MoneyOverviewPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [ledger, setLedger] = useState<Ledger[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [categories, setCategories] = useState<TransactionCategory[]>([])
  const [provisionDialogOpen, setProvisionDialogOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [addTransactionOpen, setAddTransactionOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [
      accountsData,
      transactionsData,
      goalsData,
      ledgerData,
      billsData,
      categoriesData,
    ] = await Promise.all([
      getAccounts(),
      getTransactions(),
      getGoals(),
      getLedger(),
      getBills(),
      getTransactionCategories(),
    ])
    setAccounts(accountsData)
    setTransactions(transactionsData)
    setGoals(goalsData)
    setLedger(ledgerData)
    setBills(billsData)
    setCategories(categoriesData)
  }

  const handleProvision = (goal: Goal) => {
    setSelectedGoal(goal)
    setProvisionDialogOpen(true)
  }

  // Calculate monthly summary
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const monthlyTransactions = transactions.filter((txn) => {
    const txnDate = new Date(txn.txn_date || '')
    return (
      txnDate.getMonth() === currentMonth &&
      txnDate.getFullYear() === currentYear
    )
  })

  const totalIn = monthlyTransactions
    .filter((txn) => txn.type === 'income')
    .reduce((sum: number, txn: Transaction) => sum + (txn.amount || 0), 0)

  const totalOut = monthlyTransactions
    .filter((txn) => txn.type === 'expense')
    .reduce((sum: number, txn: Transaction) => sum + (txn.amount || 0), 0)

  const net = totalIn - totalOut

  return (
    <div className="p-6 space-y-6">
      {/* Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-400 rounded-[12px] p-4 transition-transform duration-300 hover:scale-102 hover:shadow-md">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary]">
            Total In
          </p>
          <p className="mt-1 text-2xl font-semibold font-mono text-[--success]">
            ₹{totalIn.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="bg-white border border-gray-400 rounded-[12px] p-4 transition-transform duration-300 hover:scale-102 hover:shadow-md">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary]">
            Total Out
          </p>
          <p className="mt-1 text-2xl font-semibold font-mono text-[--danger]">
            ₹{totalOut.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="bg-white border border-gray-400 rounded-[12px] p-4 transition-transform duration-300 hover:scale-102 hover:shadow-md">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary]">
            Net
          </p>
          <p
            className={`mt-1 text-2xl font-semibold font-mono ${net >= 0 ? 'text-[--success]' : 'text-[--danger]'
              }`}
          >
            {net >= 0 ? '+' : ''}₹{Math.abs(net).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {/* Accounts Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary]">
            Accounts
          </h2>
          <AddAccountButton className="bg-black" onSuccess={loadData} />
        </div>

        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-[--text-secondary]">
              No accounts yet
            </p>
            <p className="text-xs text-[--text-tertiary] mt-1">
              Add one to get started
            </p>
            <AddAccountButton className="mt-4 bg-black" onSuccess={loadData} />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 transition-transform duration-300 hover:scale-102">
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} goals={goals} transactions={transactions} className="min-w-[250px] w-64 h-36 transition-transform duration-300 hover:scale-102 hover:shadow-md" onSelect={() => setSelectedAccount(account)} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary]">
            Recent Transactions
          </h2>
          {transactions.length > 0 && (
            <Link
              href="/money/transactions"
              className="text-xs text-[--accent] hover:underline"
            >
              View all →
            </Link>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-[--card] border border-[--border] rounded-[12px]">
            <p className="text-sm font-medium text-[--text-secondary]">
              No transactions yet
            </p>
            <p className="text-xs text-[--text-tertiary] mt-1">
              Add one to get started
            </p>
          </div>
        ) : (
          <div className={"rounded-[12px"}>
            {transactions.slice(0, 10).map((transaction) => {
              const account = accounts.find(
                (acc) => acc.id === transaction.account_id
              )
              return (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  account={account}
                  colour={categories.find(c => c.name === transaction.category)?.color || '#64748B'}
                  onEdit={(tx) => {
                    setEditingTransaction(tx)
                    setAddTransactionOpen(true)
                  }}
                  onDelete={loadData}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Goals Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary]">
            Goals
          </h2>
          {goals.length > 0 && (
            <Link
              href="/money/goals"
              className="text-xs text-[--accent] hover:underline"
            >
              View all →
            </Link>
          )}
        </div>

        {goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-[--card] border border-[--border] rounded-[12px]">
            <p className="text-sm font-medium text-[--text-secondary]">
              No goals yet
            </p>
            <p className="text-xs text-[--text-tertiary] mt-1">
              Add one to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {goals.slice(0, 3).map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onProvision={() => handleProvision(goal)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Ledger Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary]">
            Ledger
          </h2>
          {ledger.length > 0 && (
            <Link
              href="/money/ledger"
              className="text-xs text-[--accent] hover:underline"
            >
              View all →
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* I Owe */}
          <div>
            <h3 className="text-xs font-medium text-[--text-secondary] mb-2">
              I Owe
            </h3>
            {ledger.filter((e) => e.direction === 'i_owe' && e.status === 'pending')
              .length === 0 ? (
              <div className="bg-[--card] border border-[--border] rounded-[12px] p-4 text-center">
                <p className="text-sm text-[--text-secondary]">
                  No pending debts
                </p>
              </div>
            ) : (
              <div className="bg-[--card] border border-[--border] rounded-[12px] p-4">
                {ledger
                  .filter((e) => e.direction === 'i_owe' && e.status === 'pending')
                  .slice(0, 3)
                  .map((entry) => (
                    <LedgerRow
                      key={entry.id}
                      entry={entry}
                      onSettle={() => { }}
                    />
                  ))}
              </div>
            )}
          </div>

          {/* They Owe Me */}
          <div>
            <h3 className="text-xs font-medium text-[--text-secondary] mb-2">
              They Owe Me
            </h3>
            {ledger.filter(
              (e) => e.direction === 'they_owe' && e.status === 'pending'
            ).length === 0 ? (
              <div className="bg-[--card] border border-[--border] rounded-[12px] p-4 text-center">
                <p className="text-sm text-[--text-secondary]">
                  No pending receivables
                </p>
              </div>
            ) : (
              <div className="bg-[--card] border border-[--border] rounded-[12px] p-4">
                {ledger
                  .filter(
                    (e) => e.direction === 'they_owe' && e.status === 'pending'
                  )
                  .slice(0, 3)
                  .map((entry) => (
                    <LedgerRow
                      key={entry.id}
                      entry={entry}
                      onSettle={() => { }}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Bills Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary]">
            Upcoming Bills
          </h2>
          {bills.length > 0 && (
            <Link
              href="/money/bills"
              className="text-xs text-[--accent] hover:underline"
            >
              View all →
            </Link>
          )}
        </div>

        {bills.filter((bill) => {
          if (!bill.next_due_date) return false
          const dueDate = new Date(bill.next_due_date)
          const today = new Date()
          const diffDays = Math.ceil(
            (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )
          return diffDays <= 14
        }).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-[--card] border border-[--border] rounded-[12px]">
            <p className="text-sm font-medium text-[--text-secondary]">
              No upcoming bills
            </p>
          </div>
        ) : (
          <div className="bg-[--card] border border-[--border] rounded-[12px] p-4">
            {bills
              .filter((bill) => {
                if (!bill.next_due_date) return false
                const dueDate = new Date(bill.next_due_date)
                const today = new Date()
                const diffDays = Math.ceil(
                  (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                )
                return diffDays <= 14
              })
              .map((bill) => {
                const account = accounts.find((acc) => acc.id === bill.account_id)
                return (
                  <BillRow
                    key={bill.id}
                    bill={bill}
                    account={account}
                    onMarkPaid={() => { }}
                  />
                )
              })}
          </div>
        )}
      </div>

      {selectedGoal && (
        <ProvisionDialog
          open={provisionDialogOpen}
          onOpenChange={setProvisionDialogOpen}
          goal={selectedGoal}
          accounts={accounts}
          onSuccess={loadData}
        />
      )}

      <AccountDetailsDialog
        open={!!selectedAccount}
        onOpenChange={(open) => !open && setSelectedAccount(null)}
        account={selectedAccount}
        transactions={transactions}
        goals={goals}
        categories={categories}
        onProvision={handleProvision}
        onEditTransaction={(tx: Transaction) => {
          setEditingTransaction(tx)
          setAddTransactionOpen(true)
        }}
        onDeleteTransaction={loadData}
      />

      <button
        onClick={() => {
          setEditingTransaction(null)
          setAddTransactionOpen(true)
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-[0_4px_14px_0_rgba(0,0,0,0.25)] hover:bg-gray-800 transition-transform duration-200 hover:scale-[1.05] active:scale-95 z-50"
        aria-label="Add Transaction"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      <AddTransactionDialog
        open={addTransactionOpen}
        onOpenChange={(open) => {
          setAddTransactionOpen(open)
          if (!open) setEditingTransaction(null)
        }}
        accounts={accounts}
        goals={goals}
        categories={categories}
        onCategoryAdded={loadData}
        onSuccess={loadData}
        existingTransaction={editingTransaction}
      />
    </div>
  )
}
