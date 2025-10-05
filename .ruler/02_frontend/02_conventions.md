# Frontend Conventions

## DTO Pattern

```yaml
dto_pattern:
  purpose: "Share types between FE/BE"
  method: "Re-export from backend/schema.ts"
```

## Hook Pattern

```yaml
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
```

## Form Pattern

```yaml
form_pattern:
  validation: "react-hook-form + zodResolver"
  ui: "shadcn-ui components"
  structure:
    - "FormField for each input"
    - "FormControl + FormMessage"
    - "Button with isPending state"
```

## Naming Conventions

```yaml
files:
  components: "PascalCase.tsx"
  hooks: "use{Action}.ts"

variables:
  components: "PascalCase"
  functions: "camelCase"
  constants: "UPPER_SNAKE_CASE"
  types: "PascalCase"
```
