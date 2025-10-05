# Backend Architecture

## File Structure

```yaml
file_structure:
  feature_based:
    schema: "src/features/{feature}/backend/schema.ts"
    service: "src/features/{feature}/backend/service.ts"
    route: "src/features/{feature}/backend/route.ts"
    error: "src/features/{feature}/backend/error.ts"
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
- 공통 HTTP 응답 헬퍼는 `src/backend/http/response.ts`에서 제공하며, 모든 라우터/서비스는 `success`/`failure`/`respond` 패턴을 사용합니다。
- 프론트엔드 레이어는 전부 Client Component (`"use client"`) 로 유지하고, 서버 상태는 `@tanstack/react-query` 로만 관리합니다。

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
