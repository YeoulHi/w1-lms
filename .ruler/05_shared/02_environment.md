# Environment Variables

## Variable Types

- **Backend Only (`.env.local`)**: For server-side admin operations. **NEVER** expose to client.
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

- **Frontend Public (`.env.local`)**: For client-side operations. Safe to expose.
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_API_BASE_URL` (usually empty)

## Setup
- Create a `.env.local` file (and add it to `.gitignore`).
- Set both `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`.
- Backend variables are validated at runtime by Zod in `src/backend/config/index.ts`.

## Security
- **Never commit `.env.local`**. Use `.env.example` for templates without keys.
- Rotate keys if they are ever exposed.