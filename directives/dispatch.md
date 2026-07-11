---
name: dispatch-app
description: DPI Dispatch webapp — organize daily driver/vehicle dispatch (requestor, dispatcher, driver roles) with history + CSV export. Use when working on the dispatch tool, its schema, or deployment.
scripts:
  - prisma/seed.js
  - app/api/requests/route.js
  - app/api/assign/route.js
  - app/api/recurring/generate/route.js
---

# DPI Dispatch — operating notes

Self-contained Next.js 15 + Prisma + Postgres app in this folder. See `README.md` for run/deploy.
Not part of the 3-layer directive/execution system — it's a standalone webapp.

## What it does
Replaces the old Airtable→Sheet→Viber dispatch flow. Requestors submit ride requests (no login),
the dispatcher assigns driver+vehicle+time (with double-booking warnings) and shares the day to
drivers over Viber, drivers see a personal schedule with map links and mark trips Start/Done.
History is searchable and exports to CSV.

## Architecture
- **Data model**: `prisma/schema.prisma`. `DispatchRequest` holds both the request and its
  assignment; a driver's "trip list" is derived (requests where driverId + serviceDate match).
- **Dates**: handled as `YYYY-MM-DD` strings everywhere, stored at UTC midnight (`lib/dates.js`) —
  no timezone drift. Never rely on the server's "today"; the client passes its local date.
- **Conflict detection**: `lib/conflicts.js` (time-window overlap). `/api/assign` returns HTTP 409
  with the clashing trips when unforced; the UI re-submits with `force:true` to override.
- **Admin gate**: shared passcode (`ADMIN_PASSCODE`). `/dispatch` + master-data mutations require
  the `x-admin-passcode` header (`lib/admin.js`); requestor/driver actions are open.
- **Recurring trips**: `RecurringTemplate` rows are materialized into requests by
  `POST /api/recurring/generate` (idempotent per date+template) — the board's "+ Standing trips" button.

## Common tasks
- Change the roster/vehicles/standing trips: use `/dispatch/manage`, or edit `prisma/seed.js` and
  re-run `npm run db:seed` (upserts, safe to re-run).
- Schema change: edit `schema.prisma` → `npx prisma migrate dev --name <change>`.
- Add a request type or status: `lib/constants.js` + the `RequestType`/`RequestStatus` enums in the schema.

## Deploy
Netlify (Enzo's paid account). `netlify init` → `netlify db init` (provisions Neon, sets
`NETLIFY_DATABASE_URL` + `NETLIFY_DATABASE_URL_UNPOOLED`). In the dashboard set
`DATABASE_URL`=pooled, `DIRECT_URL`=unpooled, plus `ADMIN_PASSCODE` + `NEXT_PUBLIC_BASE_URL`.
Then `npx prisma migrate deploy` once → `netlify deploy --build --prod`. See README for the table.
