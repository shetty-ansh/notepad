'use server'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { GoalPeriod, Priority, Todo, TodoStatus, TodoType } from '@/lib/types'

const getUserId = cache(async (): Promise<string> => {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return user.id
})

type TodoInput = {
  title: string
  status?: TodoStatus
  type?: TodoType
  priority?: Priority
  section?: string
  due_date?: string | null
  day_date?: string | null
  is_pinned?: boolean
  goal_period?: GoalPeriod | null
  goal_meta?: Record<string, unknown> | null
}

export async function getTodosByType(type: TodoType): Promise<Todo[]> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function createTodo(payload: TodoInput): Promise<Todo> {
  const supabase = await createClient()
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('todos')
    .insert({
      title: payload.title,
      status: payload.status ?? 'todo',
      type: payload.type ?? 'task',
      priority: payload.priority ?? 'medium',
      section: payload.section ?? 'general',
      due_date: payload.due_date ?? null,
      day_date: payload.day_date ?? null,
      is_pinned: payload.is_pinned ?? false,
      goal_period: payload.goal_period ?? null,
      goal_meta: payload.goal_meta ?? null,
      user_id: userId,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateTodo(id: string, payload: Partial<TodoInput>): Promise<Todo> {
  const supabase = await createClient()
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('todos')
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteTodo(id: string): Promise<void> {
  const supabase = await createClient()
  const userId = await getUserId()

  const { error } = await supabase.from('todos').delete().eq('id', id).eq('user_id', userId)
  if (error) throw new Error(error.message)
}

export async function toggleTodoPin(id: string, pinned: boolean): Promise<Todo> {
  return updateTodo(id, { is_pinned: pinned })
}

export async function toggleTodoStatus(id: string, status: TodoStatus): Promise<Todo> {
  return updateTodo(id, { status })
}

