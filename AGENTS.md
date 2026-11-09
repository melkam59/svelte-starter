## Project Configuration

- **Language**: TypeScript
- **Package Manager**: pnpm
- **Add-ons**: oxlint, oxfmt, vitest, playwright, tailwindcss, enhanced-img, sveltekit-adapter, drizzle (Postgres), better-auth, paraglide, ai-tools, experimental

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

---

## Product docs

- `PRODUCT.md`: what the product is (write it first). `CONTEXT.md`: the domain glossary; use its terms in code, tests and tickets.
- Decisions go in `docs/adr/NNNN-title.md`.

## Core and tests

- **Modules** (`src/lib/server/modules/<name>/`): `<name>.service.ts`, `<name>.repository.ts`, `<name>.schema.ts`, optional `<name>.types.ts`, and `index.ts`, the only import path. Tables in `src/lib/server/db/schema/<name>.ts`. Copy `modules/example` to start a new one. Controllers (`*.remote.ts`, `+page.server.ts`, `api/v1/**/+server.ts`) stay in `src/routes` and call `index.ts`. See `src/lib/server/modules/README.md`.
- **Procedures** (`modules/members/members.procedure.ts`): every server action is `procedure(name, { access, input, run })`. `access` is `'anyone' | 'signed-in' | 'owner' | <PermissionCode>`. Screens reach procedures through `asQuery` / `asCommand` / `asForm` in `src/lib/server/remote-functions.ts`; tests call them with `callerAs()` from `tests/support/callers.ts`.
- **Permissions** live in `src/lib/shared/permissions.ts`. Add codes there and grant them in `startingRoles`; the seed and every test sync them to the database.
- **Server core** (`src/lib/server/core/`): `config` (env, validated by `src/env.ts`), `errors` (`AppError` and helpers), `handle-error`, `logger` (pino), `request` (request id, access log, security headers), `metrics` (`/api/metrics`, bearer `METRICS_TOKEN`), `health` (`/api/health`), `http`, `list` (cursor paging). Import through `#lib/server/core/index.ts`.
- **Database** is Postgres via Drizzle (`postgres` driver). Postgres-specific SQL goes in `src/lib/server/db/dialect.ts`. Ids are UUID v7 made with `newId()` from `#lib/shared/ids.ts`; use `insertOnce` and `updateVersioned` from `db/writes.ts`.
- **Error contract** (`src/lib/shared/errors.ts`): every error the client sees is `{ message, code, messageKey, params?, fieldErrors?, requestId? }`. Throw `AppError` on the server; screens call `errorMessage(e)` / `fieldMessages(e, field)`.
- **i18n**: Paraglide, messages in `messages/en.json` and `messages/am.json`. Every user-facing string is a message; `tests/messages/messages.spec.ts` keeps both files complete.
- **Icons:** Phosphor only (`phosphor-svelte`). Swap the lucide icons shadcn-svelte adds.
- **Comments:** a plain-language doc comment on every export saying what it does.
- **Tests** live in `tests/`, mirroring `src/`. The suffix picks the runner:
  - `*.spec.ts`: unit, Vitest `server` project (Node)
  - `*.svelte.spec.ts`: component, Vitest `client` project (browser)
  - `*.integration.spec.ts`: real Postgres (`<db>_test`), run one file at a time
  - `*.e2e.ts`: Playwright against the production build

## Agent skills

Project skills live in `.claude/skills/` (some are symlinks into `.agents/skills/`). Workflow per feature: `grilling` → `to-spec` → `to-tickets` → `tdd`; UI with `calm-ui` + shadcn-svelte, then `impeccable` and `better-interface`, then `break-ui`.
