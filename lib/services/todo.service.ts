import { redis } from '@/lib/redis'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { GoalPeriod, Priority, Todo, TodoStatus, TodoType } from '@/lib/types'

export type TodoInput = {
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

export const todoService = {
  async invalidateTodoCache(userId: string): Promise<void> {
    const keys = await redis.keys(`todos:${userId}:*`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  },

  async getTodosByType(supabase: SupabaseClient, userId: string, type: TodoType): Promise<Todo[]> {
    const cacheKey = `todos:${userId}:${type}`
    const cached = await redis.get<Todo[]>(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    
    await redis.set(cacheKey, data, { ex: 3600 })
    return data
  },

  async createTodo(supabase: SupabaseClient, userId: string, payload: TodoInput): Promise<Todo> {
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
    await this.invalidateTodoCache(userId)
    return data
  },

  async updateTodo(supabase: SupabaseClient, userId: string, id: string, payload: Partial<TodoInput>): Promise<Todo> {
    const { data, error } = await supabase
      .from('todos')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    await this.invalidateTodoCache(userId)
    return data
  },

  async deleteTodo(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
    const { error } = await supabase.from('todos').delete().eq('id', id).eq('user_id', userId)
    if (error) throw new Error(error.message)
    await this.invalidateTodoCache(userId)
  }
}
