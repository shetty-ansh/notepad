'use client'

import { useState, useEffect, useRef } from 'react'
import type { Account, Goal, Transaction, TransactionCategory } from '@/lib/types'
import { formatText, formatTextCapitalise } from '@/lib/utils'
import { Trash2, Edit2, Palette, X, Check } from 'lucide-react'
import { deleteAccount as deleteAccountAction, updateAccount } from '@/lib/actions/money'
import { TransactionRow } from '@/components/money/transaction-row'
import { GoalCard } from '@/components/money/goal-card'
import { AddAccountDialog } from './add-account-dialog'
import { CustomToast } from '../toastMessage'
import { toast } from 'sonner'

// ── Gradient presets ─────────────────────────────────────────
export type CardThemeKey = 'deep_ocean' | 'dreamy_sunset' | 'morning_haze' | 'ember_glow'

export interface CardTheme {
  key: CardThemeKey
  name: string
  background: string
  blendMode?: string
}

export const CARD_THEMES: CardTheme[] = [
  {
    key: 'deep_ocean',
    name: 'Deep Ocean',
    background: `linear-gradient(45deg, #1a1a1a 0%, #003366 100%),
      repeating-linear-gradient(45deg, rgba(0,255,255,0.1) 0px, rgba(0,255,255,0.1) 20px, rgba(0,255,0,0.1) 20px, rgba(0,255,0,0.1) 40px),
      radial-gradient(circle at 50% 50%, rgba(32,196,232,0.3) 0%, rgba(76,201,240,0.1) 100%)`,
    blendMode: 'normal, overlay, overlay',
  },
  {
    key: 'dreamy_sunset',
    name: 'Dreamy Sunset',
    background: `linear-gradient(180deg, rgba(245,245,220,1) 0%, rgba(255,223,186,0.8) 25%, rgba(255,182,193,0.6) 50%, rgba(147,112,219,0.7) 75%, rgba(72,61,139,0.9) 100%),
      radial-gradient(circle at 30% 20%, rgba(255,255,224,0.4) 0%, transparent 50%),
      radial-gradient(circle at 70% 80%, rgba(72,61,139,0.6) 0%, transparent 70%),
      radial-gradient(circle at 50% 60%, rgba(147,112,219,0.3) 0%, transparent 60%)`,
  },
  {
    key: 'morning_haze',
    name: 'Morning Haze',
    background: `radial-gradient(circle at 50% 100%, rgba(253,224,71,0.4) 0%, transparent 60%),
      radial-gradient(circle at 50% 100%, rgba(251,191,36,0.4) 0%, transparent 70%),
      radial-gradient(circle at 50% 100%, rgba(244,114,182,0.5) 0%, transparent 80%),
      linear-gradient(180deg, #ffffff 0%, #fff9eb 100%)`,
  },
  {
    key: 'ember_glow',
    name: 'Ember Glow',
    background: `radial-gradient(circle at 50% 100%, rgba(255,69,0,0.6) 0%, transparent 60%),
      radial-gradient(circle at 50% 100%, rgba(255,140,0,0.4) 0%, transparent 70%),
      radial-gradient(circle at 50% 100%, rgba(255,215,0,0.3) 0%, transparent 80%),
      linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)`,
  },
]

function getTheme(key: string | null | undefined): CardTheme {
  return CARD_THEMES.find(t => t.key === key) || CARD_THEMES[0]
}

/** Returns true if the theme has a dark background and text should be white */
function isDarkTheme(key: string | null | undefined): boolean {
  return key !== 'morning_haze'
}

// ── Component ────────────────────────────────────────────────

interface AccountCardProps {
  account: Account
  transactions?: Transaction[]
  goals?: Goal[]
  categories?: TransactionCategory[]
  className?: string
  onProvision?: (goal?: Goal | null) => void
  onEditTransaction?: (transaction: Transaction) => void
  onDeleteTransaction?: () => void
  onUpdate?: () => void
}

export function AccountCard({
  account,
  transactions = [],
  goals = [],
  categories = [],
  className = '',
  onProvision,
  onEditTransaction,
  onDeleteTransaction,
  onUpdate,
}: AccountCardProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [themePickerOpen, setThemePickerOpen] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<CardThemeKey>(
    (account.color as CardThemeKey) || 'deep_ocean'
  )
  const originalThemeRef = useRef<string | undefined>(undefined)

  const provisioned = transactions
    .filter(t => t.account_id === account.id && t.type === 'provision')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const freeMoney = (account.balance || 0) - provisioned
  const accountTransactions = transactions.filter(t => t.account_id === account.id)

  // Goals that belong to this account OR have provisions from this account
  const provisionedGoalIds = new Set(
    accountTransactions
      .filter(t => t.type === 'provision' && t.goal_id)
      .map(t => t.goal_id!)
  )
  const accountGoals = goals.filter(
    g => g.account_id === account.id || provisionedGoalIds.has(g.id)
  )

  useEffect(() => {
    const theme = (account.color as CardThemeKey) || 'deep_ocean'
    setSelectedTheme(theme)
    originalThemeRef.current = theme
  }, [account])

  const handleThemeSelect = async (key: CardThemeKey) => {
    setSelectedTheme(key)
    if (key !== originalThemeRef.current) {
      try {
        await updateAccount(account.id, { color: key })
        originalThemeRef.current = key
        toast.success('Theme updated')
        onUpdate?.()
      } catch {
        toast.error('Failed to update theme')
      }
    }
  }

  const handleDeleteAccount = async () => {
    toast.custom((t) => (
      <CustomToast
        type="confirmDelete"
        title="Delete Account"
        message="This will also delete all transactions, provisions, goals, and bills on this account."
        onConfirm={async () => {
          await deleteAccountAction(account.id)
          toast.dismiss(t)
          toast.custom(() => (
            <CustomToast type="success" title="Deleted" message="Account deleted successfully" />
          ))
          onUpdate?.()
        }}
        onCancel={() => { toast.dismiss(t) }}
      />
    ), { duration: Infinity })
  }

  const theme = getTheme(selectedTheme)
  const dark = isDarkTheme(selectedTheme)
  const textColor = dark ? 'text-white' : 'text-gray-900'
  const subTextColor = dark ? 'text-white/70' : 'text-gray-600'
  const fadedTextColor = dark ? 'text-white/50' : 'text-gray-400'
  const borderColor = dark ? 'border-white/20' : 'border-gray-300'
  const badgeBg = dark ? 'bg-white/10' : 'bg-gray-900/10'

  return (
    <>
      {/* ── CARD (collapsed view) ─────────────────────────────── */}
      <div
        className={`rounded-[12px] transition-all relative overflow-hidden cursor-pointer
          hover:shadow-lg border ${dark ? 'border-gray-700' : 'border-gray-300'} max-w-[350px] h-[200px]
          ${className}`}
        style={{
          background: theme.background,
          backgroundBlendMode: theme.blendMode || 'normal',
        }}
        onClick={() => setModalOpen(true)}
      >
        <div className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-start justify-between mb-3">
            <h3 className={`text-3xl font-bold ${textColor}`}>
              {formatTextCapitalise(account.name)}
            </h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${badgeBg} ${textColor}`}>
              {formatText(account.type || '')}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-1">
              <span className={`text-6xl font-mono font-bold ${textColor}`}>
                {(account.balance || 0).toLocaleString('en-IN', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
              <span className={`text-sm ${textColor}`}>{account.currency}</span>
            </div>

          </div>
        </div>
      </div>

      {/* ── MODAL (expanded view) ─────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(10,20,50,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-[12px] overflow-hidden
              shadow-[0_32px_80px_rgba(0,0,0,0.5)] border border-blue-900/40"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header — theme gradient */}
            <div
              className="relative flex-shrink-0 p-5"
              style={{
                background: theme.background,
                backgroundBlendMode: theme.blendMode || 'normal',
              }}
            >
              {/* Close button */}
              <button
                onClick={() => setModalOpen(false)}
                className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center
                  rounded-full ${badgeBg} border ${borderColor} ${textColor} hover:opacity-80 transition-colors z-10`}
              >
                <X size={14} />
              </button>

              <div className="flex items-start justify-between mb-3 pr-10">
                <h3 className={`text-md font-bold ${textColor}`}>
                  {formatTextCapitalise(account.name)}
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${badgeBg} ${textColor}`}>
                  {formatText(account.type || '')}
                </span>
              </div>

              <div className="flex items-baseline gap-1 mb-3">
                <span className={`text-4xl font-mono font-bold ${textColor}`}>
                  {(account.balance || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className={`text-xs ${textColor}`}>{account.currency}</span>
              </div>

              {provisioned > 0 && (
                <div className={`flex flex-col gap-0.5 ${borderColor} border-t pt-2 mb-3`}>
                  <div className="flex justify-between text-[11px]">
                    <span className={subTextColor}>Free</span>
                    <span className={`font-mono font-medium ${textColor}`}>
                      {freeMoney.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className={fadedTextColor}>Provisioned</span>
                    <span className={`font-mono ${fadedTextColor}`}>
                      {provisioned.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className={`relative flex items-center gap-2 mt-4 pt-4 border-t ${borderColor}`}>
                <button
                  onClick={() => setEditDialogOpen(true)}
                  title="Edit Account"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-bold
                    ${badgeBg} border ${borderColor} ${textColor} hover:bg-black hover:text-white transition-colors`}
                >
                  <Edit2 size={12} /> Edit
                </button>

                <button
                  onClick={() => setThemePickerOpen(prev => !prev)}
                  title="Choose Theme"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-bold
                    ${badgeBg} border ${borderColor} ${textColor} hover:bg-white hover:text-black transition-colors`}
                >
                  <Palette size={12} /> Theme
                </button>

                <button
                  onClick={handleDeleteAccount}
                  title="Delete Account"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-bold
                    ${badgeBg} border ${borderColor} ${textColor} hover:bg-red-500 hover:border-red-400 hover:text-white transition-colors ml-auto`}
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>

              {/* Theme picker panel */}
              {themePickerOpen && (
                <div className={`mt-3 p-3 rounded-2xl ${dark ? 'bg-black/30' : 'bg-white/40'} border ${borderColor}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${fadedTextColor} mb-2`}>
                    Choose Theme
                  </p>
                  <div className="flex items-center gap-3">
                    {CARD_THEMES.map(t => (
                      <button
                        key={t.key}
                        onClick={() => handleThemeSelect(t.key)}
                        className="flex flex-col items-center gap-1 group"
                        title={t.name}
                      >
                        <div
                          className={`w-10 h-10 rounded-full border-2 transition-all relative overflow-hidden
                            ${selectedTheme === t.key
                              ? 'border-white ring-2 ring-blue-400 scale-110'
                              : 'border-white/30 hover:border-white/60 hover:scale-105'
                            }`}
                          style={{
                            background: t.background,
                            backgroundBlendMode: t.blendMode || 'normal',
                          }}
                        >
                          {selectedTheme === t.key && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <Check size={14} className="text-white" />
                            </div>
                          )}
                        </div>
                        <span className={`text-[9px] font-semibold ${fadedTextColor} group-hover:${textColor} transition-colors`}>
                          {t.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal body — white */}
            <div className="flex-1 overflow-y-auto bg-white p-5 flex flex-col gap-6">

              {/* Provisions / Goals */}
              <section>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-black uppercase tracking-widest text-black">
                    Provisions
                  </h3>
                  <button
                    onClick={() => onProvision?.(null)}
                    className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-[6px]
                      bg-black text-white hover:bg-green-900 transition-colors"
                  >
                    + Provision
                  </button>
                </div>

                {accountGoals.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {accountGoals.map(goal => (
                      <GoalCard key={goal.id} goal={goal} onProvision={() => onProvision?.(goal)} />
                    ))}
                  </div>
                ) : (
                  <div className="py-6 border-2 border-dashed border-blue-100 rounded-2xl text-center">
                    <p className="text-xs font-semibold text-black uppercase tracking-widest">
                      No provisions yet
                    </p>
                  </div>
                )}
              </section>

              {/* Transactions */}
              <section>
                <h3 className="text-sm font-black uppercase tracking-widest text-black mb-3">
                  Recent Transactions
                </h3>

                {accountTransactions.length === 0 ? (
                  <div className="py-6 border-2 border-dashed border-blue-100 rounded-2xl text-center">
                    <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest">
                      No transactions found
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-blue-50 rounded-2xl overflow-hidden">
                    {accountTransactions.slice(0, 50).map((transaction) => (
                      <TransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        account={account}
                        colour={categories.find(c => c.name === transaction.category)?.color || '#1D4ED8'}
                        onEdit={onEditTransaction}
                        onDelete={onDeleteTransaction}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      <AddAccountDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        accountToEdit={account}
        onSuccess={onUpdate}
      />
    </>
  )
}