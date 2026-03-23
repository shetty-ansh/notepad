'use client'

import { useState, useEffect } from 'react'
import { getAccounts, getGoals, deleteGoal } from '@/lib/actions/money'
import { toast } from 'sonner'
import { CustomToast } from '@/components/toastMessage'
import { GoalCard } from '@/components/money/goal-card'
import { AddGoalDialog } from '@/components/money/add-goal-dialog'
import { ProvisionDialog } from '@/components/money/provision-dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Account, Goal } from '@/lib/types'

export default function GoalsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [provisionDialogOpen, setProvisionDialogOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [accountsData, goalsData] = await Promise.all([
      getAccounts(),
      getGoals(),
    ])
    setAccounts(accountsData)
    setGoals(goalsData)
  }

  const handleProvision = (goal: Goal) => {
    setSelectedGoal(goal)
    setProvisionDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id))
    try {
      await deleteGoal(id)
      toast.custom(() => (
        <CustomToast type="success" title="Goal deleted" message="Goal has been removed." />
      ))
    } catch (error) {
      loadData()
      toast.custom(() => (
        <CustomToast type="error" title="Failed to delete" message="Something went wrong" />
      ))
    }
  }

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setAddDialogOpen(true)
  }

  const handleSuccess = (goal: Goal, isEdit: boolean) => {
    setGoals(prev => {
      if (isEdit) {
        return prev.map(g => g.id === goal.id ? goal : g)
      } else {
        return [goal, ...prev]
      }
    })
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between h-14 px-6 border-b border-[--border] shrink-0">
        <h1 className="text-[20px] font-medium">Goals</h1>
        <Button
          onClick={() => {
            setEditingGoal(null)
            setAddDialogOpen(true)
          }}
          className="bg-[--accent] text-[--accent-foreground] hover:bg-[--accent-hover] h-8 px-3 text-sm font-medium rounded-[--radius-md] shadow-none"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Goal
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-[--text-secondary]">
              No goals yet
            </p>
            <p className="text-xs text-[--text-tertiary] mt-1">
              Add one to get started
            </p>
            <Button
              onClick={() => {
                setEditingGoal(null)
                setAddDialogOpen(true)
              }}
              className="mt-4 bg-[--accent] text-[--accent-foreground] hover:bg-[--accent-hover] h-8 px-3 text-sm font-medium rounded-[--radius-md] shadow-none"
            >
              Add Goal
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onProvision={() => handleProvision(goal)}
                onEdit={() => handleEdit(goal)}
                onDelete={() => handleDelete(goal.id)}
              />
            ))}
          </div>
        )}
      </div>

      <AddGoalDialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open)
          if (!open) setTimeout(() => setEditingGoal(null), 200)
        }}
        accounts={accounts}
        goalToEdit={editingGoal}
        onSuccess={handleSuccess}
      />

      {selectedGoal && (
        <ProvisionDialog
          open={provisionDialogOpen}
          onOpenChange={setProvisionDialogOpen}
          goal={selectedGoal}
          accounts={accounts}
          onSuccess={loadData}
        />
      )}
    </div>
  )
}
