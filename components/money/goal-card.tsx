'use client'

import { useState } from 'react'
import type { Goal, Transaction, Account } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, X } from 'lucide-react'
import { formatDate, formatText } from '@/lib/utils'
import { TransactionRow } from '@/components/money/transaction-row'

interface GoalCardProps {
  goal: Goal
  transactions?: Transaction[]
  accounts?: Account[]
  onProvision: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function GoalCard({ goal, transactions = [], accounts = [], onProvision, onEdit, onDelete }: GoalCardProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const progress = goal.target_amount
    ? Math.min(
      100,
      Math.max(0, ((goal.saved_amount || 0) / goal.target_amount) * 100)
    )
    : 0

  const now = new Date()
  const targetDate = goal.target_date ? new Date(goal.target_date) : null

  let timeBg = ''
  if (targetDate) {
    const diff = targetDate.getTime() - now.getTime()
    const daysLeft = diff / (1000 * 60 * 60 * 24)

    if (daysLeft < 0) {
      timeBg = 'bg-red-100'
    } else if (daysLeft <= 7) {
      timeBg = 'bg-yellow-100'
    }
  }

  const goalTransactions = transactions.filter(t => t.goal_id === goal.id && t.type === 'provision')

  return (
    <>
    <div
      onClick={() => setModalOpen(true)}
      className={`border border-grey-900 border-2 rounded-[6px] p-4 cursor-pointer hover:shadow-md transition-all ${timeBg}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base md:text-2xl font-bold text-black truncate">
            {formatText(goal.name || "")}
          </h3>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              className="text-black hover:text-white hover:bg-black p-2 rounded-full"
              title="Edit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="text-red-600 hover:text-white hover:bg-red-600 p-2 rounded-full"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="mb-3">
        <div className="h-4 bg-gray-200 rounded-[6px] overflow-hidden">
          <div
            className="h-full bg-[#1AB394] rounded-[6px] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between mb-1">
        <div className='flex justify-center items-center gap-1'>
          <span className="text-sm md:text-lg font-mono font-semibold">
            ₹
            {(goal.saved_amount || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-xs md:text-sm">
            of ₹
            {(goal.target_amount || 0).toLocaleString('en-IN')}
          </span>
        </div>

        {goal.target_date && (
          <p className="text-sm text-black font-mono p-0 m-0">
            By: {formatDate(goal.target_date)}
          </p>
        )}
      </div>

      {goal.status === 'active' && (
        <Button
          onClick={(e) => {
            e.stopPropagation()
            onProvision()
          }}
          className="w-full bg-black text-white hover:bg-green-900 h-8 text-sm font-medium rounded-[8px] shadow-none"
        >
          Add Money
        </Button>
      )}
    </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(10,20,50,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-[12px] overflow-hidden bg-white shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className={`p-5 border-b border-gray-100 ${timeBg || 'bg-[#fff9f5]'}`}>
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/50 hover:bg-white text-gray-800 transition-colors"
              >
                <X size={14} />
              </button>
              <h3 className="text-xl font-bold text-black pr-10">{formatText(goal.name || "")}</h3>
              
              <div className="mt-4 h-4 bg-gray-200/50 rounded-[6px] overflow-hidden backdrop-blur-sm">
                <div
                  className="h-full bg-[#1AB394] rounded-[6px] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex justify-between mt-2">
                <div className='flex items-center gap-1'>
                  <span className="text-xl font-mono font-bold text-black">
                    ₹{(goal.saved_amount || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm text-gray-600">
                    of ₹{(goal.target_amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                {goal.target_date && (
                  <p className="text-sm text-gray-600 font-mono mt-1">
                    By: {formatDate(goal.target_date)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 bg-[#FCF9F5]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#1AB394]">
                  Contributing Provisions
                </h3>
                {goal.status === 'active' && (
                  <Button
                    onClick={() => {
                      setModalOpen(false)
                      onProvision()
                    }}
                    className="h-7 px-3 text-xs bg-black text-white hover:bg-green-900 rounded-[6px] shadow-none"
                  >
                    + Add Money
                  </Button>
                )}
              </div>

              {goalTransactions.length === 0 ? (
                <div className="py-6 border-2 border-dashed border-gray-200 rounded-2xl text-center">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    No money added yet
                  </p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-gray-100 bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {goalTransactions.map((tx) => {
                    const account = accounts.find(a => a.id === tx.account_id)
                    return (
                      <TransactionRow
                        key={tx.id}
                        transaction={tx}
                        account={account}
                        colour="#1AB394"
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}