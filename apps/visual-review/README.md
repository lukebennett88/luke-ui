# Visual review

A review interface for the visual regression comparison. It shows one pull request's differences,
and lists every open pull request with the state of its report.
[Visual regression testing](../../docs/VISUAL_TESTING.md#visual-review-app) explains how reports are
published and how the app is deployed.

- `/` lists the repository's open pull requests with each one's review status and report counts.
  Pull requests that need review come first. It reads the list from `GET /api/pulls`, or from
  GitHub's public API, without statuses, where the review backend does not answer.
- `/?pr=<number>` reviews one pull request.
- `/?source=local` reviews the comparison in `.artifacts/visual-regression`. Only the development
  server serves it.

A review is one scroll of examples. Captures that differ only by theme, such as
`primary-paper-light` and `primary-tactile-dark`, are one example with a tab per theme. Each example
shows one image at a time, Actual by default, with its differences outlined. The top bar names the
example in view and acts on it: Viewed, stepping through the differences, the View options (image,
layout, zoom, outlines, and the shortcuts switch), and a menu that marks every theme viewed or
copies a link. Contents lists every example with its progress, the filters, Next unviewed, and Mark
all viewed. On a phone the captures run edge to edge, Contents and the View options open as sheets,
and a bottom bar holds Viewed, View, and Review.

A review keeps its state in the query string, so every view is a link: the capture in view and its
zoom, the image (`pane`) or layout (`view=side` or `view=overlay`), the filters, whether viewed
examples are hidden, and whether differences are outlined. Links from before the single-image layout
still open: `view=diff` shows the diff image. Single-key shortcuts are listed in the View options,
which also has a switch that turns them off. That choice is saved in the browser.

Marking a capture viewed folds its example to a labelled row once every theme is viewed, and offers
Undo for a few seconds. Viewed captures are saved in the browser's `localStorage`, per repository
and capture id, with the capture's fingerprint. A capture stays viewed in later commits and other
pull requests while its images are the same. When its images change, it shows as changed since
viewed. A published report's `fingerprint` is a SHA-256 of the expected and actual images. A report
without one, such as a local comparison, falls back to the capture's size and differing pixel count.

The app reads a report over HTTP: `summary.json`, and one PNG per image at
`diff/<capture id>.<expected|actual|diff>.png`. `src/report/schema.ts` validates that contract with
Zod. The app imports nothing from the scripts that write it. `src/review/diff-regions.ts` reads the
diff image's pixels to outline where a capture differs.

The app is built with Luke UI through its public entrypoints. React Aria Components supplies the
tabs, disclosures, menus, popovers, sheets, slider, and note field. Vanilla Extract owns the rest of
the presentation, using the theme's public `vars`. React Aria's `RouterProvider` sends Luke UI
`Link` navigation through the History API, and the app has no router dependency.
[`FRICTION.md`](./FRICTION.md) records the gaps it found.

The app has its own theme: cool neutrals, an indigo accent for actions, selection, and focus, flat
square controls, and the system font, so the chrome stays distinct from the Paper and Tactile
screenshots it frames. The source is `src/theme/input.ts`. A small Vite plugin in `vite.config.ts`
passes it to `defineTheme` from `@luke-ui/react/theme/compiler` and serves the result as
`virtual:visual-review-theme.css`, and `index.html` sets the theme's identity class on `<html>`.
Colour mode follows the system. The few values the theme has no token for, such as the grey stage
behind the screenshots and the red difference outline, are in `src/styles/app-tokens.css.ts`.

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
`src/test/fixtures/report` through the same `?source=local` route. The Review popover and dashboard
tests stub `fetch` for `/api/*`, and serve that report with a `meta` block, and optionally a
fingerprint, as a pull request's.

`pnpm test:visual` writes the comparison that `http://localhost:5175/?source=local` reviews. Set
`VISUAL_REVIEW_LOCAL_DIR` to review a comparison in another directory.

## Reviewing in the app

A pull request's review status sits beside the Review button in the top bar: comparing, needs
review, approved or changes requested by a reviewer, no visual changes, or failed. The Review button
opens a popover, or a full sheet on a phone, that links to the `visual-review` check on GitHub, says
how many captures are viewed, and says when the pull request changes visual testing infrastructure.

Sign in with GitHub from that popover to review. A reviewer with write access can approve, or
request changes with a note of up to 500 characters, and can change an earlier decision. A note
written before approving goes with the approval. Neither decision depends on how much has been
viewed. A decision applies to the comparison on screen. When a newer commit or comparison exists,
the popover says the report is out of date and turns the decisions off until the page reloads.
Someone without write access sees the status only.

The [scheduled sweep](../../docs/VISUAL_TESTING.md#review-check) can occasionally revoke a valid
approval when it races another update. Refresh the page and approve again.

The decisions need the review backend. On the development server the popover says review actions are
only available on the deployed app. A local comparison (`?source=local`) has no pull request, so it
has no Review button. A pull request whose report is missing still shows its status and the Review
button above the message.

## Review backend

`src/worker/` is the backend that records reviews. Reviewers with write access sign in with GitHub
and approve or request changes on a pull request's `visual-review` check run. A decision completes
the check run with a success or failure conclusion, adds a line to its history, and rewrites the
status in the pull request's sticky comment. The comment shows the current decision's note as
literal text and removes it when the status is replaced. The browser app does not import the worker.

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

A review's `state` is `comparing` while a comparison runs, or while a newer comparison is not
recorded yet, and nobody can decide it then. A `clean` record whose check run does not pass is
`comparing` when its title is `Comparing`, and `failed` otherwise. A check run can fail without a
new record, for example when its baseline is replaced. A failed check run is `changes-requested`
only when its record is a review and its title names the reviewer. Any other failed check run is
`failed`. A decision applies only to the latest comparison: the newest `Visual regression` run for
the head commit. Requesting a re-run makes the earlier attempt stale at once. The backend refuses a
decision with `409` and one of these codes, and writes nothing:

- `not-reviewable`: the check run is not a completed comparison with changes to review.
- `stale`: the pull request has a newer commit, or the check run's comparison is not the latest
  comparison or did not succeed.
- `unverified-baseline`: the comparison has no verified baseline run and attempt. Re-run the
  comparison.
- `stale-baseline`: the comparison's baseline run and attempt are not the newest successful
  `Visual baseline` run on `main` from a push or a manual dispatch in this repository. A re-run of
  that baseline also makes it stale. Update the branch, or re-run the comparison.

GitHub has no conditional write for check runs, so the backend checks a decision again after it
writes it. It registers the write and that check with `waitUntil` before the write starts, so a
reviewer who disconnects cannot cancel either.

The backend never writes the check run's `external_id`. Only `Visual review publish` writes it, so
the response to each backend write names the record that the write landed on:

- When the decision's response names another record, a workflow recorded it in between. The backend
  restores that record's conclusion and title, and answers `409 stale`. The summary then says that
  the review app still has the report.
- Otherwise it reads the latest comparison again. When a re-run was requested in between, it
  withdraws the decision: the check run goes back to `Needs review` with the `action_required`
  conclusion, and the backend answers `409 stale`. `Visual review publish` records the re-run
  itself.
- It then reads the newest baseline again, because a replaced baseline changes no record. When the
  baseline is not the one the comparison used, it withdraws the decision and answers
  `409 stale-baseline`.
- When either read fails, it withdraws the decision and answers `502 upstream`.
- When the decision's write fails, the write may still have landed. The backend withdraws the
  decision, restores any newer record that the withdrawal's response names, and answers
  `502 upstream`.

A repair never passes the check, except when it restores a `clean` record. When a repair's own
response names yet another record, the backend restores that record instead. After three attempts it
writes `action_required` for the last record named, which blocks merging, and stops. A repair write
that fails is tried up to three times before the backend answers `502 upstream`. Each repair adds a
line to the check run's history and rewrites the sticky comment's status to match.

GitHub keeps a completed check run completed, so a `Comparing` check run has the `action_required`
conclusion, and its state comes from the `pending` kind in its `external_id`.

The unit tests in `src/worker/` run the request handler against a stubbed `fetch`.
