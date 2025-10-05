# Lesson: Preventing TypeScript Errors

This is a summary of critical TypeScript rules learned from a previous incident (`6dd822a`) that caused a full site outage. Follow these to prevent build failures.

--- 

### Rule 1: Do Not Modify Hono Context
- **Problem**: `c.set('user', ...)` causes type errors because `user` is not defined in `AppVariables`.
- **Solution**: **Do not use `c.set()` for arbitrary variables.** Instead, perform authentication directly within each route handler and use the resulting `user` object locally. The only permitted `c.set` operations are for `supabase`, `logger`, and `config` during initial setup.

### Rule 2: Specify Generic Type Arguments
- **Problem**: Using `Promise<HandlerResult>` without type arguments is an error.
- **Solution**: `HandlerResult` requires at least two generic arguments: `Promise<HandlerResult<TData, TCode>>`. Always specify them, e.g., `Promise<HandlerResult<any, string>>`.

### Rule 3: Verify Imports
- **Problem**: Importing a non-existent function/type (`Module has no exported member`).
- **Solution**: Before importing, **verify the export exists in the source file**. Check for correct paths (e.g., `@/lib/utils` vs. `@/lib/remote/api-client`) and correct type names when re-exporting from schemas.

### Rule 4: Use Correct API Client Pattern
- **Problem**: `apiClient.assignments.get()` fails because `apiClient` is a plain `axios` instance, not a typed Hono RPC client.
- **Solution**: This project **does not use Hono RPC client**. Use standard `axios` methods: `apiClient.get('/assignments')`, `apiClient.post(...)`, etc.

### Rule 5: Ensure Schema Field Consistency
- **Problem**: Mismatch between DB column names, Zod schema fields, and frontend form field names.
- **Solution**: All names **must match exactly**. `content_text` in the DB must be `content_text` in the Zod schema and `content_text` in the `<FormField>`. 

--- 

## Pre-Commit Checklist

1.  **Run Type Check**: `npx tsc --noEmit`
2.  **Fix All Errors**: Ensure zero errors before committing.
3.  **Verify Patterns**: Quickly check your code against the 5 rules above.