# Frontend Conventions

## DTO Pattern
- **Purpose**: Share types between Frontend & Backend.
- **Method**: Re-export from `backend/schema.ts`.

## Hook Pattern (React Query)
- **Mutations**: Use `useMutation` for POST/PUT/DELETE. On success, show toast and redirect. On error, show toast.
- **Queries**: Use `useQuery` for GET. Set `staleTime` to 1 minute. Use `enabled: Boolean(id)` for conditional fetching.

## Form Pattern (React Hook Form)
- **Validation**: Use `react-hook-form` with `zodResolver`.
- **UI**: Use `shadcn-ui` components.
- **Structure**: `FormField` -> `FormControl` + `FormMessage`. Show pending state on `Button`.

## Naming Conventions
- **Files**: `PascalCase.tsx` (Components), `use{Action}.ts` (Hooks).
- **Variables**: `PascalCase` (Components, Types), `camelCase` (Functions), `UPPER_SNAKE_CASE` (Constants).