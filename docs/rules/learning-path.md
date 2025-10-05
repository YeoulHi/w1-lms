# Learning Path v1.0

## Tech Stack Mastery

```yaml
level_1_foundations:
  zod:
    docs: "https://zod.dev"
    practice:
      - "Basic schemas (string, number, object)"
      - "Validation (.min, .max, .email)"
      - "Type inference (z.infer)"
      - "Custom validation (.refine)"

  react_hook_form:
    docs: "https://react-hook-form.com"
    practice:
      - "useForm basics"
      - "register vs Controller"
      - "zodResolver integration"
      - "Error handling"

  react_query:
    docs: "https://tanstack.com/query"
    practice:
      - "useQuery for GET"
      - "useMutation for POST/PUT/DELETE"
      - "Cache management"
      - "Optimistic updates"

level_2_frameworks:
  hono:
    docs: "https://hono.dev"
    concepts:
      - "Routing (get, post, put, delete)"
      - "Middleware (use)"
      - "Context (c)"
      - "basePath configuration"

  nextjs_app_router:
    docs: "https://nextjs.org/docs"
    concepts:
      - "API routes (route.ts)"
      - "Catch-all routes ([[...slug]])"
      - "Server vs Client components"
      - "Environment variables"

level_3_integration:
  supabase:
    docs: "https://supabase.com/docs"
    advanced:
      - "Admin API (createUser, deleteUser)"
      - "Row Level Security (RLS)"
      - "Database transactions"
      - "Storage integration"
```

## Hands-on Projects

```yaml
project_1_todo_api:
  difficulty: "Beginner"
  duration: "2-3 days"

  features:
    - "POST /api/todos (create)"
    - "GET /api/todos (list)"
    - "PATCH /api/todos/:id (update)"
    - "DELETE /api/todos/:id (delete)"

  learning_goals:
    - "Zod schema for CRUD"
    - "Service layer pattern"
    - "React Query hooks"
    - "Form validation"

  checklist:
    - "✓ Schema with validation"
    - "✓ Service with error handling"
    - "✓ Route with proper status codes"
    - "✓ Form with react-hook-form"

project_2_comment_system:
  difficulty: "Intermediate"
  duration: "1 week"

  features:
    - "Nested comments (replies)"
    - "Pagination (cursor-based)"
    - "Edit/Delete with auth check"
    - "Optimistic UI updates"

  learning_goals:
    - "Complex Zod schemas"
    - "Database transactions"
    - "Query invalidation"
    - "Error boundary"

project_3_file_upload:
  difficulty: "Advanced"
  duration: "1 week"

  features:
    - "Supabase Storage integration"
    - "Upload progress tracking"
    - "File validation (type, size)"
    - "Presigned URLs"

  learning_goals:
    - "FormData handling"
    - "Streaming uploads"
    - "Storage security"
    - "Client-side optimization"
```

## Code Analysis Method

```yaml
request_flow_tracing:
  user_action: "Click submit button"
  frontend:
    1: "SignUpForm.tsx → onSubmit()"
    2: "useSignUp.ts → mutate(data)"
    3: "apiClient.post('/api/auth/signup')"
  backend:
    4: "route.ts → POST handler"
    5: "service.ts → signUpService()"
    6: "Supabase → Database operations"
  response:
    7: "Success/Error → Frontend"
    8: "Toast notification + Redirect"

type_safety_flow:
  definition: "Zod schema (schema.ts)"
  inference: "TypeScript type (z.infer)"
  sharing: "DTO exports to frontend"
  validation: "Runtime safeParse()"
  usage: "Type-safe API calls"

error_handling_pattern:
  service:
    return: "HandlerResult<Data, ErrorCode>"
    success: "success(data, 201)"
    failure: "failure(409, 'EMAIL_CONFLICT', message)"
  route:
    check: "if (!result.ok)"
    log: "logger.error(errorResult.error.message)"
    respond: "respond(c, result)"
  frontend:
    hook: "onError: (error) => toast()"
    display: "FormMessage component"
```

## Study Techniques

```yaml
active_learning:
  trace_existing_code:
    - "Pick a feature (signup)"
    - "Follow request → response"
    - "Note each file's role"
    - "Understand data transformations"

  modify_and_test:
    - "Add a new field (birthday)"
    - "Update schema → service → form"
    - "Test validation errors"
    - "Check type safety"

  build_similar_feature:
    - "Copy signup structure"
    - "Implement login"
    - "Note patterns/differences"
    - "Refactor common code"

debugging_practice:
  introduce_bugs:
    - "Remove required field"
    - "Wrong API path"
    - "Invalid Zod schema"
    - "Missing env var"

  fix_systematically:
    - "Read error message"
    - "Check debugging.md checklist"
    - "Isolate the issue"
    - "Apply fix + verify"

daily_checklist:
  morning:
    - "Review yesterday's code"
    - "Read 1 docs page"
    - "Set 1 concrete goal"

  afternoon:
    - "Implement 1 feature"
    - "Debug 1 issue"
    - "Ask 1 question (community/AI)"

  evening:
    - "Commit working code"
    - "Document what learned"
    - "Plan tomorrow"
```

## Resources

```yaml
documentation:
  must_read:
    - "Zod: Schema validation"
    - "React Query: Data fetching"
    - "Hono: Web framework"
    - "Next.js: App router"

  references:
    - "MDN: JavaScript fundamentals"
    - "TypeScript: Handbook"
    - "Supabase: Auth + Database"

communities:
  discord:
    - "Hono Discord"
    - "React Query Discord"
    - "Supabase Discord"

  github:
    - "Read library source code"
    - "Study real-world examples"
    - "Contribute to discussions"

practice_platforms:
  coding:
    - "FreeCodeCamp (JS basics)"
    - "TypeScript Playground"
    - "CodeSandbox (quick tests)"

  projects:
    - "Personal portfolio"
    - "Open source contributions"
    - "Freelance practice"
```

## Progress Tracking

```yaml
weekly_goals:
  week_1:
    learn: "Zod + React Hook Form"
    build: "Simple contact form"
    measure: "Form validation working?"

  week_2:
    learn: "React Query + Hono"
    build: "Todo CRUD API"
    measure: "All endpoints working?"

  week_3:
    learn: "Supabase integration"
    build: "Auth system (signup/login)"
    measure: "Can create + authenticate users?"

  week_4:
    learn: "Advanced patterns"
    build: "Real feature from PRD"
    measure: "Production-ready code?"

monthly_review:
  completed:
    - "List finished features"
    - "Count resolved bugs"
    - "Record new concepts learned"

  challenges:
    - "What was hardest?"
    - "What took longest?"
    - "What would you do differently?"

  next_month:
    - "Set specific goals"
    - "Choose new tech to learn"
    - "Plan larger project"
```
