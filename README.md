# Royal Westmont CRM

A mobile-first CRM for tracking prospective warehouse clients through the sales pipeline — built to replace a spreadsheet, not compete with Salesforce.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS)
- **Supabase** — Postgres database, auth, file storage, row-level security
- **Google Maps** — address autocomplete + territory map view

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), create a free project.
2. In **Project Settings → API**, copy the **Project URL**, **anon public key**, and **service_role key**.
3. In the Supabase dashboard, open **SQL Editor**, paste the contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), and run it. This creates all tables, RLS policies, and the photos storage bucket.
4. In **Authentication → Email**, make sure "Enable email confirmations" and password auth are on (defaults are fine).
5. In **Authentication → URL Configuration**, set the **Site URL** to your deployed URL (or `http://localhost:3000` while developing) and add `**/auth/callback` to Redirect URLs.

## 2. Get a Google Maps API key

1. In [Google Cloud Console](https://console.cloud.google.com/), create/select a project.
2. Enable the **Maps JavaScript API** and **Places API**.
3. Create an API key under **APIs & Services → Credentials**, and restrict it to your domain(s) (and `localhost` for dev).

## 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the Supabase and Google Maps values from steps 1–2.

## 4. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 5. Create your first account

There's no public sign-up screen (sales CRMs shouldn't have one) — accounts are created by an admin from **Users**, or you can sign yourself up once via Supabase directly for the very first admin:

1. In the Supabase dashboard, go to **Authentication → Users → Add user**, create yourself with a password (skip "send invite").
2. In **SQL Editor**, run:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@royalwestmont.com');
   ```
3. Sign in at `/login`. From **Users**, invite the rest of your sales team — they'll get an email to set their password.

## Roles

- **Rep** — sees and manages their own assigned prospects, read-only visibility into everyone else's (to avoid duplicate visits).
- **Admin** — full access to every prospect, manages user accounts and roles, sees the dashboard.

## What's in v1 vs. later

**Included:** accounts & roles, prospect records with photos, the 9-stage pipeline with an audit-logged activity timeline, quick-log shortcuts, voice-to-text notes, duplicate-prospect warnings, list/Kanban/map views, an admin dashboard (stage counts, stale leads, rep leaderboard, container-volume forecast, win/loss breakdown), CSV export, and an installable mobile PWA shell.

**Deliberately deferred (Phase 2):** a true offline write-queue with background sync, push notifications for follow-ups, GPS-proximity auto check-in ("warehouses near you"), route optimization for a day's visits, and in-app SMS/email sending (Twilio/Resend) — v1 uses `tel:` / `sms:` / `mailto:` links instead.

## Deploying

Push to a Git repo and import it into [Vercel](https://vercel.com/new), adding the same environment variables from `.env.local`. Set `NEXT_PUBLIC_SITE_URL` to your production URL, and update the Supabase **Site URL** / redirect URLs to match.
