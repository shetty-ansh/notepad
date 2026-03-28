'use client'

import Loader from '@/components/loader-animation'

import { useState, useEffect } from 'react'
import {
  getAccounts,
  getTransactions,
  getGoals,
  getLedger,
  getBills,
  getTransactionCategories,
  settleLedgerEntry,
  deleteLedgerEntry,
  deleteGoal,
  deleteBill,
  markBillPaid,
  processRecurringTransactions,
} from '@/lib/actions/money'
import { AccountCard } from '@/components/money/account-card'
import { AddAccountButton } from '@/components/money/add-account-button'
import { TransactionRow } from '@/components/money/transaction-row'
import { GoalCard } from '@/components/money/goal-card'
import { ProvisionDialog } from '@/components/money/provision-dialog'
import { AddTransactionDialog } from '@/components/money/add-transaction-dialog'
import { LedgerRow } from '@/components/money/ledger-row'
import { AddLedgerDialog } from '@/components/money/add-ledger-dialog'
import { AddGoalDialog } from '@/components/money/add-goal-dialog'
import { AddBillDialog } from '@/components/money/add-bill-dialog'
import { BillRow } from '@/components/money/bill-row'
import { MoneyCalendar } from '@/components/money/money-calendar'
import { MoneyCharts } from '@/components/money/money-charts'
import { MobileCarousel } from '@/components/money/mobile-carousel'
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
  const [addTransactionOpen, setAddTransactionOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [ledgerDialogOpen, setLedgerDialogOpen] = useState(false)
  const [editingLedger, setEditingLedger] = useState<Ledger | null>(null)
  const [goalDialogOpen, setGoalDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [billDialogOpen, setBillDialogOpen] = useState(false)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await processRecurringTransactions()
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
    } finally {
      setLoading(false)
    }
  }

  const handleProvision = (goal?: Goal | null) => {
    setSelectedGoal(goal || null)
    setProvisionDialogOpen(true)
  }

  const handleDeleteGoal = async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id))
    try {
      await deleteGoal(id)
      loadData()
    } catch {
      loadData()
    }
  }

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setGoalDialogOpen(true)
  }

  const handleGoalSuccess = (goal: Goal, isEdit: boolean) => {
    setGoals(prev => {
      if (isEdit) {
        return prev.map(g => g.id === goal.id ? goal : g)
      } else {
        return [goal, ...prev]
      }
    })
  }

  const handleSettleLedger = async (id: string) => {
    setLedger(prev => prev.map(e => e.id === id ? { ...e, status: 'settled' } : e))
    try {
      await settleLedgerEntry(id)
      loadData()
    } catch {
      loadData()
    }
  }

  const handleDeleteLedger = async (id: string) => {
    setLedger(prev => prev.filter(e => e.id !== id))
    try {
      await deleteLedgerEntry(id)
      loadData()
    } catch {
      loadData()
    }
  }

  const handleEditLedger = (entry: Ledger) => {
    setEditingLedger(entry)
    setLedgerDialogOpen(true)
  }

  const handleLedgerSuccess = (entry: Ledger, isEdit: boolean) => {
    setLedger(prev => {
      if (isEdit) {
        return prev.map(e => e.id === entry.id ? entry : e)
      } else {
        return [entry, ...prev].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      }
    })
  }

  const handleMarkPaid = async (billId: string) => {
    try {
      await markBillPaid(billId)
      loadData()
    } catch {
      loadData()
    }
  }

  const handleDeleteBill = async (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id))
    try {
      await deleteBill(id)
      loadData()
    } catch {
      loadData()
    }
  }

  const handleEditBill = (bill: Bill) => {
    setEditingBill(bill)
    setBillDialogOpen(true)
  }

  const handleBillSuccess = (bill: Bill, isEdit: boolean) => {
    setBills(prev => {
      let updated = prev
      if (isEdit) {
        updated = prev.map(b => b.id === bill.id ? bill : b)
      } else {
        updated = [bill, ...prev]
      }
      return updated.sort((a, b) => {
        if (!a.next_due_date) return 1
        if (!b.next_due_date) return -1
        return new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime()
      })
    })
    loadData()
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

  const pendingLedger = ledger.filter((e) => e.status === 'pending')
  const upcomingBills = bills.filter((bill) => {
    if (!bill.next_due_date) return false
    const dueDate = new Date(bill.next_due_date)
    const today = new Date()
    const diffDays = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
    return diffDays <= 14
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Summary Bar — Desktop: 3 cards, Mobile: single compact card */}
      {/* Desktop */}
      <div className="hidden md:grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-400 rounded-[12px] p-4 transition-transform duration-300 hover:scale-102 hover:shadow-md">
          <p className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary]">
            Total In
          </p>
          <p className="mt-1 text-3xl font-bold font-mono text-[--success]">
            ₹{totalIn.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-white border border-gray-400 rounded-[12px] p-4 transition-transform duration-300 hover:scale-102 hover:shadow-md">
          <p className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary]">
            Total Out
          </p>
          <p className="mt-1 text-3xl font-bold font-mono text-[--danger]">
            ₹{totalOut.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-white border border-gray-400 rounded-[12px] p-4 transition-transform duration-300 hover:scale-102 hover:shadow-md">
          <p className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary]">
            Net
          </p>
          <p className={`mt-1 text-3xl font-bold font-mono ${net >= 0 ? 'text-[--success]' : 'text-[--danger]'}`}>
            {net >= 0 ? '+' : ''}₹{Math.abs(net).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Mobile: Compact single card */}
      <div className="md:hidden bg-white border border-gray-400 rounded-[12px] p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-[9px] font-medium uppercase tracking-wider text-[--text-secondary]">In</p>
            <p className="text-lg font-bold font-mono text-[--success]">
              ₹{totalIn.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="flex-1 text-center">
            <p className="text-[9px] font-medium uppercase tracking-wider text-[--text-secondary]">Out</p>
            <p className="text-lg font-bold font-mono text-[--danger]">
              ₹{totalOut.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="flex-1 text-right">
            <p className="text-[9px] font-medium uppercase tracking-wider text-[--text-secondary]">Net</p>
            <p className={`text-lg font-bold font-mono ${net >= 0 ? 'text-[--success]' : 'text-[--danger]'}`}>
              {net >= 0 ? '+' : ''}₹{Math.abs(net).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
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
          </div>
        ) : (
          <>
            {/* Desktop: stacked list */}
            <div className="hidden md:flex flex gap-4 p-3">
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  goals={goals}
                  transactions={transactions}
                  categories={categories}
                  className="transition-all duration-300"
                  onProvision={handleProvision}
                  onEditTransaction={(tx: Transaction) => {
                    setEditingTransaction(tx)
                    setAddTransactionOpen(true)
                  }}
                  onDeleteTransaction={loadData}
                  onUpdate={loadData}
                />
              ))}
            </div>
            {/* Mobile: carousel */}
            <MobileCarousel className='py-3'>
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  goals={goals}
                  transactions={transactions}
                  categories={categories}
                  className="transition-all duration-300"
                  onProvision={handleProvision}
                  onEditTransaction={(tx: Transaction) => {
                    setEditingTransaction(tx)
                    setAddTransactionOpen(true)
                  }}
                  onDeleteTransaction={loadData}
                  onUpdate={loadData}
                />
              ))}
            </MobileCarousel>
          </>
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
              className="text-xs border border-[0.5px] border-black rounded-[4px] px-2 py-1 hover:bg-black hover:text-white"
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
          <div className="rounded-[12px]">
            {transactions.slice(0, 10).map((transaction, i) => {
              const account = accounts.find(
                (acc) => acc.id === transaction.account_id
              )
              return (
                <div key={transaction.id} className={i >= 5 ? 'hidden md:block' : ''}>
                  <TransactionRow
                    transaction={transaction}
                    account={account}
                    colour={categories.find(c => c.name === transaction.category)?.color || '#64748B'}
                    onEdit={(tx) => {
                      setEditingTransaction(tx)
                      setAddTransactionOpen(true)
                    }}
                    onDelete={loadData}
                  />
                </div>
              )
            })}
            {/* Show "View all" on mobile if more than 5 */}
            <div className="md:hidden mt-2">
              {transactions.length > 5 && (
                <Link
                  href="/money/transactions"
                  className="text-xs border border-[0.5px] border-black rounded-[4px] px-2 py-1 hover:bg-black hover:text-white"
                >
                  View all {transactions.length} transactions →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>


      {/* Transaction Calendar */}
      {transactions.length > 0 && (
        <div className="hidden md:block">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary]">
              Transaction Calendar
            </h2>
          </div>
          <MoneyCalendar transactions={transactions} accounts={accounts} />
        </div>
      )}


      {/* Charts/Stats Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary]">
            Charts
          </h2>
          <Link
            href="/money/stats"
            className="text-xs border border-[0.5px] border-black rounded-[4px] px-2 py-1 hover:bg-black hover:text-white"
          >
            View Stats →
          </Link>
        </div>
        <MoneyCharts transactions={transactions} categories={categories} accounts={accounts} />
      </div>


      {/* Goals Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary]">
            Goals
          </h2>
          <div className="flex items-center gap-2">
            {goals.length > 0 && (
              <Link
                href="/money/goals"
                className="text-xs border border-[0.5px] border-black rounded-[4px] px-2 py-1 hover:bg-black hover:text-white"
              >
                View all →
              </Link>
            )}
            <button
              onClick={() => {
                setEditingGoal(null)
                setGoalDialogOpen(true)
              }}
              className="ml-auto text-xs hover:border-black hover:text-black hover:bg-transparent hover:border-[0.5px] rounded-[4px] px-2 py-1 border-[0.5px] bg-black text-white flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
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
          <>
            {/* Desktop: grid */}
            <div className="hidden md:grid grid-cols-3 gap-4">
              {goals.slice(0, 3).map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onProvision={() => handleProvision(goal)}
                  onEdit={() => handleEditGoal(goal)}
                  onDelete={() => handleDeleteGoal(goal.id)}
                />
              ))}
            </div>
            {/* Mobile: carousel */}
            <MobileCarousel>
              {goals.slice(0, 6).map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onProvision={() => handleProvision(goal)}
                  onEdit={() => handleEditGoal(goal)}
                  onDelete={() => handleDeleteGoal(goal.id)}
                />
              ))}
            </MobileCarousel>
          </>
        )}
      </div>

      {/* Ledger Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary]">
            Ledger
          </h2>
          <div className="flex items-center gap-2">
            {ledger.length > 0 && (
              <Link
                href="/money/ledger"
                className="text-xs border border-[0.5px] border-black rounded-[4px] px-2 py-1 hover:bg-black hover:text-white"
              >
                View all →
              </Link>
            )}
            <button
              onClick={() => {
                setEditingLedger(null)
                setLedgerDialogOpen(true)
              }}
              className="ml-auto text-xs hover:border-black hover:text-black hover:bg-transparent hover:border-[0.5px] rounded-[4px] px-2 py-1 border-[0.5px] bg-black text-white flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

        </div>

        {pendingLedger.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-[--card] border border-[--border] rounded-[12px]">
            <p className="text-sm font-medium text-[--text-secondary]">
              No pending entries
            </p>
            <p className="text-xs text-[--text-tertiary] mt-1">
              Add one to get started
            </p>
          </div>
        ) : (
          <>
            {/* Desktop: grid */}
            <div className="hidden md:grid grid-cols-3 gap-4">
              {pendingLedger.slice(0, 6).map((entry) => (
                <LedgerRow
                  key={entry.id}
                  entry={entry}
                  onSettle={() => handleSettleLedger(entry.id)}
                  onEdit={() => handleEditLedger(entry)}
                  onDelete={() => handleDeleteLedger(entry.id)}
                />
              ))}
            </div>
            {/* Mobile: carousel */}
            <MobileCarousel>
              {pendingLedger.slice(0, 6).map((entry) => (
                <LedgerRow
                  key={entry.id}
                  entry={entry}
                  onSettle={() => handleSettleLedger(entry.id)}
                  onEdit={() => handleEditLedger(entry)}
                  onDelete={() => handleDeleteLedger(entry.id)}
                />
              ))}
            </MobileCarousel>
          </>
        )}
      </div>

      {/* Upcoming Bills Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary]">
            Upcoming Bills
          </h2>
          <div className="flex items-center gap-2">
            {upcomingBills.length > 0 && (
              <Link
                href="/money/bills"
                className="text-xs border border-[0.5px] border-black rounded-[4px] px-2 py-1 hover:bg-black hover:text-white"
              >
                View all →
              </Link>
            )}
            <button
              onClick={() => {
                setEditingBill(null)
                setBillDialogOpen(true)
              }}
              className="ml-auto text-xs hover:border-black hover:text-black hover:bg-transparent hover:border-[0.5px] rounded-[4px] px-2 py-1 border-[0.5px] bg-black text-white flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

        </div>

        {upcomingBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-[--card] border border-[--border] rounded-[12px]">
            <p className="text-sm font-medium text-[--text-secondary]">
              No upcoming bills
            </p>
          </div>
        ) : (
          <>
            {/* Desktop: grid */}
            <div className="hidden md:grid grid-cols-3 gap-4">
              {upcomingBills.map((bill) => {
                const account = accounts.find((acc) => acc.id === bill.account_id)
                return (
                  <BillRow
                    key={bill.id}
                    bill={bill}
                    account={account}
                    onMarkPaid={() => handleMarkPaid(bill.id)}
                    onEdit={() => handleEditBill(bill)}
                    onDelete={() => handleDeleteBill(bill.id)}
                  />
                )
              })}
            </div>
            {/* Mobile: carousel */}
            <MobileCarousel>
              {upcomingBills.map((bill) => {
                const account = accounts.find((acc) => acc.id === bill.account_id)
                return (
                  <BillRow
                    key={bill.id}
                    bill={bill}
                    account={account}
                    onMarkPaid={() => handleMarkPaid(bill.id)}
                    onEdit={() => handleEditBill(bill)}
                    onDelete={() => handleDeleteBill(bill.id)}
                  />
                )
              })}
            </MobileCarousel>
          </>
        )}
      </div>

      <ProvisionDialog
        open={provisionDialogOpen}
        onOpenChange={(open) => {
          setProvisionDialogOpen(open)
          if (!open) setTimeout(() => setSelectedGoal(null), 200)
        }}
        goal={selectedGoal}
        accounts={accounts}
        goals={goals}
        onSuccess={loadData}
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

      <AddLedgerDialog
        open={ledgerDialogOpen}
        onOpenChange={(open) => {
          setLedgerDialogOpen(open)
          if (!open) setTimeout(() => setEditingLedger(null), 200)
        }}
        entryToEdit={editingLedger}
        onSuccess={handleLedgerSuccess}
      />

      <AddGoalDialog
        open={goalDialogOpen}
        onOpenChange={(open) => {
          setGoalDialogOpen(open)
          if (!open) setTimeout(() => setEditingGoal(null), 200)
        }}
        accounts={accounts}
        goalToEdit={editingGoal}
        onSuccess={handleGoalSuccess}
      />

      <AddBillDialog
        open={billDialogOpen}
        onOpenChange={(open) => {
          setBillDialogOpen(open)
          if (!open) setTimeout(() => setEditingBill(null), 200)
        }}
        accounts={accounts}
        billToEdit={editingBill}
        onSuccess={handleBillSuccess}
      />
    </div>
  )
}
