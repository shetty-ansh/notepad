'use server'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Project, ProjectTask } from '@/lib/types'
import { revalidatePath } from 'next/cache'

const getUserId = cache(async (): Promise<string> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? 'dev-user'
})

// ============================================================================
// PROJECT OPERATIONS
// ============================================================================

export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getProject(id: string): Promise<Project> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) throw new Error(error.message)
  return data
}

type ProjectInput = {
  name: string
  description?: string | null
  color?: string | null
  status?: string | null
  priority?: string | null
  due_date?: string | null
}

export async function createProject(payload: ProjectInput): Promise<Project> {
  const supabase = await createClient()
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('projects')
    .insert({ ...payload, user_id: userId })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
  return data
}

export async function updateProject(id: string, payload: Partial<ProjectInput>): Promise<Project> {
  const supabase = await createClient()
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('projects')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
  return data
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = await createClient()
  const userId = await getUserId()

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

// ============================================================================
// PROJECT TASK OPERATIONS
// ============================================================================

export async function getProjectTasks(projectId: string): Promise<ProjectTask[]> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function getAllProjectTasks(): Promise<ProjectTask[]> {
  const supabase = await createClient()
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

type TaskInput = {
  project_id: string
  title: string
  description?: string | null
  status?: string | null
  priority?: string | null
  due_date?: string | null
  sort_order?: number | null
  parent_task_id?: string | null
}

export async function createProjectTask(payload: TaskInput): Promise<ProjectTask> {
  const supabase = await createClient()
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('project_tasks')
    .insert({ ...payload, user_id: userId })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
  return data
}

export async function updateProjectTask(id: string, payload: Partial<Omit<TaskInput, 'project_id'>>): Promise<ProjectTask> {
  const supabase = await createClient()
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('project_tasks')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
  return data
}

export async function deleteProjectTask(id: string): Promise<void> {
  const supabase = await createClient()
  const userId = await getUserId()

  const { error } = await supabase
    .from('project_tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function toggleTaskStatus(id: string, status: string): Promise<ProjectTask> {
  return updateProjectTask(id, { status })
}
