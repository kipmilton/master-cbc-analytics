-- Master CBC Supabase migration
-- Run this in Supabase SQL Editor.
-- This creates the multi-tenant schema, RLS policies, helper functions,
-- and bootstraps kipmilton71@gmail.com as a super admin once the email is confirmed.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('super_admin', 'school_admin', 'teacher');
  end if;
end
$$;

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  county text not null,
  phone text,
  system text not null check (system in ('cbc', '844', 'both')),
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  created_at timestamptz not null default now()
);

create table if not exists public.school_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  school_name text not null,
  county text not null,
  phone text,
  system text not null check (system in ('cbc', '844', 'both')),
  principal_name text not null,
  principal_title text not null default 'Principal',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid not null,
  role public.app_role not null,
  school_id uuid null,
  created_at timestamptz not null default now(),
  primary key (user_id, role, school_id),
  constraint fk_user_roles_school foreign key (school_id) references public.schools(id) on delete cascade
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  title text,
  must_reset_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.streams (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  grade text not null,
  name text not null,
  system text not null check (system in ('cbc', '844', 'both')),
  class_teacher_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  system text not null check (system in ('cbc', '844', 'both')),
  pathway text,
  approved boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null,
  school_id uuid not null references public.schools(id) on delete cascade,
  stream_id uuid references public.streams(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (teacher_id, school_id, stream_id, subject_id)
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  stream_id uuid references public.streams(id) on delete cascade,
  name text not null,
  admission_no text,
  status text not null default 'active' check (status in ('active', 'inactive', 'graduated')),
  created_at timestamptz not null default now()
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  term text,
  created_at timestamptz not null default now()
);

create table if not exists public.exam_scores (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  score numeric,
  created_at timestamptz not null default now(),
  unique (exam_id, student_id)
);

create table if not exists public.roster_submissions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null,
  stream_id uuid references public.streams(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

drop policy if exists "schools_super_admin_all" on public.schools;
drop policy if exists "schools_school_members_read" on public.schools;
drop policy if exists "user_roles_super_admin" on public.user_roles;
drop policy if exists "user_roles_school_members" on public.user_roles;

drop function if exists public.has_role(uuid, public.app_role) cascade;
drop function if exists public.has_role(uuid, app_role) cascade;
create or replace function public.has_role(_uid uuid, role_name public.app_role)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = _uid and ur.role = role_name
  );
$$;

drop function if exists public.school_of(uuid);
create or replace function public.school_of(_uid uuid)
returns uuid
language sql
stable
as $$
  select ur.school_id
  from public.user_roles ur
  where ur.user_id = _uid and ur.school_id is not null
  order by ur.user_id
  limit 1;
$$;

drop policy if exists "applications_owner_or_super_admin" on public.school_applications;
drop policy if exists "applications_super_admin_update" on public.school_applications;
drop function if exists public.is_super_admin() cascade;
create or replace function public.is_super_admin()
returns boolean
language sql
stable
as $$
  select public.has_role(auth.uid(), 'super_admin');
$$;

alter table public.schools enable row level security;
alter table public.school_applications enable row level security;
alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.streams enable row level security;
alter table public.subjects enable row level security;
alter table public.teacher_assignments enable row level security;
alter table public.students enable row level security;
alter table public.exams enable row level security;
alter table public.exam_scores enable row level security;
alter table public.roster_submissions enable row level security;

drop policy if exists "schools_super_admin_all" on public.schools;
drop policy if exists "schools_school_members_read" on public.schools;
create policy "schools_super_admin_all" on public.schools
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "schools_school_members_read" on public.schools
  for select
  using (public.school_of(auth.uid()) = id);

drop policy if exists "applications_owner_or_super_admin" on public.school_applications;
drop policy if exists "applications_authenticated_insert" on public.school_applications;
drop policy if exists "applications_super_admin_update" on public.school_applications;
create policy "applications_owner_or_super_admin" on public.school_applications
  for select
  using (auth.uid() = user_id or public.is_super_admin());
create policy "applications_authenticated_insert" on public.school_applications
  for insert
  with check (auth.uid() = user_id);
create policy "applications_super_admin_update" on public.school_applications
  for update
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "profiles_self" on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;
drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self" on public.profiles
  for select
  using (auth.uid() = user_id);
create policy "profiles_self_update" on public.profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "profiles_self_insert" on public.profiles
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_roles_super_admin" on public.user_roles;
drop policy if exists "user_roles_school_members" on public.user_roles;
create policy "user_roles_super_admin" on public.user_roles
  for select
  using (public.is_super_admin());
create policy "user_roles_school_members" on public.user_roles
  for select
  using (public.school_of(auth.uid()) = school_id or auth.uid() = user_id);

-- STRICT SUPER ADMIN PROTECTION TRIGGER
-- Blocks any attempt (even via SQL, admin key, or exploit) to grant super_admin to anyone other than the 2 designated emails.
create or replace function public.enforce_super_admin_whitelist()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  user_email text;
begin
  if new.role is not null and new.role::text = 'super_admin' then
    select lower(email) into user_email
    from auth.users
    where id = new.user_id;

    if user_email is null or user_email not in ('kipmilton71@gmail.com', '038sophienk@gmail.com') then
      raise exception 'SECURITY ERROR: Super Admin status is strictly restricted to authorized platform owners.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_super_admin_profiles on public.profiles;
create trigger trg_enforce_super_admin_profiles
before insert or update on public.profiles
for each row execute function public.enforce_super_admin_whitelist();

drop trigger if exists trg_enforce_super_admin_roles on public.user_roles;
create trigger trg_enforce_super_admin_roles
before insert or update on public.user_roles
for each row execute function public.enforce_super_admin_whitelist();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  u_email text;
begin
  u_email := lower(coalesce(new.email, ''));

  insert into public.profiles (user_id, full_name, title, must_reset_password, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'title', ''),
    coalesce((new.raw_user_meta_data->>'must_reset_password')::boolean, false),
    case when u_email in ('kipmilton71@gmail.com', '038sophienk@gmail.com') then 'super_admin' else null end
  )
  on conflict (user_id) do update set
    role = case when u_email in ('kipmilton71@gmail.com', '038sophienk@gmail.com') then 'super_admin' else profiles.role end;

  if u_email in ('kipmilton71@gmail.com', '038sophienk@gmail.com') then
    insert into public.user_roles (user_id, role, school_id)
    values (new.id, 'super_admin', null)
    on conflict (user_id, role, school_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Bootstrap existing whitelisted users
insert into public.profiles (user_id, full_name, role)
select id, coalesce(raw_user_meta_data->>'name', email), 'super_admin'
from auth.users
where lower(email) in ('kipmilton71@gmail.com', '038sophienk@gmail.com')
on conflict (user_id) do update set role = 'super_admin';

insert into public.user_roles (user_id, role, school_id)
select id, 'super_admin', null
from auth.users
where lower(email) in ('kipmilton71@gmail.com', '038sophienk@gmail.com')
on conflict (user_id, role, school_id) do nothing;

-- Grant access to authenticated users for the tables used by the app.
grant usage on schema public to authenticated, anon;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
