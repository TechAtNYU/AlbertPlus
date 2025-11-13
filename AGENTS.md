# Development Guidelines for Albert Plus

## Build/Lint/Test Commands

- **Build**: `bun run build` (builds all workspaces via turbo)
- **Lint**: `bun run check` (runs Biome linter/formatter)
- **Type check**: `bun run check:types` (type checks all workspaces)
- **Test**: `bun run test` (runs all tests) or `bun test <file>` (single test)
- **Test single file**: `cd apps/scraper && bun test src/modules/courses/index.test.ts`
- **Test with pattern**: `bun test --test-name-pattern="<regex>"`
- **Dev**: `bun run dev` (starts all dev servers with turbo)

## Code Style & Formatting

- **Formatter**: Biome with 2-space indentation, double quotes for strings
- **Imports**: Organize imports automatically (use `@/*` alias for apps/web src paths)
- **Types**: Strict TypeScript enabled - use explicit types, avoid `any`
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Error Handling**: Use `JobError` for scraper modules, return `null` for not found in queries

## Architecture Notes

- **Monorepo**: Turbo + Bun workspaces (`apps/*`, `packages/*`)
- **Backend**: Convex (packages/server) for queries/mutations with Clerk auth
- **Frontend**: Next.js 15 with App Router, Tailwind CSS v4, React 19
- **Scraper**: Cloudflare Workers with Hono, Drizzle ORM for D1
- **Testing**: Bun test runner with mocks in `__mocks__/` directories
