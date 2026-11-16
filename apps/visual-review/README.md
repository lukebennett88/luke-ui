# Visual review

A review interface for the visual regression comparison. It shows one pull request's differences,
and lists every open pull request with the state of its report.
[Visual regression testing](../../docs/VISUAL_TESTING.md#visual-review-app) explains how reports are
published and how the app is deployed.

- `/` lists the repository's open pull requests from GitHub's public API and loads each one's
  report.
- `/?pr=<number>` reviews one pull request.
- `/?source=local` reviews the comparison in `.artifacts/visual-regression`. Only the development
  server serves it.

A review keeps its state in the query string, so every view is a link: the selected capture, the
view (`side`, `overlay`, or `diff`), the zoom, the filter, and whether differences are outlined. The
sidebar lists the single-key shortcuts and has a checkbox that turns them off. That choice is saved
in the browser.

The app reads a report over HTTP: `summary.json`, and one PNG per image at
`diff/<capture id>.<expected|actual|diff>.png`. `src/report/schema.ts` validates that contract with
Zod. The app imports nothing from the scripts that write it. `src/review/diff-regions.ts` reads the
diff image's pixels to outline where a capture differs.

The app is built with Luke UI through its public entrypoints and the Tactile theme. React Aria's
`RouterProvider` sends Luke UI `Link` navigation through the History API, and the app has no router
dependency. [`FRICTION.md`](./FRICTION.md) records the gaps it found.

Two build-time variables configure a deployment:

- `VITE_VISUAL_REVIEW_DATA_URL_TEMPLATE` is the origin of a pull request's report, with `{pr}`
  standing for its number. Without it, only the local source loads.
- `VITE_VISUAL_REVIEW_REPOSITORY` is the `owner/name` of the GitHub repository. It defaults to
  `lukebennett88/luke-ui`.

Run commands from the repository root:

```bash
pnpm test:visual
pnpm run dev:visual-review
pnpm exec turbo run test --filter=visual-review
pnpm run check
```

The browser tests in `src/review/review.browser.test.tsx` review the small report in
`src/test/fixtures/report` through the same `?source=local` route.

`pnpm test:visual` writes the comparison that `http://localhost:5175/?source=local` reviews. Set
`VISUAL_REVIEW_LOCAL_DIR` to review a comparison in another directory.

## Review backend

`src/worker/` is the backend that records reviews. Reviewers with write access sign in with GitHub
and approve or request changes on a pull request's `visual-review` check run. A decision completes
the check run with a success or failure conclusion, adds a line to its history, and rewrites the
status in the pull request's sticky comment. The browser app does not import the worker.

The build compiles the worker into `dist/_worker.js`, one ES module with its dependencies bundled,
and writes `dist/_routes.json`, which sends only `/api/*` to it. Cloudflare Pages runs it as Pages
Functions in advanced mode. `vite.worker.config.ts` holds that build and fails it if the worker
would import anything at runtime.

| Route                               | Purpose                                                         |
| ----------------------------------- | --------------------------------------------------------------- |
| `GET /api/auth/login?return=<path>` | Starts GitHub sign-in, then returns to the path                 |
| `GET /api/auth/callback`            | Finishes sign-in and sets an eight-hour session cookie          |
| `POST /api/auth/logout`             | Ends the session                                                |
| `GET /api/session`                  | The signed-in account, and whether it can review                |
| `GET /api/pulls`                    | Open pull requests with their head commit's review, cached 30 s |
| `GET /api/pulls/<number>/review`    | The review of a pull request's head commit                      |
| `POST /api/pulls/<number>/decision` | Approves or requests changes on that review                     |

A `POST` must send `Content-Type: application/json` and an `Origin` header equal to `APP_ORIGIN`.
Report deployments on `pr-<number>` subdomains are same-site with the app, so the session cookie's
`SameSite` setting alone does not block them. Without its configuration, the worker answers every
route with `503 unconfigured`.
[Visual regression testing](../../docs/VISUAL_TESTING.md#review-backend) lists the GitHub App and
Pages settings.

A review's `state` is `comparing` while a comparison runs, and nobody can decide it then. A decision
applies only to the latest comparison: the newest `Visual regression` run for the head commit.
Requesting a re-run makes the earlier attempt stale at once. The backend refuses a decision with
`409` and one of these codes, and writes nothing:

- `not-reviewable`: the check run is not a completed comparison with changes to review.
- `stale`: the pull request has a newer commit, or the check run's comparison is not the latest
  comparison or did not succeed.
- `unverified-baseline`: the comparison has no verified baseline run and attempt. Re-run the
  comparison.
- `stale-baseline`: the comparison's baseline run and attempt are not the newest successful
  `Visual baseline` run on `main` from a push or a manual dispatch in this repository. A re-run of
  that baseline also makes it stale. Update the branch, or re-run the comparison.

GitHub has no conditional write for check runs, so the backend checks a decision again after it
writes it, and keeps that check running through `waitUntil` if the reviewer disconnects:

- When the write's response shows that the publish workflow changed the check run's `external_id` in
  between, the backend sets the check run back to `Comparing` for the comparison it names and
  answers `409 stale`.
- Otherwise it reads the latest comparison again. When a re-run was requested in between, it sets
  the check run back to `Comparing` for the newer run and answers `409 stale`.
- When that read fails, it sets the check run back to `Needs review` and answers `502 upstream`.

GitHub keeps a completed check run completed, so a `Comparing` check run has the `action_required`
conclusion, and its state comes from the `pending` kind in its `external_id`.

The unit tests in `src/worker/` run the request handler against a stubbed `fetch`.
