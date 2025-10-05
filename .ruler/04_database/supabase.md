# Supabase Migration SQL Guidelines

## Must
- **Unique, Numbered Names**: `0001_create_users.sql`.
- **Idempotent**: Use `CREATE TABLE IF NOT EXISTS`.
- **Constraints**: Use `NOT NULL`, `UNIQUE`, etc.
- **`updated_at` Column**: Add to all tables with a trigger.
- **No RLS**: Disable RLS for all tables (`disable row level security`).

## Should
- **Small Migrations**: Keep changes minimal.
- **`snake_case`**: Use for all identifiers.

## Recommended Patterns
- **Indexes**: Add for frequently queried columns.
- **Foreign Keys**: Maintain referential integrity.
- **Enums**: Use for fields with a fixed set of values.