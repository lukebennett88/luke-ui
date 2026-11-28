# Visual regression testing

Visual cases are `visual`-tagged browser tests. [`TESTING.md`](./TESTING.md) defines what to capture
and comparison policy.

## Baseline

`Visual baseline`, `Visual regression`, and local captures all render in one digest-pinned
Playwright container, so Chromium, OS libraries, and system fonts match. GitHub-hosted
`ubuntu-latest` alone is not stable enough for pixel screenshots.
`.github/visual-playwright/Dockerfile` declares the image once, because its digest pin cannot be
derived from `package.json`. Renovate raises the image and the `playwright` catalog entry in
`pnpm-workspace.yaml` in one `playwright` pull request, and `.github/scripts/visual-local.test.ts`
fails if their versions differ. Turbo's visual tasks pass `PLAYWRIGHT_BROWSERS_PATH` through so
tests use the browsers baked into the image.

`Visual baseline` renders `main` and uploads the `visual-baseline` artefact. A pull request compares
its branch against the artefact of the newest `main` run, downloaded by id. That run must have
succeeded and hold exactly one unexpired `visual-baseline` artefact, or the job fails. A re-run of
`Visual baseline` gives the artefact a new id, so a download of the old id fails rather than
comparing against other files. When the newest run is still queued or in progress,
`visual-ci resolve-baseline` waits for it and fails when the wait times out.

Never fall back to an older successful run. A stale baseline can pass an unchecked change. Re-run
`Visual baseline` on `main` when the baseline is unavailable, and after a rendering-environment
change merges. That change's own comparison can show large intentional diffs.

## Run locally

```sh
pnpm test:visual
```

`pnpm test` includes this authoritative comparison, and `pnpm test:code` skips it. It needs Docker
with `linux/amd64` support, emulated on Apple Silicon, and an authenticated `gh` CLI with access to
repository Actions artefacts. Missing Docker, an unavailable baseline, failed captures, and visual
differences all fail the command. There is no host fallback.

The command uses the same newest successful `main` baseline as CI. It reuses its cached copy only
when the run id and attempt match. The container builds current source and captures fresh
screenshots without host dependencies, build outputs, or task-result caches. Expected, actual, and
diff PNGs plus `summary.json` are written to `.artifacts/visual-regression`.

`pnpm test:visual:capture` captures a local baseline in Docker. The authoritative comparison ignores
it.

For quick, non-authoritative iteration with host Chromium, run the capture on `main`, then compare:

```sh
VISUAL_CAPTURE_DIR=.artifacts/visual-regression/baseline \
  pnpm --filter @luke-ui/react run test:visual:capture
pnpm test:visual:host
```

Host font rendering can differ from CI. Set `VISUAL_BASELINE_DIR` to compare against another local
baseline. Host differences also fail the command.

## Review

Every pull request reports the stable `visual-regression` gate. Rendering is skipped only when every
changed path is in `SAFE_PROSE_PATHS` in `.github/scripts/visual-impact.ts`. Missing diff data or
any other path requires a comparison. `Visual baseline` ignores the same paths, and manual dispatch
always renders.

The gate fails when capture, the baseline, or workflow infrastructure fails. Screenshot differences
do not fail it. The compare job lists each changed, added, and removed capture in its job summary,
adds a warning annotation, and uploads the expected, actual, and diff PNGs as the
`visual-regression-diff` artefact. Check those diffs before you merge.

Approval is the separate `visual-review` check. See [Review check](#review-check) for the branch
protection both need.

## Visual review app

`apps/squint` shows a pull request's screenshot differences and records the reviewer's decision. Its
[README](../apps/squint/README.md) describes its URLs, local review, and backend routes. The app and
every report live in one Cloudflare Pages project that takes direct uploads:

- `Visual review deploy` builds the app from `main` and deploys it to the production branch. A pull
  request cannot change the deployed app.
- `Visual review publish` deploys a pull request's report to
  `https://pr-<number>.<project>.pages.dev`. A report is `summary.json` and the differing captures'
  PNGs. The baseline stays in the `visual-baseline` artefact.

The publisher then records the `visual-review` check run and keeps one pull request comment with the
review status, counts, and a link. A report with no differences is still published, so the app can
tell "no visual changes" from "no report".

### Review check

`visual-review` records whether a commit's visual changes are approved. `visual-regression` records
whether the comparison worked. The visual review GitHub App owns the check run, and each commit has
exactly one:

| Latest comparison                                                     | `visual-review`   | Title                            |
| --------------------------------------------------------------------- | ----------------- | -------------------------------- |
| Not finished                                                          | Cannot pass       | `Comparing`                      |
| No differences, or its `compare` job skipped                          | `success`         | `No visual changes`              |
| Differences, or a change to the visual testing infrastructure         | `action_required` | `Needs review: …`                |
| Ended any other way, or `compare` uploaded no report                  | `failure`         | `Comparison did not finish`      |
| Cancelled                                                             | `failure`         | `Comparison was cancelled`       |
| A report whose baseline is missing or could not be verified           | `failure`         | `Baseline could not be verified` |
| A report whose baseline is no longer the newest `Visual baseline` run | `failure`         | `Baseline is out of date`        |
| `Visual review publish` failed, was cancelled, or never recorded it   | `failure`         | `Publishing the report failed`   |

Only a verified successful comparison can pass. A later comparison of the same commit, such as a
re-run, resets the check run to its new result. A push to `main`, a manual dispatch, or a re-run of
`Visual baseline` replaces the baseline. Re-run the comparison to record a new result, including
after `Publishing the report failed`.

**Branch protection.** Require `visual-regression` and `visual-review`, with the visual review App
as the source of `visual-review` so a same-named status from elsewhere does not count. Require
branches to be up to date, so a new `Visual baseline` run after `main` moves forces a fresh
comparison. The workflow cannot make its own status mandatory. A new commit starts with no check
run, so approval never carries over. While a comparison runs, the pending `visual-regression` gate
blocks merging.

**Infrastructure changes.** A pull request that changes the visual testing infrastructure needs
review even when nothing differs. This makes setup changes visible. It does not stop tampering.
`findInfrastructureChanges` in [`visual-review.ts`](../.github/scripts/visual-review.ts) decides
what counts. Dependency versions, the `pnpm-workspace.yaml` catalogs, and `pnpm-lock.yaml` do not
count.

**Baseline verification.** `Visual regression` records the baseline run, attempt, and artefact id in
`baseline.json`. `Visual review publish` fails the result as `Baseline could not be verified` unless
they name a successful `main` run of `Visual baseline` and its current artefact. A newer attempt or
a newer successful run makes it `Baseline is out of date`.

**Publisher, sweep, and backend.** The header comments of `visual-review-publish.yml` and
`visual-review-sweep.yml`, and the functions in `visual-review.ts`, document the mechanics. Changes
keep these invariants:

- Each event records the commit's latest comparison, the newest `Visual regression` pull request run
  at its newest attempt, never the event's own run. A dropped, duplicated, or late event is
  harmless. The review backend applies the same rule before it accepts a decision.
- A decision on the latest result is never discarded, and an older comparison never replaces a newer
  result.
- Only the publisher writes the check run's external id. The sweep and the backend write only how
  the check run reads: its conclusion, title, summary, and history.
- GitHub has no conditional write, so every writer re-reads before and checks after it writes, and
  fails closed.

`Visual review sweep` only fails check runs. It catches a passing check run that no longer describes
the latest comparison against the newest baseline, and a `Comparing` record left long after the
comparison finished. A sweep that races another update can revoke a valid approval. Refresh the
review page and approve again. Add coordination only if this causes practical problems.

The sweep shares the App credentials, the script on `main`, the `visual-review` environment, and
GitHub Actions with the publisher. When one of them breaks, neither can write, and a pass already
recorded on a commit can survive a later comparison or a replaced baseline. Failed
`Visual review publish` and `Visual review sweep` runs are the signal. A new commit still never
passes without a recorded result.

### Trust boundary

`Visual regression` runs pull request code, so it holds no publishing credentials. Any test can
write files during the comparison, including the screenshots and `summary.json`, so a `clean` result
is the pull request's own claim. The `visual-review` check catches unintended visual changes. Code
review catches deliberate tampering. Review every pull request's changes as code, whatever the check
says. Dependency changes are not infrastructure, and a malicious or broken dependency can alter its
own comparison.

Never check out or run pull request code in `Visual review publish` or `Visual review sweep`.
`Visual review publish` starts from `workflow_run`, runs only the scripts on `main`, and treats the
`visual-regression-diff` artefact as hostile data:

- `visual-review resolve-pr` finds the pull request and comparison through the GitHub API, never
  from the artefact.
- `visual-review prepare` validates `summary.json` and publishes only an allow-list: the PNGs each
  validated capture id implies, checked as regular files with a PNG signature. A report therefore
  cannot add Pages control files such as `_worker.js`.
- Wrangler runs from a directory that `prepare` creates and that must not exist beforehand, so the
  deployment never includes the repository's `functions/` directory or a planted file.
- Once the App token exists, any later failure or cancellation records
  `Publishing the report failed`, so an earlier result or approval never survives it.
- The App token, limited to check runs and pull requests, only reads and writes the check run and
  writes the comment. The workflow token reads everything else.

The two jobs that hold the Cloudflare token pin `cloudflare/wrangler-action` to a commit and
`wranglerVersion` to an exact release. Renovate does not update `wranglerVersion`. Raise it by hand
in both workflows.

### Configuration

`Visual review deploy`, `Visual review publish`, and `Visual review sweep` skip their job until
`VISUAL_REVIEW_PAGES_PROJECT` is set. Until `VISUAL_REVIEW_APP_CLIENT_ID` is set, the publisher
records no check run or comment and the sweep skips its job.

| Setting                                            | Where                                      | Value                                                                                                                              |
| -------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Pages project                                      | Cloudflare                                 | A direct upload project with the production branch `main`                                                                          |
| `VISUAL_REVIEW_PAGES_PROJECT`                      | Repository variable                        | The Pages project's name                                                                                                           |
| `VISUAL_REVIEW_APP_URL`                            | Repository variable, optional              | The app's origin. Defaults to `https://<project>.pages.dev`                                                                        |
| `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` | Secrets of the `visual-review` environment | A token with the account's Cloudflare Pages edit permission, and its account id                                                    |
| Visual review App                                  | GitHub                                     | A GitHub App installed on this repository only, with read and write access to checks and pull requests, and read access to Actions |
| `VISUAL_REVIEW_APP_CLIENT_ID`                      | Repository variable                        | The App's client id                                                                                                                |
| `VISUAL_REVIEW_APP_PRIVATE_KEY`                    | Secret of the `visual-review` environment  | A private key for the App                                                                                                          |

Restrict the `visual-review` environment's deployment branches to `main`, so a workflow edited in a
pull request cannot read the Cloudflare secrets or the App key. The Cloudflare token can edit every
Pages project in its account, because Cloudflare does not scope a token to one project. Nothing
removes a closed pull request's deployments.

### Review backend

The production deployment ships the backend as `dist/client/_worker.js`. Report deployments upload
only the allow-listed report, so they never run it. The backend acts as a GitHub App with these
settings:

- Repository permissions: Checks read and write, Pull requests read and write, Actions read, and
  Metadata read. Actions read lets the backend match a decision to the latest comparison and
  baseline runs.
- Callback URL: `https://luke-ui-visual-review.pages.dev/api/auth/callback`.
- Webhook: inactive.
- Install it on this repository only.

A reviewer signs in through the App's user authorisation flow. The session keeps the immutable
GitHub user id, and every decision asks GitHub for that id's current login and role. Admin,
maintain, or write may decide. A renamed account keeps its access, an account that takes over an old
login gains none, and removed access takes effect at once.

Set these variables as secrets on the Pages project's production environment only. Preview
deployments, including every `pr-<number>` branch, then have no credentials and answer
`503 unconfigured`.

| Variable                   | Value                                                               |
| -------------------------- | ------------------------------------------------------------------- |
| `GITHUB_APP_ID`            | The App's numeric id                                                |
| `GITHUB_APP_CLIENT_ID`     | The App's client id                                                 |
| `GITHUB_APP_CLIENT_SECRET` | A client secret generated for the App                               |
| `GITHUB_APP_PRIVATE_KEY`   | The App's private key, converted to PKCS#8 PEM                      |
| `SESSION_SECRET`           | At least 32 random bytes, for example from `openssl rand -hex 32`   |
| `GITHUB_REPOSITORY`        | The repository's `owner/name`, such as `lukebennett88/luke-ui`      |
| `APP_ORIGIN`               | The app's origin, such as `https://luke-ui-visual-review.pages.dev` |

GitHub issues App private keys as PKCS#1 (`BEGIN RSA PRIVATE KEY`). The Web Crypto API reads only
PKCS#8, so convert the key before you store it:

```sh
openssl pkcs8 -topk8 -nocrypt -in app.private-key.pem -out app.pkcs8.pem
```

The converted file starts with `-----BEGIN PRIVATE KEY-----`. Store the whole file, newlines
included, then delete both key files from your machine. Changing `SESSION_SECRET` signs every
reviewer out.

## Capture helpers

`freezeMotionForCapture` finishes transitions and animations, then applies reduced-motion and
zero-duration overrides. It pins underline colour to `currentColor` and pauses exit animations to
keep overlays mounted. Exit transitions are style-locked so reduced-motion rules cannot cancel them
and unmount an overlay. It resumes only the exit animations it paused and removes its overrides
after capture.

The freeze hides the caret with `caret-color` and stops blinking with `caret-animation`. Forced
colours override the caret colour, so a focused field shows a solid caret in forced-colours
captures. Do not use `forced-color-adjust: none` to hide it.

`captureVisual` cleans up the freeze and parks the pointer outside the viewport. It expands the page
and test iframe for tall scenes. It avoids unnecessary viewport resizes, which can close React Aria
popovers, and refreshes body and HTML locators before capture.

Capture each appearance of the theme matrix with `captureVisualAppearance`:

```tsx
for (const appearance of visualAppearances) {
	test(`theme matrix: ${appearance.theme} ${appearance.mode}`, { tags: ['visual'] }, async () => {
		const { locator } = render(<Button>Continue</Button>, { appearance });

		await captureVisualAppearance(locator, 'button/theme-matrix', appearance);
	});
}
```

For portals, open the component and capture the portal or `document.body`.
