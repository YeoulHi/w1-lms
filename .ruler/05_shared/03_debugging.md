# Debugging Checklist

## API 404 Not Found
- **Hono**: Is `basePath('/api')` set? Is the route registered in `app.ts`?
- **Environment**: Are `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set in `.env.local`?
- **Cache**: Have you restarted the dev server and tried deleting the `.next` folder?

## Type Errors
- **Check Command**: Run `npx tsc --noEmit` to find errors.
- **Zod Schemas**: Check for mismatches, like `z.literal(true)` vs a `false` default, or missing `.optional()`.
- **Imports**: Ensure you are importing from the correct file.

## Runtime Errors

- **Form Submits with 400 Error**:
  1.  `console.log()` the form data before submission.
  2.  Check the API response body for the Zod error message.
  3.  Verify form field names match the Zod schema exactly.

- **Supabase Auth 401 Unauthorized (User Requests)**:
  - **Root Cause**: You are likely using the **Service Role client** (`c.get('supabase')`) to authenticate a user request. This is wrong.
  - **Solution**: User requests **must** be authenticated using the **Anon Client + User JWT**. Extract the Bearer token from the header, create an `anonClient` with it, and call `supabase.auth.getUser()`.
  - **Reference**: See `src/features/courses/backend/route.ts` for the correct pattern.

- **Toast Not Showing**:
  - Is the `<Toaster />` component in your `layout.tsx`?
  - Are you passing an `onSuccess` callback directly to `mutate()`? Pass it to the hook creator instead.