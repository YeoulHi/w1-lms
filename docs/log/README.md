# Project Rules & Standards

> 이 프로젝트의 코딩 규칙, 디버깅 가이드, 학습 경로를 정리한 문서입니다.

## 📚 Documents

### Core Standards
- **[coding-standards.md](./coding-standards.md)** - 백엔드/프론트엔드 아키텍처 규칙
- **[environment.md](./environment.md)** - 환경 변수 설정 가이드
- **[debugging.md](./debugging.md)** - 디버깅 체크리스트

### Learning Resources
- **[learning-path.md](./learning-path.md)** - 기술 스택 학습 경로 & 실습 프로젝트

## 🚀 Quick Start

```yaml
new_feature_checklist:
  backend:
    - "Create schema.ts (Zod validation)"
    - "Create service.ts (business logic)"
    - "Create route.ts (API endpoint)"
    - "Create error.ts (error codes)"
    - "Register in createHonoApp()"

  frontend:
    - "Create dto.ts (re-export types)"
    - "Create use{Action}.ts (React Query hook)"
    - "Create {Component}.tsx (UI)"
    - "Update page.tsx"

  validation:
    - "npx tsc --noEmit (type check)"
    - "npm run lint (ESLint)"
    - "npm run build (production build)"
```

## 🔍 Common Issues

```yaml
404_api_error:
  fix: "Check basePath('/api') in Hono app"
  docs: "debugging.md#api-404-errors"

type_error:
  fix: "Verify Zod schema vs defaultValues"
  docs: "debugging.md#type-errors"

build_failure:
  fix: "Check .env.local for all required vars"
  docs: "environment.md#build-errors"
```

## 📖 How to Use

### For Developers
1. **Starting a new feature?** → Read [coding-standards.md](./coding-standards.md)
2. **Hit an error?** → Check [debugging.md](./debugging.md)
3. **Env var issues?** → See [environment.md](./environment.md)

### For Learners
1. **New to the stack?** → Follow [learning-path.md](./learning-path.md)
2. **Want to practice?** → Try the hands-on projects
3. **Need to understand?** → Trace existing code flow

## 🛠️ Tech Stack

```yaml
backend:
  framework: "Hono"
  validation: "Zod"
  database: "Supabase"
  runtime: "Node.js"

frontend:
  framework: "Next.js (App Router)"
  forms: "React Hook Form"
  data: "React Query"
  ui: "shadcn-ui"
  styling: "Tailwind CSS"
```

## 📝 Contributing

Before submitting code, ensure:
- ✅ Follows [coding-standards.md](./coding-standards.md)
- ✅ No type errors (`npx tsc --noEmit`)
- ✅ No lint errors (`npm run lint`)
- ✅ Build succeeds (`npm run build`)
- ✅ Tested locally

## 🔗 Quick Links

- [Project PRD](../prd.md)
- [Database Schema](../database.md)
- [User Flow](../userflow.md)
- [Project Goals](../goal.md)
