# Environment Variables v1.0

## Variable Types

```yaml
backend_only:
  SUPABASE_URL: "https://{project}.supabase.co"
  SUPABASE_SERVICE_ROLE_KEY: "service_role secret key"
  purpose: "Server-side admin operations"
  security: "NEVER expose to client"

frontend_public:
  NEXT_PUBLIC_SUPABASE_URL: "https://{project}.supabase.co"
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon public key"
  NEXT_PUBLIC_API_BASE_URL: "'' (empty for same origin)"
  purpose: "Client-side operations"
  security: "Safe to expose (public keys only)"
```

## Configuration Rules

```yaml
required_setup:
  file: ".env.local"
  gitignore: true
  both_versions: "Set SUPABASE_URL + NEXT_PUBLIC_SUPABASE_URL"

validation:
  location: "src/backend/config/index.ts"
  method: "Zod schema validation"
  timing: "Runtime check on app init"

build_errors:
  symptom: "Invalid backend configuration: Required"
  cause: "Missing SUPABASE_URL or SERVICE_ROLE_KEY"
  fix: "Add to .env.local and restart"
```

## Setup Template

```yaml
env_template: |
  # Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL=https://{project}.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY={anon_key}
  SUPABASE_URL=https://{project}.supabase.co
  SUPABASE_SERVICE_ROLE_KEY={service_role_key}

  # API Configuration (optional)
  NEXT_PUBLIC_API_BASE_URL=

security_checklist:
  - "Never commit .env.local to git"
  - "Use .env.example for templates (no real keys)"
  - "Rotate keys if accidentally exposed"
  - "Validate all backend env vars with Zod"
```

## Common Issues

```yaml
404_on_api:
  symptom: "POST /api/auth/signup → 404"
  check:
    - "SUPABASE_URL set?"
    - "basePath('/api') configured?"
    - "Dev server restarted?"
    - ".next folder cleared?"

build_failure:
  symptom: "Failed to collect page data"
  cause: "Env vars missing during build"
  fix: "Add all required vars to .env.local"

auth_errors:
  symptom: "Supabase client initialization failed"
  check:
    - "NEXT_PUBLIC_SUPABASE_URL correct?"
    - "NEXT_PUBLIC_SUPABASE_ANON_KEY valid?"
    - "Project URL matches actual Supabase project?"
```
