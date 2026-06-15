# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Bopacorp CRM — frontend SPA for managing negotiations, catalogs, documentation, reports, and employability. React 19 + TypeScript + Vite + Tailwind CSS v4. No test framework configured yet.

## Commands

```bash
npm run dev          # Start dev server (Vite)
npm run build        # Typecheck + build (tsc -b && vite build)
npm run check        # Lint + format + typecheck (biome check --write . && tsc -b --noEmit)
npm run lint         # Lint only (biome check .)
npm run lint:fix     # Lint + auto-fix (biome check --write .)
npm run format       # Format only (biome format --write .)
```

CI runs `npm run check` then `npm run build` on push/PR to main.

## Setup

Requires `.npmrc` with GitHub Packages auth for `@bopacorp` scope (see `.npmrc.example`). Requires `.env` with `VITE_API_URL` pointing to backend API including path (e.g. `http://localhost:3000/api/v1`).

## Architecture

- **`src/app/`** — Shell: `MainLayout` (shadcn SidebarProvider + SidebarInset + breadcrumb + outlet), `AppSidebar` (shadcn Sidebar primitive)
- **`src/modules/<domain>/`** — Feature modules (auth, catalog, negotiations, employability, etc.). Each has `pages/`, some have `components/` and `context/`
- **`src/services/`** — Axios client (`api.ts`) with JWT auth, proactive token refresh, and 401 retry queue. `auth-storage.ts` for localStorage token management
- **`src/shared/ui/`** — Reusable business components (EntityTable, FilterBar, KpiCard, StateBadge, etc.), barrel-exported from `index.ts`
- **`src/components/ui/`** — shadcn/ui primitives (radix-nova style). Excluded from Biome linting
- **`src/App.tsx`** — All routes defined here. Routes use Spanish paths (`/negociaciones`, `/catalogo`, `/empleabilidad/...`). All protected routes wrapped in `<RequireAuth>`

## Key patterns

- **Path alias**: `@/` maps to `src/` (configured in vite.config.ts and tsconfig)
- **Auth flow**: JWT tokens in localStorage. `AuthProvider` context listens to `bopacorp:token-refreshed` custom event and `storage` event. API layer handles refresh automatically
- **API responses**: Backend returns `{ success, data, error: { code, message } }`. Use `request<T>()` from `services/api.ts` for typed unwrapping
- **Styling**: Tailwind v4 with CSS variables for theming. Inter variable font. No tailwind.config — config lives in `src/index.css`

## Linting (Biome)

- Single quotes, semicolons, trailing commas, LF line endings, 100 char line width
- `noUnusedVariables` and `noUnusedImports` are errors
- `noExplicitAny` is error
- Commits go through lint-staged (husky) running `biome check --write` on staged TS/TSX/JS/JSX files
- Commit messages enforced by commitlint (Conventional Commits)

## Design system

Full spec in `DESIGN.md` (preset b0, shared with CMS). Key rules:

- **Semantic tokens only** — `bg-primary`, `text-muted-foreground`. Never raw Tailwind colors (`bg-blue-500`)
- **No `dark:` overrides** — tokens flip via `.dark` CSS variables
- **Clickable text links** — `text-foreground font-medium hover:underline`, NOT `text-primary`. Blue `text-primary` is harsh in dark mode; reserve it for buttons and badges
- **`gap-*`** not `space-y-*`. **`size-*`** not `w-X h-X`
- **Forms**: `FieldGroup` + `Field` + `FieldLabel`, never raw `<div>` + `<Label>`
- **Icons**: lucide-react, use `data-icon` attribute in buttons
- **Overlays**: `Dialog`/`Sheet`/`Drawer` must have a Title (use `sr-only` if hidden)
- **`cn()`** for conditional classes, never string-interpolate ternaries
- **`@bopacorp/shared`** for all API types and Zod schemas
- **Spanish UI labels, English code** — component names, variables, functions in English
- **View persistence** — save user view preferences (table/kanban) in localStorage

## Kanban board patterns

- **Per-column fetching** — each column makes independent `useNegotiations` call with its own state filter. Backend caps at limit 100; per-column pagination avoids hitting it
- **Column styling** — `bg-muted/70 rounded-lg` for visible lanes in dark mode. Cards use `bg-popover ring-1 ring-border shadow-sm` for elevation
- **Drag-and-drop** — `@hello-pangea/dnd` (react-beautiful-dnd fork). DragDropContext → Droppable (state.id) → Draggable (negotiation.id)
- **State change on drop** — reuse `ChangeStateDialog` with locked `targetStateId` prop. When set, shows read-only target instead of dropdown
- **Items accumulation** — page 1 replaces items, page 2+ appends. Use `prevPageRef` pattern to avoid duplicate appends on re-renders
- **Relative time** — use `formatRelativeTime` from `@/lib/format.js` (date-fns `formatDistanceToNow` with `es` locale). Never define inline `timeAgo` helpers

## Docs

Implementation phases: `docs/00-phases-index.md` through `docs/08-notifications-polish.md`
