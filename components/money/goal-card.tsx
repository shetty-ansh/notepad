'use client'

import type { Goal } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2 } from 'lucide-react'
import { formatDate, formatText } from '@/lib/utils'

interface GoalCardProps {
  goal: Goal
  onProvision: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function GoalCard({ goal, onProvision, onEdit, onDelete }: GoalCardProps) {
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

  return (
    <div
      className={`border border-grey-900 border-2 rounded-[6px] p-4 ${timeBg}`}
    // style={!timeBg ? {
    //   background: `radial-gradient(circle at 20% 80%, rgba(255,220,190,0.3) 0%, transparent 50%),
    //     radial-gradient(circle at 80% 20%, rgba(255,245,238,0.35) 0%, transparent 50%),
    //     radial-gradient(circle at 40% 40%, rgba(255,210,180,0.15) 0%, transparent 50%),
    //     #fff9f5`
    // } : undefined}
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
              onClick={onEdit}
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
              onClick={onDelete}
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
          onClick={onProvision}
          className="w-full bg-black text-white hover:bg-green-900 h-8 text-sm font-medium rounded-[8px] shadow-none"
        >
          Add Money
        </Button>
      )}
    </div>
  )
}