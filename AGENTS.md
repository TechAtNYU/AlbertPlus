# Agent Guidelines for albert-plus

## Build/Lint/Test Commands

- `bun run dev` - Start all apps in development mode
- `bun run build` - Build all applications
- `bun run check` - Run Biome linting across all workspaces
- `bun run check:fix` - Auto-fix Biome linting issues
- `bun run check:types` - TypeScript type checking across all workspaces
- `bun run dashboard` - Open Convex dashboard
- **Single app**: `bun run --filter <app-name> <command>` (e.g., `bun run --filter web dev`)
- **Tests**: No test suite currently configured in this project

## Code Style

- **Formatter**: Biome with 2-space indentation, double quotes, auto-organize imports
- **Imports**: Use `@/` for app-relative paths; imports auto-sorted by Biome
- **Types**: TypeScript strict mode; use explicit return types for exported functions
- **Components**: React functional components with intersection types for props (e.g., `React.ComponentProps<"button"> & VariantProps<...>`)
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Error Handling**: Leverage TypeScript's type system; avoid throwing errors in query/mutation handlers
- **CSS**: TailwindCSS v4 with `cn()` utility (`clsx` + `tailwind-merge`) for conditional classes
- **Patterns**: Use `class-variance-authority` (cva) for component variants; Convex helpers for auth/data

## Project Structure

- **Monorepo**: Turbo + Bun package manager; workspaces in `apps/*` and `packages/*`
- **Apps**: `web` (Next.js 15 + Clerk), `chrome` (extension), `scraper` (Cloudflare Worker + Drizzle)
- **Server**: Convex backend in `packages/server` with protected queries/mutations
- **Dependencies**: Use `workspace:*` for internal packages; Doppler for environment variables
- **Database**: Convex for main data; Cloudflare D1 + Drizzle for scraper operations

