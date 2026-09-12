-- Run this once in the Supabase SQL Editor.
-- 1) Makes new account creation resilient: if the profile row cannot be
--    written for any reason, the account is still created (the app back-fills
--    the profile on first load).
-- 2) Adds the missing grading_configs table used by Branding & Grading.

-- ---------------------------------------------------------------- 1. signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_super boolean := lower(new.email) in ('kipmilton71@gmail.com', '038sophienk@gmail.com');
begin
  begin
    insert into public.profiles (user_id, email, full_name, title, role, must_reset_password)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'name', ''),
      coalesce(new.raw_user_meta_data->>'title',
               case when is_super then 'Platform Administrator' else null end),
      case when is_super then 'super_admin'::public.user_role else null end,
      coalesce((new.raw_user_meta_data->>'must_reset_password')::boolean, false)
    )
    on conflict (user_id) do nothing;
  exception when others then
    raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
  end;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------------------------------------------------------------- 2. grading
create table if not exists public.grading_configs (
  school_id  uuid primary key references public.schools(id) on delete cascade,
  config     jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.grading_configs enable row level security;
alter table public.grading_configs force row level security;
revoke all on public.grading_configs from anon, authenticated;
grant all on public.grading_configs to service_role;
