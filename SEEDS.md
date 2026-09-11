# Demo Seeds

Use these credentials locally to test the three dashboard roles.

## Super Admin

- **Email:** `super@mastercbc.co.ke`
- **Password:** `super123`
- **Access:** Full system admin; approve schools, manage global settings

## Principal (School Admin)

- **Email:** `principal@riverside.ac.ke`
- **Password:** `school123`
- **School:** Riverside Senior School
- **Access:** School-scoped admin; manage staff, students, streams, subjects, exams

## Teacher

- **Email:** `teacher@riverside.ac.ke`
- **Password:** `teach123`
- **School:** Riverside Senior School
- **Streams:** Grade 10 East, Grade 10 West
- **Access:** Enter exam scores, submit rosters, view class analytics

## How to Use

1. Start the dev server:
   ```bash
   npm install
   npm run dev
   ```

2. Open http://localhost:5173 and sign in with any of the above credentials.

3. Use separate browser profiles or incognito windows to stay signed in as multiple users at once.

## Source

These demo users are seeded in [`src/lib/mock-data.ts`](src/lib/mock-data.ts) and loaded locally when not connected to a live Supabase.

For production, use the Supabase migration (`mastercbc-supabase.sql`) to bootstrap `kipmilton71@gmail.com` as super admin.
