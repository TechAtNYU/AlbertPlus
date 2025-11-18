# Agent Development Guide

## Commands

- **Lint/Format**: `bun check` (check) or `biome check --write` (fix)
- **Type Check**: `bun check:types` (all) or `bun run --filter web check:types` (specific)
- **Dev**: `bun dev` (starts all services with Turbo)

## Code Style

- **Package Manager**: Bun (v1.3.1+), use `bun install` not npm/yarn/pnpm
- **Formatter**: Biome - 2 spaces, double quotes, organized imports
- **TypeScript**: Strict mode, no implicit any, use explicit types for exports
- **Imports**: Organize imports automatically via Biome, use `@/` for app imports, `workspace:*` for monorepo packages
- **Naming**: camelCase for variables/functions, PascalCase for components/types, UPPER_SNAKE_CASE for constants
- **Error Handling**: Use `ConvexError` for Convex functions, `JobError` for scraper jobs, typed errors preferred
- **Async**: Use async/await, avoid callbacks, handle errors with try/catch or .catch()
- **Components**: React 19 + Next.js 16, server components by default, use "use client" when needed
- **Database**: Convex for main app, Drizzle ORM for scraper D1 database
