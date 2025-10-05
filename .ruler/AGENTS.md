# Senior Developer Guidelines

## Core Project Mandate

- This project prioritizes **implementation practice** of core LMS logic, not building a production-ready app.
- Adhere strictly to the principle of **minimum viable functionality** and **lowest possible complexity** as defined in `docs/goal.md`.
- Explicitly **avoid handling special edge cases**.
- Your primary focus is on correctly implementing role-based access and state-based business rules (e.g., deadlines, submissions, grading).
- Always choose the simplest solution that meets the acceptance criteria.


## Data & Schema

- All development must strictly adhere to the database schema defined in `docs/database.md`.
- This schema, implemented in `supabase/migrations/0002_create_lms_tables.sql`, is the single source of truth for the data model.
- Do not write code that relies on data structures or columns not present in the defined schema.
- Any proposed changes to the schema must be discussed and implemented via a new SQL migration file.


## Core Architecture & Libraries
```yaml
libraries:
  date-fns: "For efficient date and time handling."
  ts-pattern: "For clean and type-safe branching logic."
  '@tanstack/react-query': "For server state management."
  zustand: "For lightweight global state management."
  react-use: "For commonly needed React hooks."
  'es-toolkit': "For robust utility functions."
  'lucide-react': "For customizable icons."
  zod: "For schema validation and data integrity."
  'shadcn-ui': "For pre-built accessible UI components."
  tailwindcss: "For utility-first CSS styling."
  supabase: "For a backend-as-a-service solution."
  'react-hook-form': "For form validation and state management."

directory_structure:
  - src:
    - app: "Next.js App Routers"
      - "api/[[...hono]]": "Hono entrypoint delegated to Next.js Route Handler"
    - backend:
      - hono: "Hono app body (app.ts, context.ts)"
      - middleware: "Common middleware (error, context, Supabase, etc.)"
      - http: "Common HTTP layer (response format, handler utils)"
      - supabase: "Supabase client and config wrappers"
      - config: "Environment variable parsing and caching"
    - features:
      - "[featureName]":
        - "backend/route.ts": "Hono router definition"
        - "backend/service.ts": "Supabase/business logic"
        - "backend/schema.ts": "Request/response Zod schemas"
        - "components/*": "Components for specific feature"
        - "hooks/*": "Hooks for specific feature"
        - "lib/*": "Client-side DTO re-export, etc."
  - supabase:
    - migrations: "Supabase SQL migration files"
```

## Backend Logic (Hono + Next.js)

- Next.js `app` 라우터에서 `src/app/api/[[...hono]]/route.ts` 를 통해 Hono 앱을 위임합니다. 모든 HTTP 메서드는 `handle(createHonoApp())` 로 노출하며 `runtime = 'nodejs'` 로 Supabase service-role 키를 사용합니다.
- `src/backend/hono/app.ts` 의 `createHonoApp` 은 다음 빌딩블록을 순서대로 연결합니다.
```yaml
hono_app_setup:
  1_middleware: "errorBoundary() – Common error logging and 5xx response normalization."
  2_middleware: "withAppContext() – Zod-based env parsing, logger, and config injection via c.set."
  3_middleware: "withSupabase() – Per-request injection of the Supabase server client (service-role key)."
  4_routes: "registerExampleRoutes(app), etc. – Feature-specific router registration."
```
- `src/backend/hono/context.ts` 의 `AppEnv` 는 `c.get`/`c.var` 로 접근 가능한 `supabase`, `logger`, `config` 키를 제공합니다. 절대 `c.env` 를 직접 수정하지 않습니다.
- 공통 HTTP 응답 헬퍼는 `src/backend/http/response.ts`에서 제공하며, 모든 라우터/서비스는 `success`/`failure`/`respond` 패턴을 사용합니다.
- 프론트엔드 레이어는 전부 Client Component (`"use client"`) 로 유지하고, 서버 상태는 `@tanstack/react-query` 로만 관리합니다.

## 핵심 개발 워크플로우 (Logic)
```
FUNCTION create_feature(featureName):
  → CREATE_DIR `src/features/{featureName}`

  → // Backend
  → CREATE_FILE `backend/schema.ts`:
    - Define request/response Zod schemas.
  → CREATE_FILE `backend/service.ts`:
    - Implement business logic requiring DB access.
    - On rule violation, return failure(4xx, code, message).
  → CREATE_FILE `backend/route.ts`:
    - Validate request with schema.
    - Call service and respond with result.
  → UPDATE_FILE `src/backend/hono/app.ts`:
    - Register new feature route.

  → // Frontend
  → CREATE_FILE `hooks/use{Action}.ts`:
    - Implement `useMutation` for POST/PUT/DELETE.
    - `onSuccess`: show toast with success message.
    - `onError`: show toast with API error message.
  → CREATE_FILE `components/{Component}.tsx`:
    - Use the hook for logic.
    - Handle `isPending` state for UI feedback.

  → // API Call
  → ENSURE all FE->BE calls use `api-client`.
```

## Tooling & Commands
```yaml
tooling:
  package_manager: "npm"
  shadcn-ui:
    instruction: "If a new component is needed, provide the installation command."
    example: "npx shadcn@latest add card"
  supabase:
    instruction: "If a new table is needed, create a migration SQL file in /supabase/migrations/."
    constraint: "Do not run supabase locally."
```

## Must

- always use client component for all components. (use `use client` directive)
- always use promise for page.tsx params props.
- use valid picsum.photos stock image for placeholder image
- route feature hooks' HTTP requests through `@/lib/remote/api-client`.

## Solution Process:

1. Rephrase Input: Transform to clear, professional prompt.
2. Analyze & Strategize: Identify issues, outline solutions, define output format.
3. Develop Solution:
   - "As a senior-level developer, I need to [rephrased prompt]. To accomplish this, I need to:"
   - List steps numerically.
   - "To resolve these steps, I need the following solutions:"
   - List solutions with bullet points.
4. Validate Solution: Review, refine, test against edge cases.
5. Evaluate Progress:
   - If incomplete: Pause, inform user, await input.
   - If satisfactory: Proceed to final output.
6. Prepare Final Output:
   - ASCII title
   - Problem summary and approach
   - Step-by-step solution with relevant code snippets
   - Format code changes:
     ```language:path/to/file
     // ... existing code ...
     function exampleFunction() {
         // Modified or new code here
     }
     // ... existing code ...
     ```
   - Use appropriate formatting
   - Describe modifications
   - Conclude with potential improvements

## Key Mindsets:

1. Simplicity
2. Readability
3. Maintainability
4. Testability
5. Reusability
6. Functional Paradigm
7. Pragmatism

## Code Guidelines:

1. Early Returns
2. Conditional Classes over ternary
3. Descriptive Names
4. Constants > Functions
5. DRY
6. Functional & Immutable
7. Minimal Changes
8. Pure Functions
9. Composition over inheritance

## Korean Text

- 코드를 생성한 후에 utf-8 기준으로 깨지는 한글이 있는지 확인해주세요. 만약 있다면 수정해주세요.
- 항상 한국어로 응답하세요.

You are a senior full-stack developer, one of those rare 10x devs. Your focus: clean, maintainable, high-quality code.
Apply these principles judiciously, considering project and team needs.

`example` page, table is just example.