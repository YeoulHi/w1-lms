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
  - **Reference**: See `.ruler/03_backend/02_conventions.md` for the correct pattern.

- **403 Forbidden (Instructor-Only Resource)**:
  - **Root Cause**: The authenticated user's ID does not match the `instructor_id` of the requested resource.
  - **Debugging Steps**:
    1.  **Verify Resource Ownership**: Check the `instructor_id` in the database.
        ```sql
        -- Example: Find assignment's instructor
        SELECT c.instructor_id, u.email
        FROM assignments a
        JOIN courses c ON a.course_id = c.id
        JOIN auth.users u ON c.instructor_id = u.id
        WHERE a.id = '{assignment_id}';
        ```
    2.  **Verify Logged-in User**: Check the ID of the currently logged-in user.
        ```sql
        SELECT id, email FROM auth.users WHERE email = 'your-logged-in-email@example.com';
        ```
  - **Solution**: Log in with the correct instructor account or create new dummy data owned by the current user.

- **Toast Not Showing**:
  - **Check 1**: Is the `<Toaster />` component present in your root `layout.tsx`?
  - **Check 2**: Are you passing an `onSuccess` callback directly to the `mutate()` function? This overrides the global callback in the hook. Pass it to the hook creator instead.
    ```typescript
    // ✅ Correct
    const { mutate } = useMyMutation(() => {
      // This runs after the global onSuccess (e.g., toast)
      console.log('Custom logic here');
    });
    mutate();

    // ❌ Incorrect: Overrides the hook's default onSuccess
    const { mutate } = useMyMutation();
    mutate(undefined, {
      onSuccess: () => console.log('Toast will not be shown'),
    });
    ```