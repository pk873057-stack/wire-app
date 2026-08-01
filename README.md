# WIRE

A public, live dispatch feed. Next.js + Supabase.

## Setup

1. Create a Supabase project at supabase.com
2. In the SQL Editor, run `supabase-schema.sql`
3. Copy `.env.local.example` to `.env.local` and fill in your Project URL and anon key (Project Settings -> API)
4. `npm install`
5. `npm run dev` — open http://localhost:3000
6. Sign up with an email + password, confirm via the email Supabase sends, sign in, start posting

## Deploy

Push this folder to a GitHub repo, then import it in Vercel. Add the two env vars
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project
settings, and deploy.
