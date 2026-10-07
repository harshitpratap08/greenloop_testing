# GreenLoop

GreenLoop connects construction and demolition material providers with receivers who have suitable capacity. The application includes a public site, provider and receiver workspaces, matching and reservation workflows, booking and delivery tracking, evidence-backed material passports, and load verification.

## Architecture

- `frontend/` — React 19, TypeScript, Vite 8, Tailwind CSS 4, client routing, UI state, and static assets.
- `backend/` — Node 24 HTTP API, authentication, validation, SQLite access, workflow actions, and integration tests.
- `shared/domain/` — pure GreenLoop domain types, matching and capacity rules, and metrics used by the frontend and backend.
- `scripts/` — development process runner and HTTP/runtime audit utilities.
- `docs/audits/` — retained baseline audit reports.

Frontend and backend are npm workspaces with one root lockfile. The API uses Node's built-in HTTP and SQLite modules; it has no third-party runtime dependencies. Backend responsibilities currently live in `backend/src/app.mjs` and `backend/src/actions.ts`; `backend/src/server.mjs` handles process startup. The API implementation stays cohesive to preserve its existing endpoint and transaction behavior.

## Requirements and setup

- Node.js 24 or newer
- npm

From this directory, install the locked workspace dependencies and make a local environment file:

```powershell
npm.cmd ci
Copy-Item .env.example .env
```

The application runs locally without external credentials. Configure Google OAuth or email webhook values in `.env` only if you need those integrations. Never commit `.env` or add credentials to `.env.example`.

## Run locally

```powershell
npm.cmd run dev
```

The combined development command starts Vite at `http://localhost:5173` and the API at `http://localhost:3001`. The API creates its SQLite database at `server/data/greenloop.sqlite`; this existing location is retained to preserve application data. Back up the database using SQLite-aware tools or while the API is stopped, and keep its directory on persistent storage.

To run either application separately:

```powershell
npm.cmd run dev:frontend
npm.cmd run dev:backend
```

## Main workflows

Create an account, complete onboarding, and choose provider, receiver, or both workspaces. For an end-to-end exchange, use two accounts in separate browser profiles:

1. A receiver creates capacity and publishes a dated material request.
2. A provider creates a project and material passport, attaches evidence, and offers suitable material.
3. The receiver reviews the offer or booking request. Requests beyond available capacity remain on hold.
4. The provider dispatches a confirmed booking.
5. The receiver records the arrival weight and accepts or rejects the measured quantity. Rejected quantities require a reason.
6. Both parties can review the verification and reports.

## Build and checks

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd run check:backend
npm.cmd run test:backend
```

`npm.cmd start` serves the production frontend and API together. For deployment, set `NODE_ENV=production`, configure an HTTPS `PUBLIC_ORIGIN`, run behind a reverse proxy, and keep `server/data/` on persistent storage. `vite preview` does not provide the API. See [backend documentation](./backend/README.md), the [environment template](./.env.example), and the archived [baseline audit](./docs/audits/architecture-audit-baseline.md).
