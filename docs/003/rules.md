# Project-Wide Development Rules

1.  **Auth**: Enforce RBAC at the route layer. Use Bearer tokens for all authenticated APIs.
2.  **Backend Services**: Must return `HandlerResult`. System-generated values (e.g., `owner_id`) are set by the service, not the client.
3.  **Frontend State**: Use React Query for server state and `react-hook-form` for forms.
4.  **Validation**: Use Zod schemas for all API requests, responses, and DB results.
5.  **Database**: Use `snake_case` for column names.
6.  **DTOs**: Use `camelCase` for properties and re-export from backend schemas.
7.  **Error Handling**: Define and use standardized error codes per feature.
8.  **Pre-commit Checks**: Always run `npm run lint`, `npx tsc --noEmit`, and `npm run build`.