# Debugging Checklist v1.0

## API 404 Errors

```yaml
api_route_not_found:
  symptom: "POST /api/{route} → 404 Not Found"

  checklist:
    hono_config:
      - "✓ basePath('/api') set in createHonoApp()?"
      - "✓ Route registered in app.ts?"
      - "✓ Route file exports register{Feature}Routes()?"

    environment:
      - "✓ SUPABASE_URL in .env.local?"
      - "✓ SUPABASE_SERVICE_ROLE_KEY set?"

    cache:
      - "✓ Dev server restarted?"
      - "✓ Delete .next folder?"
      - "✓ Clear singleton cache (code change)?"

    path_matching:
      - "✓ Hono route: /auth/signup"
      - "✓ Actual API: /api/auth/signup"
      - "✓ Frontend calls: /api/auth/signup"

  quick_fix:
    - "Stop dev server (Ctrl+C)"
    - "rm -rf .next"
    - "npm run dev"
```

## Type Errors

```yaml
zod_validation_errors:
  literal_vs_boolean:
    problem: "Type 'false' not assignable to type 'true'"
    cause: "z.literal(true) in schema, false in defaultValues"
    fix: "z.boolean().refine(val => val === true)"

  optional_fields:
    problem: "Type 'undefined' not assignable"
    cause: "Missing .optional() in schema"
    fix: "z.string().optional()"

  enum_mismatch:
    problem: "Type 'string' not assignable to enum"
    cause: "Hardcoded value not in enum"
    fix: "Use exact enum values: 'learner' | 'instructor'"

build_errors:
  checklist:
    - "✓ npx tsc --noEmit (type check)"
    - "✓ Check schema vs defaultValues"
    - "✓ Verify all imports exist"
    - "✓ Match exported type names"
```

## Runtime Errors

```yaml
form_validation:
  symptom: "Form submits but API returns 400"

  debug_steps:
    1: "console.log(formData) before submit"
    2: "Check Zod error in API response"
    3: "Verify schema matches form fields"
    4: "Test with curl/Postman directly"

  common_issues:
    - "Field name mismatch (email vs userEmail)"
    - "Missing required field"
    - "Wrong data type (string vs number)"

supabase_errors:
  auth_creation_failed:
    check:
      - "✓ Service role key correct?"
      - "✓ admin.createUser() available?"
      - "✓ Email format valid?"

  profile_creation_failed:
    check:
      - "✓ Table 'profiles' exists?"
      - "✓ Column names match schema?"
      - "✓ RLS policies allow insert?"

  rollback_failed:
    cause: "Transaction not atomic"
    fix: "Manual cleanup in catch block"

  user_authentication_401:
    symptom: "POST /api/{route} → 401 Unauthorized (user requests)"

    checklist:
      client_type:
        - "✓ Using Service Role client (c.get('supabase')) instead of Anon client?"
        - "✓ Service Role client CANNOT authenticate user JWT tokens"
        - "✓ Check if route extracts Authorization header?"

      token_extraction:
        - "✓ Authorization header present in request (Network tab)?"
        - "✓ Access token extracted with authHeader?.replace('Bearer ', '')?"
        - "✓ Check if accessToken is passed to createAnonClient()?"

      client_creation:
        - "✓ Using createAnonClient({ url, anonKey, accessToken })?"
        - "✓ Anon Key (not Service Role Key) used in createAnonClient()?"
        - "✓ accessToken parameter provided?"

      auth_call:
        - "✓ Calling supabase.auth.getUser() on Anon client?"
        - "✓ Checking for authError and null user?"

    root_cause: "Service Role client cannot authenticate user JWT tokens"

    solution: |
      // ✅ Correct pattern
      const authHeader = c.req.header('Authorization');
      const accessToken = authHeader?.replace('Bearer ', '');

      if (!accessToken) {
        return respond(c, failure(401, 'UNAUTHORIZED', '인증 토큰이 필요합니다.'));
      }

      const supabase = createAnonClient({
        url: config.supabase.url,
        anonKey: config.supabase.anonKey,
        accessToken, // ← User's JWT token
      });

      const { data: { user }, error } = await supabase.auth.getUser();

    reference: "See src/features/courses/backend/route.ts for correct implementation"
    documentation: "docs/log/spec-004-001-enrollment-401-fix.md"
```

## Dev Tools Usage

```yaml
browser_devtools:
  network_tab:
    - "Check request payload"
    - "Verify response status/body"
    - "Inspect headers (auth token)"

  console:
    - "Log form data before submit"
    - "Check for React errors"
    - "Verify API response structure"

  react_devtools:
    - "Inspect form state"
    - "Check hook values (isPending, error)"
    - "Verify props/context"

debugging_code:
  service_layer: |
    console.log('Service input:', body);
    const result = await supabase...;
    console.log('DB result:', result);

  hook_layer: |
    onSuccess: (data) => {
      console.log('API success:', data);
      toast({ ... });
    }
```

## Quick Fixes

```yaml
immediate_actions:
  404_error:
    - "Restart dev server"
    - "Check basePath('/api')"
    - "Verify route registration"

  type_error:
    - "npx tsc --noEmit"
    - "Check schema definitions"
    - "Match types in defaultValues"

  build_error:
    - "Check .env.local"
    - "Verify all imports"
    - "Clear .next folder"

  validation_error:
    - "Log request body"
    - "Compare with schema"
    - "Test with safeParse()"
```

## Error Investigation Flow

```yaml
investigation_process:
  1_identify:
    where: "Frontend, Backend, or Database?"
    how: "Check Network tab + Server logs"

  2_isolate:
    method: "Binary search (comment out code)"
    target: "Find exact failing line"

  3_verify:
    test: "Reproduce with minimal code"
    confirm: "Same error in isolation?"

  4_fix:
    apply: "Implement solution"
    validate: "Test edge cases"

  5_document:
    record: "Add to this checklist if new pattern"
    prevent: "Update coding standards"

toost_not_showing:
  symptom: "useToast() 호출했지만 토스트 메시지가 표시되지 않음"
  
  checklist:
    1_toaster_component:
      - "✓ <Toaster /> 컴포넌트가 layout.tsx에 추가되었는가?"
      - "✓ import { Toaster } from '@/components/ui/toaster' 확인"
    
    2_callback_override:
      - "✓ mutate(data, { onSuccess }) 형태로 로컬 콜백을 전달하고 있는가?"
      - "✓ Hook의 onSuccess가 실행되지 않고 있는가?"
    
    3_console_debug:
      - "✓ Hook의 onSuccess에 console.log 추가하여 실행 여부 확인"
      - "✓ API 응답이 성공(200 OK)인지 Network 탭에서 확인"
    
    4_variable_scope:
      - "✓ Hook 콜백에서 참조하는 변수가 선언되기 전에 사용되지 않았는가?"

  quick_fix:
    - "app/layout.tsx에 <Toaster /> 추가"
    - "mutate() 호출 시 로컬 onSuccess 제거"
    - "변수 선언 순서 검토"
```
