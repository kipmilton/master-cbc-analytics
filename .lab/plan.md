
# Take Master CBC live on your Supabase

## 1. SQL you'll run in Supabase (I give you the script — you paste in SQL Editor)

One migration creates the full multi-tenant schema, RLS, helpers, and bootstraps `kipmilton71@gmail.com` as super admin.

Tables (all in `public`, all with RLS + explicit GRANTs):
- `app_role` enum: `super_admin`, `school_admin`, `teacher`
- `schools` — id, name, county, phone, system (`cbc`|`844`|`both`), status (`pending`|`active`|`suspended`), created_at
- `school_applications` — pending signup payloads awaiting super-admin approval; links to the auth user who applied
- `user_roles` — (`user_id`, `role`, `school_id`) — the single source of truth for authorization (never on profiles)
- `profiles` — display name, title, must_reset_password flag, auto-created via `on_auth_user_created` trigger from `auth.users.raw_user_meta_data`
- `streams` — school_id, grade, name, system, class_teacher_id
- `subjects` — school_id, name, system, pathway, approved
- `teacher_assignments` — teacher_id, stream_id, subject_id
- `students` — school_id, stream_id, name, admission_no, status
- `exams`, `exam_scores` — score entry matrix
- `roster_submissions` — teacher class-list approval queue

Security definer helpers (avoid RLS recursion):
- `has_role(uid, role)`
- `school_of(uid)` — returns the caller's school_id
- `is_super_admin()`

RLS pattern on every domain table:
```sql
using ( public.is_super_admin() or school_id = public.school_of(auth.uid()) )
```
Teachers get a further narrowed policy scoped to `teacher_assignments`.

Bootstrap:
- Trigger inserts into `user_roles` when email = `kipmilton71@gmail.com` → `super_admin` (only after email is confirmed, to prevent domain-spoofing).
- If that user already exists, an INSERT idempotently grants the role.

## 2. Secrets

Because the `SUPABASE_` prefix is reserved by Lovable for the managed integration (which you're not using), I'll store your service-role key under a plain name:
- `LIVE_SUPABASE_URL` = `https://esctevanmqsauwzlzqfr.supabase.co`
- `LIVE_SUPABASE_SERVICE_ROLE_KEY` = you paste from Supabase → Project Settings → API

The anon/publishable key stays as `VITE_SUPABASE_ANON_KEY` in `.env` (already there).

## 3. New server infrastructure (TanStack `createServerFn`)

- `src/lib/supabase-admin.server.ts` — service-role client (server-only, `.server.ts` extension blocks it from the client bundle)
- `src/lib/auth-middleware.ts` — `requireAuth` middleware validates the bearer, exposes `{ userId, supabase }`
- `src/start.ts` — append `functionMiddleware` that attaches the Supabase access token to every server-fn call

Server-function modules (thin: only createServerFn declarations, helpers imported):
- `src/lib/me.functions.ts` — `getMyProfile()` returns role, schoolId, must_reset_password, approval status, assigned streams/subjects
- `src/lib/tenants.functions.ts` — `submitSchoolApplication`, `listPendingApplications` (super_admin), `approveSchoolApplication`, `rejectSchoolApplication`, `listAllSchools`
- `src/lib/staff.functions.ts` — `createSchoolStaff({ role: 'teacher'|'school_admin', name, email, title, tempPassword, streamIds, subjectIds })` — uses service role `admin.createUser` with `email_confirm: true` and `must_reset_password: true`
- `src/lib/school.functions.ts` — real reads for streams/subjects/students/teachers/exams scoped to caller's school

## 4. UI rewiring (no visual changes)

- `useSession` → hydrates from `getMyProfile()` after Supabase auth state resolves (no more localStorage role)
- `signup.tsx` → calls `submitSchoolApplication` server fn; principal user is created with `email_confirm: true` but role/school aren't granted until super admin approves. After signup the principal is shown a "Application pending approval" screen when they log in.
- `login.tsx` → after sign-in, fetches profile: if `must_reset_password` → `/reset-password`; if school still `pending` → `/pending-approval`; else route by role
- `reset-password.tsx` → calls `supabase.auth.updateUser({ password })` then a server fn clears `must_reset_password`
- `admin/schools` → live list of applications + approve/reject (approve flips school to `active` and grants principal `school_admin` role)
- `school/teachers` → live directory + creates teacher/deputy via `createSchoolStaff` server fn (returns temp password to show once in the dialog you already have)
- `school/index`, `school/students`, `teacher/index`, `teacher/classes`, etc. — swap localStorage stores for server-fn `useQuery`s (keep the same UI components; just change the data source)

## 5. Approval flow you'll see end-to-end

1. You confirm your email `kipmilton71@gmail.com` in Supabase → auto-granted `super_admin`.
2. You visit `/signup`, apply as principal for your school → row lands in `school_applications` (status `pending`).
3. You log in as super admin at `/admin/schools` → see the pending application → click Approve.
4. You log in as the principal → dashboard shows real (empty) school + Onboarding cards.
5. You add a Deputy Principal + Teachers on `/school/teachers`. Each is created via service role; a one-time temp password is shown for you to hand over.
6. Deputy/Teacher signs in → forced to `/reset-password` → after saving, they land on their real dashboard scoped to your school by RLS.

## 6. What I'll deliver, in order

Turn A (this next step): I add the secrets tool + I write `mastercbc-supabase.sql` for you to run + add the server infra + wire auth/approval flows + rewire admin schools and school/teachers. Other dashboards keep working (they'll still read seeds until Turn B).

Turn B (after you've run the SQL and added the service key): I flip the remaining dashboards (streams/subjects/students/exams/rosters) to server-fn reads, delete the localStorage stores, and we're production.

## Please confirm

- OK to use secret names `LIVE_SUPABASE_URL` and `LIVE_SUPABASE_SERVICE_ROLE_KEY` (Lovable reserves `SUPABASE_*`).
- OK to make `kipmilton71@gmail.com` super admin automatically once its email is confirmed in Supabase Auth.
- OK that the SQL script is destructive-safe but assumes a fresh schema (no `master_cbc_*` tables already exist).

Reply "go" and I'll ship Turn A in the next message.
