'use server'

import { revalidatePath } from 'next/cache'
import type { Todo, TodoStatus, TodoType } from '@/lib/types'
import { getAuthSession } from '@/lib/utils/getAuthSession'
import { todoService, type TodoInput } from '@/lib/services/todo.service'

export async function getTodosByType(type: TodoType): Promise<Todo[]> {
  const { supabase, userId } = await getAuthSession()
  return todoService.getTodosByType(supabase, userId, type)
}

export async function createTodo(payload: TodoInput): Promise<Todo> {
  const { supabase, userId } = await getAuthSession()
  const data = await todoService.createTodo(supabase, userId, payload)
  revalidatePath('/', 'layout')
  return data
}

export async function updateTodo(id: string, payload: Partial<TodoInput>): Promise<Todo> {
  const { supabase, userId } = await getAuthSession()
  const data = await todoService.updateTodo(supabase, userId, id, payload)
  revalidatePath('/', 'layout')
  return data
}

export async function deleteTodo(id: string): Promise<void> {
  const { supabase, userId } = await getAuthSession()
  await todoService.deleteTodo(supabase, userId, id)
  revalidatePath('/', 'layout')
}

export async function toggleTodoPin(id: string, pinned: boolean): Promise<Todo> {
  return updateTodo(id, { is_pinned: pinned })
}

export async function toggleTodoStatus(id: string, status: TodoStatus): Promise<Todo> {
  return updateTodo(id, { status })
}
