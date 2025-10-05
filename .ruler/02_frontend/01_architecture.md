# Frontend Architecture

## File Structure
- **Feature-Based**: Group files by feature.
  - `dto`: `src/features/{feature}/lib/dto.ts`
  - `hooks`: `src/features/{feature}/hooks/use{Action}.ts`
  - `components`: `src/features/{feature}/components/{Component}.tsx`

## Component Pattern
- **Directive**: Always use `'use client'`.
- **Imports**: Order alphabetically.
- **Exports**: Use named exports for components.