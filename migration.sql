-- ============================================================
-- ORBIT: Notes + Work Migration
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Notes table: add sort_order column
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- 2. Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  description text,
  color text DEFAULT '#000000',
  status text DEFAULT 'active',
  priority text DEFAULT 'medium',
  due_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- 3. Project Tasks table (with subtask support via parent_task_id)
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  user_id uuid,
  title text NOT NULL,
  description text,
  status text DEFAULT 'todo',
  priority text DEFAULT 'medium',
  due_date date,
  sort_order integer DEFAULT 0,
  parent_task_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT project_tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
  CONSTRAINT project_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT project_tasks_parent_task_id_fkey FOREIGN KEY (parent_task_id) REFERENCES public.project_tasks(id) ON DELETE CASCADE
);

-- 4. Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for projects
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (user_id = auth.uid());

-- RLS policies for project_tasks
CREATE POLICY "Users can view own project tasks" ON public.project_tasks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own project tasks" ON public.project_tasks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own project tasks" ON public.project_tasks FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own project tasks" ON public.project_tasks FOR DELETE USING (user_id = auth.uid());
