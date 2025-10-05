# Backend Conventions

## Service Pattern
- **Return Type**: `HandlerResult<Data, ErrorCode, Details>`.
- **Helpers**: Use `success(data)` and `failure(status, code, message)`.
- **Transactions**: Ensure atomicity. Roll back changes on failure.
- **Validation**: Validate DB responses with Zod's `safeParse()`.
- **Defaults**: The service layer, not the client, sets system-generated values (e.g., `owner_id`, `status`).

## Route Pattern
- **Validation**: Use `safeParse()` for request bodies/params.
- **Response**: Use the `respond(c, result)` helper.
- **Authorization**: Enforce role-based access control at the route layer, before the service is called.

## Authentication Pattern

- **User Requests (e.g., course enrollment, submissions)**:
  1.  Use **Anon Client + User Access Token**.
  2.  Extract token from `Authorization` header.
  3.  Create `createAnonClient` with the user's token.
  4.  Authenticate with `supabase.auth.getUser()`.
  5.  Return 401 on failure.

- **Admin Operations (e.g., user signup, system tasks)**:
  1.  Use **Service Role Client** (`c.get('supabase')`).
  2.  This client has full admin access and bypasses RLS.

### Critical Auth Rules
- **NEVER** use the Service Role client (`c.get('supabase')`) to authenticate user requests.
- **ALWAYS** use the Anon Client with a user's access token for user-initiated actions.
- The Service Role client is for **admin operations ONLY**.