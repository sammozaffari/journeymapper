# JourneyMapper

AI-powered service blueprinting and journey mapping tool.

## Tech Stack
- **Framework:** Next.js 14+ (App Router) + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Canvas:** React Flow (@xyflow/react)
- **Database + Auth:** Supabase (Postgres + Auth + RLS + Storage)
- **Real-time:** Liveblocks (with Yjs adapter)
- **AI:** Claude API (@anthropic-ai/sdk) — use model `claude-opus-4-6` with `thinking: {type: "adaptive"}`
- **Exports:** pptxgenjs (PowerPoint) + @react-pdf/renderer (PDF)
- **State:** Zustand
- **Validation:** Zod
- **Deployment:** Vercel

## Commands
- `npm run dev` — start development server
- `npm run build` — production build
- `npm run lint` — run ESLint
- `npx supabase start` — start local Supabase
- `npx supabase db reset` — reset local database with migrations
- `npx supabase gen types typescript --local > src/types/database.ts` — regenerate DB types

## Conventions
- Use App Router (not Pages Router)
- Server Components by default; add `"use client"` only when needed
- Use `@/` import alias for `src/` directory
- Supabase clients: `client.ts` (browser), `server.ts` (RSC/route handlers), `admin.ts` (service role)
- All AI API routes stream responses where possible
- All structured AI output validated with Zod schemas
- Canvas state managed via Zustand store, synced to Liveblocks for collaboration
- RLS policies on all Supabase tables — scoped through workspace membership
- File uploads go to Supabase Storage via presigned URLs (not through API routes) to avoid Vercel body size limits

## Project Structure
- `src/app/` — Next.js routes and API handlers
- `src/components/` — React components organized by feature (canvas/, research/, ai/, etc.)
- `src/lib/` — Utility libraries (supabase/, ai/, export/, canvas/)
- `src/hooks/` — Custom React hooks
- `src/stores/` — Zustand stores
- `src/types/` — TypeScript type definitions
- `supabase/migrations/` — Database migrations
