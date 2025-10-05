# Coding Standards v1.0

## Backend Architecture

```yaml
file_structure:
  feature_based:
    schema: "src/features/{feature}/backend/schema.ts"
    service: "src/features/{feature}/backend/service.ts"
    route: "src/features/{feature}/backend/route.ts"
    error: "src/features/{feature}/backend/error.ts"
    error: "src/features/{feature}/backend/error.ts"

schema_pattern:
  validation: "Zod"
  exports:
    - request_schema: "z.object()"
    - response_schema: "z.object()"
    - types: "z.infer<typeof Schema>"
  rules:
    - "boolean + refine() for checkbox validation"
    - "enum() for role/status fields"
    - ".optional() for nullable fields"

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
  creation_defaults:
    - "Service layer sets system-generated values on creation (e.g., owner_id, default status like 'draft')."
    - "These values must not be part of the request schema from the client."

route_pattern:
  validation: "safeParse() request body/params"
  response: "respond(c, result)"
  logging: "Log errors with getLogger(c)"
  registration: "registerAuthRoutes(app) in createHonoApp()"
  authorization:
    - "Role-based access control must be enforced at the route/middleware layer, before calling the service."

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

## Frontend Architecture

```yaml
file_structure:
  feature_based:
    dto: "src/features/{feature}/lib/dto.ts"
    hooks: "src/features/{feature}/hooks/use{Action}.ts"
    components: "src/features/{feature}/components/{Component}.tsx"

dto_pattern:
  purpose: "Share types between FE/BE"
  method: "Re-export from backend/schema.ts"

hook_pattern:
  library: "React Query (@tanstack/react-query)"
  mutations:
    - "useMutation for POST/PUT/DELETE"
    - "onSuccess: toast + redirect"
    - "onError: toast error message"
  queries:
    - "useQuery for GET"
    - "staleTime: 60000 (1min)"
    - "enabled: Boolean(id)"

form_pattern:
  validation: "react-hook-form + zodResolver"
  ui: "shadcn-ui components"
  structure:
    - "FormField for each input"
    - "FormControl + FormMessage"
    - "Button with isPending state"

component_pattern:
  client: "'use client' directive"
  imports: "Alphabetical order"
  exports: "Named exports for components"

shadcn_ui_setup:
  toast_component:
    requirement: "useToast() hook 사용 시 반드시 <Toaster /> 컴포넌트를 렌더링 트리에 추가"
    location: "app/layout.tsx 또는 최상위 레이아웃"
    pattern: |
      import { Toaster } from "@/components/ui/toaster";
      
      export default function RootLayout({ children }) {
        return (
          <Provider>
            {children}
            <Toaster />
          </Provider>
        );
      }
    
  hook_callback_pattern:
    problem: "useMutation의 로컬 onSuccess 콜백이 hook 정의된 onSuccess를 덮어씀"
    solution: "Hook에 콜백 파라미터 추가하여 체이닝"
    example: |
      // Hook 정의
      export const useCreateCourse = (onSuccessCallback?: () => void) => {
        return useMutation({
          onSuccess: () => {
            toast({ ... });
            onSuccessCallback?.();
          }
        });
      };
      
      // 컴포넌트 사용
      const { mutate } = useCreateCourse(() => form.reset());
      mutate(data); // 로컬 onSuccess 전달하지 않음

  variable_order:
    rule: "Hook이 다른 변수를 참조할 경우 선언 순서 주의"
    pattern: |
      // ❌ 잘못된 순서
      const { mutate } = useHook(() => form.reset());
      const form = useForm();
      
      // ✅ 올바른 순서
      const form = useForm();
      const { mutate } = useHook(() => form.reset());```

## Hono Configuration

```yaml
app_setup:
  basePath: "/api"
  singleton: "Cache app instance"
  middleware_order:
    1: "errorBoundary()"
    2: "withAppContext()"
    3: "withSupabase()"
    4: "register{Feature}Routes()"

route_mapping:
  definition: "/auth/signup"
  actual_path: "/api/auth/signup"
  nextjs_file: "/api/[[...hono]]/route.ts"

critical_rules:
  - "Always set .basePath('/api')"
  - "Register routes in createHonoApp()"
  - "Restart dev server after route changes"
```

## Type Safety Rules

```yaml
typescript:
  strict_mode: true
  no_any: "Use unknown or specific types"
  inference: "Let Zod infer types"

validation_flow:
  1: "Define Zod schema"
  2: "Infer TypeScript type"
  3: "Use in FE/BE consistently"
  4: "safeParse() for runtime validation"

error_handling:
  backend: "HandlerResult type"
  frontend: "extractApiErrorMessage()"
  user_feedback: "toast notifications"
```

## Naming Conventions

```yaml
files:
  schemas: "kebab-case.ts"
  components: "PascalCase.tsx"
  hooks: "use{Action}.ts"

variables:
  components: "PascalCase"
  functions: "camelCase"
  constants: "UPPER_SNAKE_CASE"
  types: "PascalCase"

routes:
  hono: "/resource" or "/resource/:id"
  nextjs: "[[...hono]]" for catch-all
```
