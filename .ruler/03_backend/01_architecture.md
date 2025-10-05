# Backend Architecture

## File Structure
- **Feature-Based**: Group files by feature in `src/features/{feature}/backend/`.
  - `schema.ts`, `service.ts`, `route.ts`, `error.ts`

## Logic Flow (Hono + Next.js)
- **Entrypoint**: Next.js delegates API routes (`/api/[[...hono]]`) to a central Hono app.
- **Hono App**: `createHonoApp` in `src/backend/hono/app.ts` chains middleware and registers feature routes.
- **Middleware Order**: `errorBoundary` -> `withAppContext` -> `withSupabase` -> `register...Routes`.
- **Context**: Access `supabase`, `logger`, `config` via `c.get()` or `c.var()`. Do not modify `c.env` directly.
- **Responses**: Use `success`/`failure`/`respond` helpers from `response.ts`.

## Critical Rules
- **Base Path**: Always set Hono's base path to `/api`.
- **Route Registration**: Register all feature routes in `createHonoApp()`.
- **Dev Server**: Restart the dev server after adding or changing routes.