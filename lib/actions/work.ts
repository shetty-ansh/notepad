'use server'

import { revalidatePath } from 'next/cache'
import type { Project, ProjectTask } from '@/lib/types'
import { getAuthSession } from '@/lib/utils/getAuthSession'
import { workService, type ProjectInput, type TaskInput } from '@/lib/services/work.service'

// ============================================================================
// PROJECT OPERATIONS
// ============================================================================

export async function getProjects(): Promise<Project[]> {
  const { supabase, userId } = await getAuthSession()
  return workService.getProjects(supabase, userId)
}

export async function getProject(id: string): Promise<Project> {
  const { supabase, userId } = await getAuthSession()
  return workService.getProject(supabase, userId, id)
}

export async function createProject(payload: ProjectInput): Promise<Project> {
  const { supabase, userId } = await getAuthSession()
  const data = await workService.createProject(supabase, userId, payload)
  revalidatePath('/', 'layout')
  return data
}

export async function updateProject(id: string, payload: Partial<ProjectInput>): Promise<Project> {
  const { supabase, userId } = await getAuthSession()
  const data = await workService.updateProject(supabase, userId, id, payload)
  revalidatePath('/', 'layout')
  return data
}

export async function deleteProject(id: string): Promise<void> {
  const { supabase, userId } = await getAuthSession()
  await workService.deleteProject(supabase, userId, id)
  revalidatePath('/', 'layout')
}

// ============================================================================
// PROJECT TASK OPERATIONS
// ============================================================================

export async function getProjectTasks(projectId: string): Promise<ProjectTask[]> {
  const { supabase, userId } = await getAuthSession()
  return workService.getProjectTasks(supabase, userId, projectId)
}

export async function getAllProjectTasks(): Promise<ProjectTask[]> {
  const { supabase, userId } = await getAuthSession()
  return workService.getAllProjectTasks(supabase, userId)
}

export async function createProjectTask(payload: TaskInput): Promise<ProjectTask> {
  const { supabase, userId } = await getAuthSession()
  const data = await workService.createProjectTask(supabase, userId, payload)
  revalidatePath('/', 'layout')
  return data
}

export async function updateProjectTask(id: string, payload: Partial<Omit<TaskInput, 'project_id'>>): Promise<ProjectTask> {
  const { supabase, userId } = await getAuthSession()
  const data = await workService.updateProjectTask(supabase, userId, id, payload)
  revalidatePath('/', 'layout')
  return data
}

export async function deleteProjectTask(id: string): Promise<void> {
  const { supabase, userId } = await getAuthSession()
  await workService.deleteProjectTask(supabase, userId, id)
  revalidatePath('/', 'layout')
}

export async function toggleTaskStatus(id: string, status: string): Promise<ProjectTask> {
  return updateProjectTask(id, { status })
}
