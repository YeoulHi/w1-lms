# Lesson: Essential Full-Stack Patterns

This document summarizes critical patterns and lessons learned from past incidents. Following these rules is essential to prevent common bugs and build failures.

---

## 📌 Backend: Authentication & Authorization

### Rule 1: Use the Correct Supabase Client (Anon vs. Service Role)

- **Problem**: Using the **Service Role Client** for user requests returns `null` for `supabase.auth.getUser()` and bypasses RLS, leading to 401 errors or data leaks.
- **Solution**:
  - **User Requests**: **ALWAYS** use the **Anon Client** initialized with the user's JWT. This is mandatory for authenticating and authorizing actions on behalf of a user.
  - **Admin Tasks**: Only use the **Service Role Client** (`c.get('supabase')`) for backend-only administrative operations where RLS should be bypassed.

### Rule 2: Distinguish Between 401 vs. 403 Errors

- **401 Unauthorized**: Return this when `supabase.auth.getUser()` fails. It means the user is **not authenticated** (e.g., missing or invalid JWT).
- **403 Forbidden**: Return this when the user is authenticated but **lacks permissions** for a specific resource (e.g., user ID does not match the resource's `instructor_id`).

### Rule 3: Secure State Transitions

- **Problem**: Allowing invalid state changes (e.g., re-publishing an already published course).
- **Solution**: Before any state update, always:
  1.  **Verify Current State**: Check if the entity's current `status` allows the transition.
  2.  **Update Timestamp**: Set the `updated_at` field along with the `status`.
  3.  **Validate DB Response**: Use a Zod schema to `safeParse()` the data returned from the database to ensure consistency.

---

## 📌 Frontend: React Query & UI Feedback

### Rule 4: Pass `onSuccess` Callbacks to Hook Creators

- **Problem**: Passing an `onSuccess` callback directly to a `mutate()` function (e.g., `mutate(data, { onSuccess: ... })`) overrides the default `onSuccess` defined in the `useMutation` hook, preventing global feedback like toasts from firing.
- **Solution**: Pass custom success logic as an argument to the **hook creator**. This ensures both the global and local callbacks execute.

```typescript
// ✅ Correct: Pass callback to hook creator
const { mutate } = useMyMutation(() => form.reset());
mutate(data);
```

### Rule 5: Provide Comprehensive UI Feedback

- **Problem**: Users are left confused during or after an action due to missing feedback.
- **Solution**: Every action must implement all three feedback states:
  1.  **Loading**: Disable interactive elements and show a loading indicator (`isPending`).
  2.  **Success**: Display a confirmation toast.
  3.  **Error**: Display a destructive toast with a clear error message.
- **Don't Forget**: The `<Toaster />` component must be in `layout.tsx`.

---

## 📌 General: TypeScript & Naming

### Rule 6: Do Not Modify Hono Context (`c.set`)

- **Problem**: `c.set('user', ...)` causes type errors because `user` is not a defined variable in the Hono context (`AppVariables`).
- **Solution**: **Do not use `c.set()` for arbitrary variables.** Authenticate the user within the route handler and use the `user` object locally.

### Rule 7: Ensure Schema Field Consistency

- **Problem**: Mismatches between database columns, Zod schemas, and frontend form fields.
- **Solution**: All names **must match exactly**. A column named `content_text` in the DB must also be `content_text` in the Zod schema and the corresponding `<FormField>`.

---

## 📋 Pre-Commit Checklist

1.  **Run Type Check**: `npx tsc --noEmit` and fix all errors.
2.  **Verify Backend Patterns**:
    - [ ] Using **Anon Client** for user requests?
    - [ ] Correctly returning **401 vs. 403**?
    - [ ] Validating **state transitions**?
3.  **Verify Frontend Patterns**:
    - [ ] `onSuccess` passed to **hook creator**?
    - [ ] **Loading, Success, and Error** feedback implemented?
    - [ ] `<Toaster />` exists in `layout.tsx`?
4.  **Verify Naming**: DB columns, Zod schemas, and form fields are consistent?
