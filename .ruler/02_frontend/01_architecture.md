# Frontend Architecture

## File Structure

```yaml
file_structure:
  feature_based:
    dto: "src/features/{feature}/lib/dto.ts"
    hooks: "src/features/{feature}/hooks/use{Action}.ts"
    components: "src/features/{feature}/components/{Component}.tsx"
```

## Component Pattern

```yaml
component_pattern:
  client: "'use client' directive"
  imports: "Alphabetical order"
  exports: "Named exports for components"
```
