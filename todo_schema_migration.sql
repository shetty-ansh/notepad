-- Run this in Supabase SQL editor (or your local Postgres) before using /todo.

alter table public.todos
  add column if not exists is_pinned boolean not null default false,
  add column if not exists day_date date null,
  add column if not exists goal_period text null,
  add column if not exists goal_meta jsonb null,
  add column if not exists updated_at timestamp with time zone not null default now();

create or replace function public.set_todos_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_todos_updated_at on public.todos;
create trigger trg_todos_updated_at
before update on public.todos
for each row
execute function public.set_todos_updated_at();

create index if not exists idx_todos_user_type_status
  on public.todos(user_id, type, status);

create index if not exists idx_todos_user_day_date
  on public.todos(user_id, day_date);

create index if not exists idx_todos_user_goal_period
  on public.todos(user_id, goal_period);

create index if not exists idx_todos_user_pinned_created
  on public.todos(user_id, is_pinned, created_at desc);

alter table public.todos
  drop constraint if exists chk_todos_goal_period_consistency;

alter table public.todos
  add constraint chk_todos_goal_period_consistency
  check (
    (type = 'goal' and goal_period is not null)
    or
    (type is distinct from 'goal' and goal_period is null)
  );

