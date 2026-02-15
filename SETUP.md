# Care Call AI — Setup Guide

## Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase`)
- A [Supabase](https://supabase.com) project (free tier works)
- (Optional) [Resend](https://resend.com) account for email notifications

---

## 1. Install dependencies

```bash
npm install
```

---

## 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Find these in your Supabase project → **Settings → API**.

---

## 3. Set up the database

### Option A — Supabase Dashboard (easiest)

1. Open your Supabase project → **SQL Editor**
2. Paste the contents of `supabase/migrations/001_schema.sql`
3. Click **Run**

### Option B — Supabase CLI

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

---

## 4. Create storage bucket

In Supabase Dashboard → **Storage** → **New bucket**:
- Name: `uploads`
- Public: ✅ (tick "Public bucket")

Or via CLI:
```bash
supabase storage create uploads --public
```

---

## 5. Deploy edge functions (optional — needed for PDF generation, email, push notifications)

```bash
supabase functions deploy --no-verify-jwt
```

Set secrets for the functions that need them:
```bash
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set FROM_EMAIL=noreply@yourdomain.com

# Firebase push notifications
supabase secrets set FIREBASE_SERVER_KEY=...

# Apple push notifications (APNS)
supabase secrets set APNS_KEY_ID=...
supabase secrets set APNS_TEAM_ID=...
supabase secrets set APNS_PRIVATE_KEY=...

# Web push (VAPID)
supabase secrets set VAPID_PUBLIC_KEY=...
supabase secrets set VAPID_PRIVATE_KEY=...

# Slack alerts
supabase secrets set SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# Stripe
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
```

---

## 6. Run the app

```bash
npm run dev
```

Navigate to `http://localhost:5173` → you'll be redirected to `/login`.

**First time setup:**
1. Go to Supabase Dashboard → **Authentication → Users → Add User**
2. Enter an email + password
3. Sign in at `/login`

---

## 7. Set up your first admin user

After signing in, update your profile role to `admin` in Supabase:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

---

## Project Structure

```
care-call-ai-clone/
├── src/
│   ├── api/
│   │   ├── base44Client.js       ← Supabase shim (replaces Base44 SDK)
│   │   ├── entities.js           ← All 49 entity CRUD + realtime operations
│   │   ├── supabaseClient.js     ← Supabase client instance
│   │   ├── auth.js               ← Auth wrapper (me, logout, updateMe)
│   │   ├── storage.js            ← File upload wrapper
│   │   └── functions.js          ← Edge function invoker
│   ├── lib/
│   │   ├── AuthContext.jsx       ← Supabase Auth context
│   │   └── ...
│   ├── pages/                    ← 37 app pages
│   ├── components/               ← 191 components
│   └── ...
├── supabase/
│   ├── migrations/
│   │   └── 001_schema.sql        ← 49 tables + RLS + triggers
│   ├── functions/
│   │   ├── _shared/
│   │   │   └── sendEmail.ts      ← Resend email helper
│   │   └── <65 edge functions>/  ← Migrated from Base44 Deno functions
│   └── config.toml
├── .env.example
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## How the Base44 → Supabase migration works

All 37 pages still import `{ base44 } from '@/api/base44Client'` unchanged. The `base44Client.js` file is now a **compatibility shim** that exposes the same API surface (`entities`, `auth`, `integrations`, `functions`) backed by Supabase.

| Original | Replacement |
|---|---|
| Base44 entity CRUD | Supabase PostgREST (`supabase.from(table)`) |
| Base44 auth | Supabase Auth (`supabase.auth.*`) |
| Base44 file uploads | Supabase Storage (`supabase.storage`) |
| Base44 realtime | Supabase Realtime (postgres_changes) |
| Base44 functions (Deno) | Supabase Edge Functions (same Deno runtime) |
| Base44 SendEmail | Resend API (via `_shared/sendEmail.ts`) |
| Firebase push | Unchanged (still uses Firebase FCM) |
| Stripe | Unchanged |
| Google Maps | Unchanged |

---

## Build for production

```bash
npm run build
```

Output is in `dist/`. Deploy to Vercel, Netlify, or any static host.
