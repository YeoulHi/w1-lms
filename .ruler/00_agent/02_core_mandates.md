# Core Mandates

## Project Goal
- **Focus**: Implement core LMS logic, not a production-ready app.
- **Principle**: Adhere to minimum viable functionality and lowest complexity.
- **Scope**: Avoid special edge cases. Focus on role-based access and state-based business rules.

## Data & Schema
- **Source of Truth**: `supabase/migrations/0002_create_lms_tables.sql`.
- **Rule**: Strictly adhere to the defined schema. Do not use columns/structures not present in it.

## Core Tech Stack
- **Libraries**: `date-fns`, `ts-pattern`, `react-query`, `zustand`, `zod`, `shadcn-ui`, `tailwindcss`, `supabase`, `react-hook-form`.
- **Structure**: Feature-based directory structure (`src/features/[featureName]`).

## Development Workflow
1.  **Backend**: Create `schema.ts` -> `service.ts` -> `route.ts`, then register the route in `app.ts`.
2.  **Frontend**: Create `use{Action}.ts` hook -> `{Component}.tsx`.
3.  **API**: All frontend->backend calls must use the `api-client`.

## Must-Do Rules
- Use `"use client"` for all components.
- Use Promises for `page.tsx` params props.
- Use `picsum.photos` for placeholder images.
- Route all feature hook HTTP requests through `@/lib/remote/api-client`.