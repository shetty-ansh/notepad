import type { SupabaseClient } from '@supabase/supabase-js'
import type { Project, ProjectTask } from '@/lib/types'

export type ProjectInput = {
  name: string
  description?: string | null
  notes?: string | null
  color?: string | null
  status?: string | null
  priority?: string | null
  due_date?: string | null
}

export type TaskInput = {
  project_id: string
  title: string
  description?: string | null
  status?: string | null
  priority?: string | null
  due_date?: string | null
  sort_order?: number | null
  parent_task_id?: string | null
}

export const workService = {
  async getProjects(supabase: SupabaseClient, userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
  },

  async getProject(supabase: SupabaseClient, userId: string, id: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async createProject(supabase: SupabaseClient, userId: string, payload: ProjectInput): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert({ ...payload, user_id: userId })
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async updateProject(supabase: SupabaseClient, userId: string, id: string, payload: Partial<ProjectInput>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async deleteProject(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  },

  async getProjectTasks(supabase: SupabaseClient, userId: string, projectId: string): Promise<ProjectTask[]> {
    const { data, error } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)
    return data
  },

  async getAllProjectTasks(supabase: SupabaseClient, userId: string): Promise<ProjectTask[]> {
    const { data, error } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
  },

  async createProjectTask(supabase: SupabaseClient, userId: string, payload: TaskInput): Promise<ProjectTask> {
    const { data, error } = await supabase
      .from('project_tasks')
      .insert({ ...payload, user_id: userId })
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async updateProjectTask(supabase: SupabaseClient, userId: string, id: string, payload: Partial<Omit<TaskInput, 'project_id'>>): Promise<ProjectTask> {
    const { data, error } = await supabase
      .from('project_tasks')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async deleteProjectTask(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('project_tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  }
}
