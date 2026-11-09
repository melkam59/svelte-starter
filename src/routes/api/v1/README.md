# /api/v1

Versioned JSON endpoints (`+server.ts`) for callers outside the page bundle: the phone scanner, file uploads and downloads, integrations. Screens use remote functions (`*.remote.ts`) instead; those ship with the pages and are not versioned.

- Path: `src/routes/api/v1/<module>/…/+server.ts`, named with the module's glossary term (`/api/v1/products`, `/api/v1/scanner/scans`).
- Controllers stay thin: `parseJson` / `parseQuery` from `#lib/server/core`, call `#lib/server/modules/<name>/index.ts`, return `ok` / `created` / `noContent`.
- Errors: throw `AppError`; the client always gets an `ErrorBody` (`{ code, messageKey, params?, fieldErrors?, requestId }`). Unknown paths under `/api` return a JSON 404 from `api/[...path]`.
- A breaking change to a request or response shape goes in `/api/v2/…`; `v1` keeps working until its callers move.

Ops endpoints stay unversioned: `/api/health` (spec 16), `/api/metrics`, `/api/cron`.
