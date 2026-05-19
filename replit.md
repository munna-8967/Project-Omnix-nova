# JARVIS AI Assistant

A futuristic JARVIS-inspired AI assistant web app with dark HUD UI, AI chat with streaming, voice input/output, memory system, notes/reminders, and Clerk authentication.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/jarvis run dev` — run the frontend (port 21662, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `SESSION_SECRET`, `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS v4, Clerk, Framer Motion, wouter
- API: Express 5 + Clerk middleware (JWT + session cookie auth)
- DB: PostgreSQL + Drizzle ORM
- AI: OpenAI (gpt-5.4 for chat, voice via Realtime API)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- **OpenAPI spec**: `lib/api-spec/openapi.yaml` — source of truth for all endpoints
- **DB schema**: `lib/db/src/schema/` — conversations, messages, memories, notes, userSettings
- **API routes**: `artifacts/api-server/src/routes/` — health, openai/, memories, notes, settings, dashboard
- **Frontend pages**: `artifacts/jarvis/src/pages/` — landing, dashboard, chat-list, chat-detail, memories, notes, settings
- **Theme**: `artifacts/jarvis/src/index.css` — JARVIS dark HUD theme with cyan/electric blue accents
- **Generated hooks**: `lib/api-client-react/src/generated/` — do not edit manually

## Architecture decisions

- **Contract-first API**: OpenAPI spec drives Zod validation schemas and React Query hooks via Orval codegen
- **Auth**: Clerk handles auth on both frontend (ClerkProvider + useAuth) and backend (clerkMiddleware + requireAuth + getAuth)
- **Streaming**: Chat responses stream via SSE (`text/event-stream`) from `/api/openai/conversations/:id/messages`
- **Voice**: WebM audio captured in browser, sent as base64, transcribed + responded via OpenAI Realtime audio API
- **Per-user data**: All DB tables include `userId` (Clerk user ID) for multi-tenant isolation

## Product

- **Landing page**: Public marketing page with JARVIS branding and sign-in/sign-up CTAs
- **Dashboard**: Stats overview (conversations, memories, notes, reminders) + recent chats + quick access
- **Chat**: Streaming AI conversations with history, voice input via microphone, message copy
- **Memories**: Store/categorize/delete contextual memories for the AI to reference
- **Notes & Reminders**: Create notes and time-based reminders with completion tracking
- **Settings**: Customize assistant name, personality (JARVIS/FRIDAY/KAREN/Custom), voice style

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml`
- Always run `pnpm --filter @workspace/db run push` after editing DB schema files
- The `voiceChatStream` returns events with `.type` as a union — cast to `{ type: string; data?: string }` when checking `user_transcript` events
- Clerk proxy path is set in `clerkProxyMiddleware` — frontend must set `VITE_CLERK_PROXY_URL` to the same path
- AI model: use `gpt-5.4` for text chat; voice uses `voiceChatStream` with "alloy" voice by default

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
