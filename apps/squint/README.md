# Visual review

The visual review app shows a pull request's screenshot differences and records the reviewer's
decision on its `visual-review` check run.
[Visual regression testing](../../docs/VISUAL_TESTING.md#visual-review-app) explains how reports are
published and how the app and its backend are deployed.

- `/` lists the open pull requests with their review status and report counts.
- `/?pr=<number>` reviews one pull request.
- `/?source=local` reviews the comparison in `.artifacts/visual-regression`. Only the development
  server serves it.

## Development

Run these commands from the repository root:

```bash
pnpm test:visual
pnpm run dev:squint
```

`pnpm test:visual` writes the comparison that `http://localhost:5175/?source=local` reviews. Set
`VISUAL_REVIEW_LOCAL_DIR` to review a comparison in another directory. Decisions need the review
backend, so only the deployed app offers them.

Two build-time variables configure a deployment:

- `VITE_VISUAL_REVIEW_DATA_URL_TEMPLATE` is the origin of a pull request's report, with `{pr}`
  standing for its number. Without it, only the local source loads.
- `VITE_VISUAL_REVIEW_REPOSITORY` is the `owner/name` of the GitHub repository. It defaults to
  `lukebennett88/luke-ui`.

## App

Squint is a TanStack Start app in SPA mode. The build prerenders one shell to
`dist/client/index.html`, and the browser renders every view. `src/routes/index.tsx` is the only
route: the query string picks the view, so links in pull request comments keep working. The router
keeps search values as strings, as the app reads them.

The browser tests mount the app on a router of their own, so `vitest.config.ts` leaves out the
TanStack Start plugin. `vite.plugins.ts` holds the plugins both configs share.

## Reports

The app reads a report over HTTP: `summary.json`, and one PNG per image at
`diff/<capture id>.<expected|actual|diff>.png`. `src/report/schema.ts` validates that contract with
Zod. The app imports nothing from the scripts that write it.

The app stores viewed progress only in `localStorage`, keyed by repository and capture id. It
compares the saved fingerprint with the capture's `fingerprint` in `summary.json`. A capture stays
viewed in later commits while its images are the same. The Mark viewed button requires a fingerprint
and is disabled for captures without one, including local comparisons.

## Theme

The app has its own theme, so its chrome stays distinct from the screenshots it frames. A Vite
plugin in `vite.plugins.ts` compiles `src/theme/input.ts` and serves it as
`virtual:visual-review-theme.css`. Values the theme has no token for are in
`src/styles/app-tokens.css.ts`.

## Review backend

`src/worker/` is the backend that records decisions. The build compiles it into
`dist/client/_worker.js`, and `dist/client/_routes.json` sends only `/api/*` to it. The browser app
does not import the worker. Both read the API's shapes from the Zod schemas in
`src/api/contract.ts`.

| Route                               | Purpose                                                |
| ----------------------------------- | ------------------------------------------------------ |
| `GET /api/auth/login?return=<path>` | Starts GitHub sign-in, then returns to the path        |
| `GET /api/auth/callback`            | Finishes sign-in and sets an eight-hour session cookie |
| `POST /api/auth/logout`             | Ends the session                                       |
| `GET /api/session`                  | The signed-in account, and whether it can review       |
| `GET /api/pulls`                    | Open pull requests with their head commit's review     |
| `GET /api/pulls/<number>/review`    | The review of a pull request's head commit             |
| `POST /api/pulls/<number>/decision` | Approves or requests changes on that review            |

A `POST` must send `Content-Type: application/json` and an `Origin` header equal to `APP_ORIGIN`.
Without its configuration, the worker answers every route with `503 unconfigured`.

A decision applies only to the latest comparison for the head commit. The backend refuses it with
`409`, writes nothing, and answers with one of these codes:

- `not-reviewable`: the check run is not a completed comparison with changes to review.
- `stale`: the pull request has a newer commit, or the comparison is not the latest one.
- `unverified-baseline`: the comparison has no verified baseline run. Re-run the comparison.
- `stale-baseline`: a newer `Visual baseline` run on `main` replaced the comparison's baseline.
  Update the branch, or re-run the comparison.

GitHub has no conditional write for check runs, so the backend checks a decision again after it
writes it. When a newer record, a re-run, or a replaced baseline landed in between, it restores that
record or withdraws the decision, and answers `409` or `502 upstream`. A repair never passes the
check, except when it restores a clean record.
