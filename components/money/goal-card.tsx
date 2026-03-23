'use client'

import type { Goal } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2 } from 'lucide-react'

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-[--accent-subtle] text-[--accent]'
      case 'completed':
        return 'bg-[--success-subtle] text-[--success]'
      case 'paused':
        return 'bg-[--background-muted] text-[--text-secondary]'
      default:
        return 'bg-[--background-muted] text-[--text-secondary]'
    }
  }

  return (
    <div className="bg-[--card] border border-[--border] rounded-[--radius-lg] p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{goal.icon}</span>
          <h3 className="text-sm font-medium text-[--text-primary]">
            {goal.name}
          </h3>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-[--radius-sm] text-[11px] font-medium ${getStatusColor(goal.status || 'active')}`}
          >
            {goal.status}
          </span>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-6 w-6 text-[--text-secondary] hover:text-[--text-primary]"
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
              className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1AB394] rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Amounts */}
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-lg font-mono font-semibold text-[--text-primary]">
          ₹
          {(goal.saved_amount || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </span>
        <span className="text-sm text-[--text-secondary]">
          of ₹
          {(goal.target_amount || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </span>
      </div>

      {/* Target Date */}
      {goal.target_date && (
        <p className="text-xs text-[--text-tertiary] mb-3 font-mono">
          Target: {goal.target_date}
        </p>
      )}

      {/* Add Money Button */}
      {goal.status === 'active' && (
        <Button
          onClick={onProvision}
          className="w-full bg-[--accent] text-[--accent-foreground] hover:bg-[--accent-hover] h-8 text-sm font-medium rounded-[--radius-md] shadow-none"
        >
          Add money
        </Button>
      )}
    </div>
  )
}
