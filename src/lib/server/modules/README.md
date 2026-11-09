# Modules

One folder per business module, named with the domain term from `CONTEXT.md` (`orders`, `invoices`, `bookings`, …). Same shape as the store project.

```
modules/<name>/
├── index.ts               # public interface: the only import path from outside
├── <name>.service.ts      # business rules, permission checks, transactions, AppError
├── <name>.repository.ts   # Drizzle queries only; no rules
├── <name>.schema.ts       # zod input schemas
└── <name>.types.ts        # only when the module has types worth naming
```

Tables live in `src/lib/server/db/schema/<name>.ts` and are re-exported from `db/schema/index.ts`.

## Flow

```
src/routes  (*.remote.ts, +page.server.ts, api/v1/**/+server.ts)   controllers: thin
    → modules/<name>/index.ts
        → <name>.service.ts
            → <name>.repository.ts → Postgres
```

## Rules (keep to these by hand or with a lint rule)

- From outside a module, import only `#lib/server/modules/<name>/index.ts`.
- A repository never imports a service.
- `core/` and `db/` never import a module.
- Only repositories and `db/` import `drizzle-orm`. Services and routes call the module instead.
- Only `db/` imports the Postgres driver (`postgres`) or column types (`drizzle-orm/pg-core`).
- Routes never import `db/`, except `db/health.ts` for the uptime check.
- A query Postgres writes differently from other databases goes in `db/dialect.ts` behind a plain name (`upsert`, `ping`), never inline in a repository.
- `index.ts` exports the service, schema and types. Export the repository only as a namespace when another module truly needs it (`export * as productsRepository from './products.repository.ts'`).

## Tests

`tests/lib/server/modules/<name>/`: `<name>.service.spec.ts`, `<name>.schema.spec.ts`; tests that use the Postgres test database end in `.integration.spec.ts`.
