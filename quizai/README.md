# QuizAI — full-stack app

Upload a PDF → Claude generates a **summary** and a **quiz** → take quizzes, track
**accountability tasks**, and watch **live analytics** update in real time.

- **Next.js 16** (App Router) + React 19
- **Supabase** — Postgres, magic-link Auth, private Storage (PDFs), Realtime
- **Anthropic Claude** — structured summary + quiz generation
- Row-Level Security so every user only sees their own data

---

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**. Pick a name and a strong DB password.
2. When it's ready, open **SQL Editor → New query**, paste the entire contents of
   [`supabase/schema.sql`](supabase/schema.sql), and **Run**. This creates all tables,
   Row-Level Security policies, the private `pdfs` storage bucket, the profile-on-signup
   trigger, and Realtime.
3. **Auth → Providers → Email**: make sure **Email** is enabled. Magic links work out of the box.
4. **Auth → URL Configuration**:
   - **Site URL**: `http://localhost:3000` for local dev (change to your Vercel URL in prod).
   - **Redirect URLs**: add `http://localhost:3000/auth/callback` and
     `https://YOUR-APP.vercel.app/auth/callback`.

## 2. Get your keys

- **Project Settings → Data API**: copy the **Project URL** and the **anon/public** key.
- **Project Settings → API → service_role**: copy the service-role key (server-only; optional here).
- **Anthropic**: copy your API key from [console.anthropic.com](https://console.anthropic.com).

## 3. Run it locally

```bash
cd quizai
cp .env.local.example .env.local   # then fill in the values
npm install
npm run dev
```

Open http://localhost:3000, click **Sign in**, enter your email, and open the magic link.

### Environment variables

| Variable | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Data API | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Data API | anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API | server-only (optional) |
| `ANTHROPIC_API_KEY` | Anthropic console | Claude access |
| `NEXT_PUBLIC_SITE_URL` | you | `http://localhost:3000` locally; your Vercel URL in prod |

## 4. Deploy to Vercel

The app lives in the **`quizai/` subfolder** of this repo, so point Vercel at it:

1. In your Vercel project → **Settings → Build & Deployment → Root Directory** → set to **`quizai`**.
2. **Settings → Environment Variables**: add all five variables from the table above
   (set `NEXT_PUBLIC_SITE_URL` to your real Vercel URL).
3. Update Supabase **Auth → URL Configuration** with your production Site URL and the
   `.../auth/callback` redirect URL.
4. Redeploy. Vercel auto-detects Next.js — no `vercel.json` needed.

---

## How it works

```
Browser ──upload PDF──▶ Supabase Storage (private, per-user folder)
   │                         │
   └──POST /api/generate──▶ Next server route
                              ├─ downloads the PDF (RLS-scoped)
                              ├─ extracts text with unpdf
                              ├─ calls Claude (forced tool-use → structured JSON)
                              └─ writes summary + quiz + questions to Postgres
Dashboard/analytics ◀── Supabase Realtime pushes row changes ── live updates
```

Key files: `lib/generate.ts` (Claude), `app/api/generate/route.ts` (pipeline),
`lib/supabase/*` (clients + session), `supabase/schema.sql` (database).
