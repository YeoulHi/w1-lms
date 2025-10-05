# Type Safety

## Schema Pattern (Zod)
- **Exports**: Export `request_schema`, `response_schema`, and inferred types (`z.infer<typeof Schema>`).
- **Rules**: Use `.optional()` for nullable fields, `enum()` for status fields, and `.refine()` for complex validation.

## Type Safety Rules
- **Strict Mode**: TypeScript's `strict` mode is enabled.
- **No `any`**: Use `unknown` or specific types instead of `any`.
- **Validation Flow**:
  1.  Define Zod schema.
  2.  Infer TypeScript type.
  3.  Use type consistently across FE/BE.
  4.  Use `safeParse()` for runtime validation.
- **Error Handling**: Use `HandlerResult` in the backend and `extractApiErrorMessage()` in the frontend. Provide user feedback via toasts.