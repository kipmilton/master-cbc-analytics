-- ============================================================================
-- Master CBC — complete schema, run this once in the Supabase SQL Editor.
-- Safe to re-run: everything is idempotent.
--
-- SECURITY MODEL
--   Every read/write in the app goes through server functions that use the
--   service-role key and always filter by the caller's school_id. The browser
--   key (anon/authenticated) is therefore granted NOTHING on these tables and
--   RLS is enabled with no permissive policies. A stolen anon key reads zero
--   rows. This is defence in depth on top of the server-side tenant checks.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enums -----
do $$ begin
  create type public.user_role as enum (
    'super_admin',
    'principal',
    'deputy_academic',
    'deputy_admin',
    'dean_academics',
    'teacher',
    'student'
  );
exception when duplicate_object then null; end $$;

-- Older installs may predate the 4th school admin seat.
do $$ begin
  alter type public.user_role add value if not exists 'dean_academics';
exception when others then null; end $$;

do $$ begin
  create type public.school_status as enum ('pending', 'active', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.application_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.curriculum_system as enum ('CBC', '8-4-4');
exception when duplicate_object then null; end $$;

-- --------------------------------------------------------------- schools ----
create table if not exists public.schools (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  county     text not null default '',
  phone      text not null default '',
  system     text not null default 'both',           -- cbc | 844 | both
  status     public.school_status not null default 'active',
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------- profiles ----
-- Single source of truth for identity: role + school_id live here only.
create table if not exists public.profiles (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  email                text not null,
  full_name            text not null default '',
  title                text,
  role                 public.user_role,             -- null = applicant, not yet approved
  school_id            uuid references public.schools(id) on delete set null,
  must_reset_password  boolean not null default false,
  created_at           timestamptz not null default now()
);
create index if not exists profiles_school_idx on public.profiles(school_id);
create unique index if not exists profiles_email_key on public.profiles(lower(email));

-- --------------------------------------------------- school applications ----
create table if not exists public.school_applications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references auth.users(id) on delete cascade,
  school_name     text not null,
  county          text not null default '',
  phone           text not null default '',
  system          text not null default 'both',
  principal_name  text not null default '',
  principal_title text not null default 'Principal',
  status          public.application_status not null default 'pending',
  reject_reason   text,
  reviewed_by     uuid references auth.users(id) on delete set null,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now()
);

-- --------------------------------------------------------------- streams ----
create table if not exists public.streams (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references public.schools(id) on delete cascade,
  grade            text not null,                    -- "Grade 10" | "Form 4" ...
  name             text not null,                    -- East | West | Blue ...
  system           public.curriculum_system not null,
  class_teacher_id uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  unique (school_id, grade, name)
);
create index if not exists streams_school_idx on public.streams(school_id);

-- -------------------------------------------------------------- subjects ----
create table if not exists public.subjects (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references public.schools(id) on delete cascade,
  name       text not null,
  system     public.curriculum_system not null,
  approved   boolean not null default false,         -- teacher proposals need approval
  cbc_level  text,                                   -- Junior Secondary | Senior Secondary
  pathway    text,                                   -- STEM | Social Sciences | Arts & Sports Science
  core       boolean not null default false,
  bundle_id  text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (school_id, name, system)
);
create index if not exists subjects_school_idx on public.subjects(school_id);

-- -------------------------------------------------------------- students ----
create table if not exists public.students (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references public.schools(id) on delete cascade,
  stream_id     uuid references public.streams(id) on delete set null,  -- null = master pool
  name          text not null,
  admission_no  text not null,
  gender        text not null default 'M',
  year_of_birth int  not null default 2010,
  status        text not null default 'active',      -- active | archived-transfer | archived-expelled | pending-approval
  archived_at   timestamptz,
  created_at    timestamptz not null default now(),
  unique (school_id, admission_no)
);
create index if not exists students_school_idx on public.students(school_id);
create index if not exists students_stream_idx on public.students(stream_id);

-- --------------------------------------------------- teacher assignments ----
create table if not exists public.teacher_assignments (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  stream_id  uuid references public.streams(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists ta_teacher_idx on public.teacher_assignments(teacher_id);
create index if not exists ta_school_idx  on public.teacher_assignments(school_id);

-- -------------------------------------------------- roster submissions ------
create table if not exists public.roster_submissions (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references public.schools(id) on delete cascade,
  stream_id    uuid not null references public.streams(id) on delete cascade,
  teacher_id   uuid not null references auth.users(id) on delete cascade,
  teacher_name text not null default '',
  student_ids  uuid[] not null default '{}',
  new_students jsonb not null default '[]'::jsonb,
  status       text  not null default 'draft',        -- draft | pending | approved | rejected
  notes        text,
  submitted_at timestamptz,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists rosters_school_idx on public.roster_submissions(school_id);

-- ----------------------------------------------------------------- exams ----
create table if not exists public.exams (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references public.schools(id) on delete cascade,
  stream_id  uuid not null references public.streams(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid references auth.users(id) on delete set null,
  term       text not null,
  exam_name  text not null,
  system     public.curriculum_system not null,
  locked     boolean not null default false,
  scores     jsonb not null default '[]'::jsonb,      -- [{studentId, score?, rubric?}]
  created_at timestamptz not null default now()
);
create index if not exists exams_school_idx on public.exams(school_id);
create index if not exists exams_stream_idx on public.exams(stream_id);

-- -------------------------------------------------------- grading config ----
create table if not exists public.grading_configs (
  school_id  uuid primary key references public.schools(id) on delete cascade,
  config     jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Lock everything down: browser keys get no access at all.
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'schools','profiles','school_applications','streams','subjects',
    'students','teacher_assignments','roster_submissions','exams','grading_configs'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

revoke all on schema public from anon, authenticated;
grant usage on schema public to service_role;

-- ============================================================================
-- New signups always get a profile row so the app can read identity.
-- The very first designated address becomes the platform super admin.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_super boolean := lower(new.email) = lower(coalesce(current_setting('app.super_admin_email', true), 'kipmilton71@gmail.com'));
begin
  insert into public.profiles (user_id, email, full_name, title, role, must_reset_password)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'title', case when is_super then 'Platform Administrator' else null end),
    case when is_super then 'super_admin'::public.user_role else null end,
    coalesce((new.raw_user_meta_data->>'must_reset_password')::boolean, false)
  )
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Promote an existing account to super admin (idempotent).
insert into public.profiles (user_id, email, full_name, title, role)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'name', 'Platform Administrator'),
       'Platform Administrator', 'super_admin'
from auth.users u
where lower(u.email) = 'kipmilton71@gmail.com'
on conflict (user_id) do update
  set role = 'super_admin', title = 'Platform Administrator';
