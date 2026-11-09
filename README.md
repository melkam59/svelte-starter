# svelte-starter

**Stack:** SvelteKit 3 + Svelte 5 (runes, remote functions), Tailwind 4 + shadcn-svelte + Phosphor icons,
better-auth, Drizzle + Postgres, Paraglide (English + Amharic), zod, pino, Vitest + Playwright,
oxlint + oxfmt, lefthook + commitlint, adapter-node + Docker.

## Features

- Email/password sign-in with account lockout and rate limits, sign-out
- Members with Roles and Permissions (Owner / Admin / Member), checked by every `procedure`
- App shell: sidebar, header, user menu (theme, language, sign out)
- Server core: typed `AppError` → one error shape for every screen, request ids, JSON logs,
  `/api/health`, `/api/metrics`, cursor paging
- Activity log (who did what), Postgres-backed rate limits
- Unit, component, integration (real Postgres) and e2e test setup

<!-- starter:start -->
## Use this starter

You need Node 24+, pnpm and Docker.

Click **Use this template** on GitHub, or copy it without git history:

```sh
pnpm dlx degit melkam59/svelte-starter my-app
cd my-app
git init
```

Then rename the project: `"name"` in `package.json`, and `APP_NAME` / `SERVICE_NAME` in `.env.example`.

The `example` module (notes) shows every convention. Copy it for your first feature, then delete it:
`src/lib/server/modules/example`, `src/lib/server/db/schema/example.ts`, `src/routes/app/example` and its nav entry.

Optional:

- **Public sign-up:** set `disableSignUp: false` in `src/lib/server/auth.ts` and add a sign-up page.
- **English only:** remove `am` from `project.inlang/settings.json` and delete `messages/am.json`.
<!-- starter:end -->

## Run locally

```sh
pnpm install
cp .env.example .env              # fill BETTER_AUTH_SECRET: openssl rand -base64 32
pnpm db:up                        # Postgres in Docker
pnpm db:generate                  # first migration from the schema
pnpm db:migrate && pnpm db:seed   # demo accounts, password 12345678
pnpm dev
```

Sign in at `/sign-in` as `owner@demo.com`, `admin@demo.com` or `member@demo.com`.

## Add a feature

1. Table in `src/lib/server/db/schema/<name>.ts`, exported from `schema/index.ts` → `pnpm db:generate`
2. Module in `src/lib/server/modules/<name>` (repository → service → schema → index)
3. New Permissions in `src/lib/shared/permissions.ts`
4. Screen in `src/routes/app/<name>/`, remote functions in `<name>.remote.ts`, nav entry in `src/routes/app/nav.ts`
5. Messages in `messages/en.json` + `messages/am.json`
6. Tests in `tests/` mirroring `src/`

Rules are in `AGENTS.md` and `src/lib/server/modules/README.md`.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` / `build` / `preview` | Vite dev server / production build / preview |
| `pnpm check` | svelte-check + TypeScript |
| `pnpm lint` / `format` | oxlint / oxfmt |
| `pnpm test:unit` | Vitest (server + browser components) |
| `pnpm test:integration` | Vitest against `<db>_test` in Postgres |
| `pnpm test:e2e` | Playwright |
| `pnpm db:up` / `db:down` | Local Postgres in Docker |
| `pnpm db:generate` / `db:migrate` / `db:studio` / `db:seed` | Drizzle |
| `pnpm auth:schema` | Regenerate better-auth tables after adding a plugin |

## Deploy (any Docker host, e.g. Dokploy)

`Dockerfile` builds the adapter-node server and runs migrations on start. Set `DATABASE_URL`, `ORIGIN`,
`BETTER_AUTH_SECRET` and `APP_NAME` in the environment. Health check: `GET /api/health`.
