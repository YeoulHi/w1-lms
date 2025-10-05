# Backend Conventions

## Service Pattern

```yaml
service_pattern:
  return_type: "HandlerResult<Data, ErrorCode, Details>"
  helpers:
    success: "success(data, status?)"
    failure: "failure(status, code, message, details?)"
  transaction:
    atomic: true
    rollback: "Delete created records on failure"
  validation:
    - "Validate DB responses with schemas"
    - "Use safeParse() for type safety"
  creation_defaults:
    - "Service layer sets system-generated values on creation (e.g., owner_id, default status like 'draft')."
    - "These values must not be part of the request schema from the client."
```

## Route Pattern

```yaml
route_pattern:
  validation: "safeParse() request body/params"
  response: "respond(c, result)"
  logging: "Log errors with getLogger(c)"
  registration: "registerAuthRoutes(app) in createHonoApp()"
  authorization:
    - "Role-based access control must be enforced at the route/middleware layer, before calling the service."
```

## Authentication Pattern

```yaml
authentication_pattern:
  user_request_handling:
    method: "Anon Client + Access Token"
    steps:
      1: "Extract access token from Authorization header"
      2: "Create anon client with createAnonClient({ url, anonKey, accessToken })"
      3: "Call supabase.auth.getUser() to authenticate"
      4: "Return 401 if authentication fails"
      5: "Pass authenticated user.id to service layer"
    use_cases:
      - "Course creation by instructors"
      - "Enrollment by learners"
      - "Assignment submission"
      - "All user-initiated actions requiring authentication"
    pattern: |
      const authHeader = c.req.header('Authorization');
      const accessToken = authHeader?.replace('Bearer ', '');

      if (!accessToken) {
        return respond(c, failure(401, 'UNAUTHORIZED', '인증 토큰이 필요합니다.'));
      }

      const supabase = createAnonClient({
        url: config.supabase.url,
        anonKey: config.supabase.anonKey,
        accessToken,
      });

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return respond(c, failure(401, 'UNAUTHORIZED', '인증되지 않은 사용자입니다.'));
      }

  admin_operation_handling:
    method: "Service Role Client (c.get('supabase'))"
    use_cases:
      - "User signup (createUser in auth.admin)"
      - "System initialization"
      - "Background jobs"
      - "Admin-only operations bypassing RLS"
    limitation: "CANNOT authenticate user JWT tokens"
    pattern: |
      const supabase = c.get('supabase'); // Service Role Key client

      // Admin operations only
      const { data, error } = await supabase.auth.admin.createUser({
        email, password, email_confirm: true
      });

  client_comparison:
    service_role:
      key_type: "Service Role Key"
      permissions: "Full admin access, bypasses RLS"
      user_auth: "❌ Cannot authenticate user JWT"
      use_for: "Admin operations, background jobs"
      security: "NEVER expose to client"
    anon_with_token:
      key_type: "Anon Key + User JWT Token"
      permissions: "User-level access, RLS enforced"
      user_auth: "✅ Can authenticate via auth.getUser()"
      use_for: "User-initiated requests"
      security: "Safe (Anon Key is public, JWT is user-specific)"

  critical_rules:
    - "NEVER use Service Role client (c.get('supabase')) for user authentication"
    - "ALWAYS extract Authorization header for user requests"
    - "ALWAYS use createAnonClient with access token for user operations"
    - "Service Role client is for admin operations ONLY"
    - "Follow existing patterns in src/features/courses/backend/route.ts"
```

## Naming Conventions

```yaml
files:
  schemas: "kebab-case.ts"

routes:
  hono: "/resource" or "/resource/:id"
  nextjs: "[[...hono]]" for catch-all
```
