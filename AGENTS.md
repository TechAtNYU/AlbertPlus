# Agent Guidelines for albert-plus

## Build/Lint/Test Commands

- `bun run dev` - Start all apps in development mode
- `bun run build` - Build all applications
- `bun run check` - Run Biome linting/formatting across all workspaces
- `biome check --fix` - Auto-fix safe Biome issues (formatting, imports, safe fixes)
- `bun run check:types` - TypeScript type checking across all workspaces
- `bun run dashboard` - Open Convex dashboard
- **Single app**: `bun run --filter <app-name> <command>` (e.g., `bun run --filter web dev`)
- **Tests**: `bun run test` (runs all tests); `bun run --filter scraper test` (single app tests)
- **Single test**: `cd apps/scraper && bun test src/modules/courses/index.test.ts` (uses bun:test)

## Code Style

- **Formatter**: Biome with 2-space indentation, double quotes, auto-organize imports
- **Imports**: Use `@/` for app-relative paths; imports auto-sorted by Biome
- **Types**: TypeScript strict mode; use explicit return types for exported functions
- **Components**: React functional components with intersection types for props (e.g., `React.ComponentProps<"button"> & VariantProps<...>`)
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **CSS**: TailwindCSS v4 with `cn()` utility (`clsx` + `tailwind-merge`) for conditional classes
- **Patterns**: Use `class-variance-authority` (cva) for component variants; `convex-helpers` for auth/data access

## Project Structure

- **Monorepo**: Turbo + Bun package manager; workspaces in `apps/*` and `packages/*`
- **Apps**: `web` (Next.js 15 + Clerk), `browser` (Chrome extension), `scraper` (Cloudflare Worker + Drizzle)
- **Server**: Convex backend in `packages/server` with `protectedQuery`/`protectedMutation` for auth
- **Dependencies**: Use `workspace:*` for internal packages; Doppler for environment variables
- **Database**: Convex for main data; Cloudflare D1 + Drizzle for scraper operations
