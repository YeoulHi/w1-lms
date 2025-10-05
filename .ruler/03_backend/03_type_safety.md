# Type Safety

## Schema Pattern

```yaml
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
