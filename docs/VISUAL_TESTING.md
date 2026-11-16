# Visual regression testing

Visual cases are `visual`-tagged browser tests. [`TESTING.md`](./TESTING.md) defines what to capture
and comparison policy.

## Baseline

The `Visual baseline` and `Visual regression` workflows render inside the same digest-pinned
Playwright container. The image is declared once in `.github/visual-playwright/Dockerfile`, which
Renovate updates. The `visual-image` reusable workflow reads its `FROM` line, both workflows use
that output, and `PLAYWRIGHT_VISUAL_IMAGE` reads the same file for local captures. That pins
Chromium, OS libraries, and system fonts so baseline and compare share one rendering environment.
GitHub-hosted `ubuntu-latest` alone is not stable enough for pixel screenshots. Both workflows set
`PLAYWRIGHT_BROWSERS_PATH=/ms-playwright`, and Turbo’s visual tasks pass that variable through so
the test process uses the browsers baked into the image.

The `Visual baseline` workflow renders `main` and uploads the `visual-baseline` artefact. Pull
requests download that artefact from the newest `main` run, render their branch, and compare it.
`visual-ci resolve-baseline` finds the run's one unexpired `visual-baseline` artefact, and the
comparison downloads it by id. A re-run of `Visual baseline` replaces the artefact with a new id, so
a download of the old id fails rather than comparing against other files. No artefact, or more than
one, fails the job.

After a rendering-environment change, the first comparison can show large intentional diffs. Once
the change merges, re-run `Visual baseline` on `main`.

The newest run must have succeeded and retain its artefact. Never fall back to an older successful
run: a stale baseline can pass an unchecked change. Re-run `Visual baseline` on `main` when the
baseline is unavailable.

When that newest run is still queued or in progress, `visual-ci resolve-baseline` waits for it
in-process (25 minutes by default, polling every 30 seconds) and logs the run URL. Override the
bound with `VISUAL_BASELINE_WAIT_TIMEOUT_MS` and `VISUAL_BASELINE_WAIT_POLL_MS` if needed. It fails
when the wait times out, or when the newest run fails, is cancelled, or has no usable artefact. It
does not switch to an older green run.

## Run locally

```sh
pnpm test:visual
```

This authoritative comparison also runs as part of `pnpm test`. `pnpm test:code` skips it. It
requires Docker with `linux/amd64` support and an authenticated `gh` CLI with access to repository
Actions artefacts. Apple Silicon uses emulation. Missing Docker, an unavailable baseline, failed
captures, and visual differences all fail the command. There is no host fallback.

The CLI checks the newest `main` baseline workflow run on every comparison. It reuses a cached
baseline only when its run ID and attempt match that successful run and the cache contains PNGs.
Otherwise, it downloads and validates that run's artefact before replacing the local baseline. It
never falls back to an older run. Explicit local captures stay separate from the authoritative
cache.

The container builds current source and captures fresh screenshots without host dependencies, build
outputs, or task-result caches. A Docker volume caches dependency installs.

Expected, actual, and diff PNGs plus `summary.json` are written to `.artifacts/visual-regression`.
`pnpm test:visual:capture` explicitly captures a local baseline in Docker. An authoritative compare
still selects the newest successful `main` workflow artefact rather than accepting that local
replacement. Renovate updates the image in `.github/visual-playwright/Dockerfile`, so CI and local
captures move together. Renovate raises the image and the `playwright` catalog entry in
`pnpm-workspace.yaml` in one `playwright` PR, and a test in `.github/scripts/visual-local.test.ts`
fails if their versions differ. The image stays in the Dockerfile because its digest pin cannot be
derived from `package.json`.

For quick, non-authoritative iteration with host Chromium:

```sh
VISUAL_CAPTURE_DIR=.artifacts/visual-regression/baseline \
  pnpm --filter @luke-ui/react run test:visual:capture
pnpm test:visual:host
```

Run the capture on `main`. Host font rendering can differ from CI. Set `VISUAL_BASELINE_DIR` to
compare against another local baseline. Host differences also fail the command.

## Review

The visual workflow reports its stable `visual-regression` gate on every PR. A native Node and Git
diff check skips rendering only when every changed path is in the finite list of existing prose and
guidance files. Missing diff data and every uncertain path require comparison. The baseline workflow
uses the same paths as `paths-ignore`, so prose-only pushes do not create runs without capture
artefacts. Manual baseline dispatch always renders. Relevant changes require a completed comparison.
The gate fails when comparison or workflow infrastructure fails.

Screenshot differences do not fail the gate. The compare job lists each changed, added, and removed
capture in its job summary and adds a warning annotation to the pull request. It uploads the
expected, actual, and diff PNGs as the `visual-regression-diff` artefact. Check those diffs before
you merge. Capture, baseline, and infrastructure failures still fail the gate.

Configure branch protection to require `visual-regression` and, once the review App is configured,
`visual-review`. See [Review check](#review-check). The workflow cannot make its own status
mandatory in repository settings. `Visual baseline` regenerates the authoritative baseline on `main`
after merge.

## Visual review app

`apps/visual-review` shows a comparison's expected, actual, and diff images in the browser. Its
[README](../apps/visual-review/README.md) describes the interface and its URLs. The app and every
pull request's report live in one Cloudflare Pages project that takes direct uploads:

- The `Visual review deploy` workflow builds the app from `main` and deploys it to the project's
  production branch. A pull request cannot change the deployed app.
- The `Visual review publish` workflow deploys a pull request's report to the `pr-<number>` branch
  of the same project, at `https://pr-<number>.<project>.pages.dev`. A report is `summary.json` and
  the differing captures' PNGs. The baseline stays in the `visual-baseline` artefact.

`Visual review publish` then records the `visual-review` check run for the commit and writes one
comment on the pull request, which it updates on each run. The comment gives the review status and
the counts, and links to the review. A report with no differences is still published, so the app can
tell "no visual changes" from "no report".

To review a local comparison, run `pnpm test:visual`, then `pnpm dev:visual-review`, and open
`http://localhost:5175/?source=local`.

### Review check

The `visual-review` check run records whether a commit's visual changes are approved. It is separate
from `visual-regression`, which reports whether the comparison itself worked. The visual review
GitHub App owns the check run, and each commit has exactly one:

| Latest comparison                                                     | `visual-review`   | Title                            |
| --------------------------------------------------------------------- | ----------------- | -------------------------------- |
| Not finished                                                          | See below         | `Comparing`                      |
| No differences, or its `compare` job skipped                          | `success`         | `No visual changes`              |
| Differences, or a change to the visual testing infrastructure         | `action_required` | `Needs review: …`                |
| Ended any other way, or `compare` uploaded no report                  | `failure`         | `Comparison did not finish`      |
| Cancelled                                                             | `failure`         | `Comparison was cancelled`       |
| A report whose baseline is missing or could not be verified           | `failure`         | `Baseline could not be verified` |
| A report whose baseline is no longer the newest `Visual baseline` run | `failure`         | `Baseline is out of date`        |
| `Visual review publish` failed, was cancelled, or never recorded it   | `failure`         | `Publishing the report failed`   |

`Visual review publish` runs when a `Visual regression` run is requested, starts, or completes, but
it never records the run the event describes. It finds the open pull request whose head is the
event's commit, then reads that commit's latest comparison: the newest `Visual regression` pull
request run for it, at its newest attempt. It records that run's state: `Comparing` while it runs,
and its result once it finishes. A dropped, duplicated, or late event is therefore harmless, because
the next event records the same state. When the check run already records that run and attempt as
`Comparing`, `Needs review`, or `No visual changes`, it writes nothing, so a decision on the latest
result is never discarded. A recorded failure is written again, so the next event retries a failed
publication. The review backend uses the same latest-comparison rule before it accepts a decision.

A re-run raises the attempt as soon as it is requested, so it makes the earlier result stale at
once. GitHub sends no `requested` event for a re-run, so the `in_progress` event also reconciles.

A run skipped comparing only when its `compare` job was skipped. A `compare` job that succeeded but
uploaded no report did not finish. A run that did not succeed and was not cancelled, whatever its
conclusion, is `Comparison did not finish` too. Only a verified successful comparison can pass.

When no check run exists yet, `Comparing` creates one in progress. GitHub ignores a change back to
in progress on a completed check run, so an existing one becomes `action_required` with the title
`Comparing` instead. Either way it cannot pass, and its external id records the `pending` kind that
readers act on. `Comparing` also updates the status of an existing comment, and never creates one.

A pull request that changes the visual testing infrastructure needs a review even when nothing
differs. This makes changes to how the comparison is set up visible to the reviewer. It does not
stop tampering. `findInfrastructureChanges` in
[`visual-review.ts`](../.github/scripts/visual-review.ts) decides which changes count:

- A path in `INFRASTRUCTURE_PATHS` or with a name in `INFRASTRUCTURE_FILE_NAMES`. A renamed file
  counts under its old name too.
- Any `package.json`, unless only `dependencies`, `devDependencies`, `peerDependencies`,
  `optionalDependencies`, or `version` changed. An added or removed file compares against `{}`, and
  a file over 1 MiB or that is not a JSON object always counts.
- `pnpm-workspace.yaml`, unless only its top-level `catalog:` and `catalogs:` blocks changed.
- Every pull request with more files than the GitHub API lists (3,000).

A later comparison run on the same commit, such as a re-run, updates the same check run and resets
it to its new result. The check run's text keeps the commit's history of comparisons and decisions,
up to 50 entries and 60,000 characters. Its external id records the comparison run and attempt, and
the baseline run and attempt it was compared against.

`Visual regression` writes the baseline it downloaded to `baseline.json` in its artefact: the run
id, the run's attempt, and the artefact id. `Visual review publish` checks all three through the
GitHub API when it records the result:

- The run must be a successful, completed `Visual baseline` run, pushed or dispatched on this
  repository's `main`. Otherwise the result is `Baseline could not be verified`.
- The run must still be at the recorded attempt, and its one unexpired `visual-baseline` artefact
  must have the recorded id. A different attempt means a re-run replaced the baseline, which is
  `Baseline is out of date`. The same attempt with another artefact is
  `Baseline could not be verified`.
- That run and attempt must still be the newest successful `Visual baseline` run. Otherwise the
  result is `Baseline is out of date`.

A `baseline.json` that names only the run records no exact baseline, so its result is
`Baseline could not be verified`. A push to `main`, a manual dispatch, or a re-run of
`Visual baseline` replaces the baseline. Re-run the comparison to record a new result.

The `Visual review sweep` workflow covers what the publisher cannot see. It runs when a
`Visual baseline` run completes, whatever its conclusion, every 30 minutes, and on demand. For each
open pull request with a `visual-review` check run, it reads the latest comparison and the newest
baseline:

- A newer comparison than the one recorded that is still running sets the check run to `Comparing`.
- A newer comparison, or the recorded `Comparing` one, that finished at least 30 minutes ago and was
  never recorded fails with `Publishing the report failed`. The 30 minutes leave the publisher time
  to record it.
- A recorded result whose baseline is no longer the newest fails with `Baseline is out of date`. A
  skipped comparison compared nothing, so its baseline never goes out of date.
- A check run that passes on a recorded failure or on `Comparing` is written again as that record. A
  decision can land on a record the publisher or the sweep wrote at the same moment, and the review
  backend's repair of it can fail. A failure is written again as `Publishing the report failed`.

The sweep only invalidates. It never writes a result that can pass, it keeps the check run's
history, and it updates only the status of an existing comment. It reads no artefacts and runs no
pull request code. When every publication of a completed comparison failed, an approval can stay
passing until the first sweep that can create an App token at least 30 minutes after the comparison
finished. A new commit never passes without a recorded result. In a race of milliseconds, the sweep
can replace a result the publisher has just written with a failure. That fails closed, and a re-run
of the comparison fixes it.

A new commit starts with no check run, so an approval never carries over to it. To make approval
block merging, require both `visual-regression` and `visual-review` in branch protection, with the
visual review App as the source of `visual-review`, so a status with the same name from anywhere
else does not count. While a comparison runs, its `visual-regression` gate is pending, so merging is
blocked even before the publisher records `Comparing`. Also require branches to be up to date before
merging. A new `Visual baseline` run on `main` usually means `main` moved, so an up-to-date branch
gets a fresh comparison against the new baseline. A baseline that changes without `main` moving,
through a dispatch or a re-run, is caught when the comparison is recorded or approved, and by the
sweep for a result already recorded.

### Trust boundary

`Visual regression` runs pull request code, so it holds no publishing credentials. Its comparison
runs that code too: any test in a pull request can write files while the comparison runs, including
the screenshots and `summary.json` it reports. A `clean` result is therefore the pull request's own
claim. The `visual-review` check catches unintended visual changes. Code review must catch
deliberate tampering.

`Visual review publish` starts from `workflow_run`, runs only the scripts on `main`, and treats the
`visual-regression-diff` artefact as hostile data:

- `visual-review resolve-pr` finds the pull request from the event's head commit through the GitHub
  API, and records only that commit's latest comparison. It never reads a pull request number or a
  run from the artefact.
- `visual-review prepare` validates `summary.json` and builds the upload from an allow-list: the
  PNGs each validated capture id implies, checked as regular files with a PNG signature. Nothing
  else in the artefact is published, so it cannot add Pages control files such as `_worker.js`.
- `visual-review prepare` refuses a report over 3,000 files, 300 MiB in total, or 20 MiB in one
  image.
- Wrangler runs from a directory that `prepare` creates and that must not exist beforehand, so the
  deployment never includes the repository's `functions/` directory or a file planted beside the
  upload.
- The App token is created first. When any later step fails, or the job is cancelled, the last step
  records `Publishing the report failed`, so a failed resolution, download, preparation, or
  deployment never leaves an earlier result or approval in place. When `resolve-pr` itself failed,
  the failure is recorded only on a commit that already has the check run or is still an open pull
  request's head. A failed publication for an older comparison than a result the check run already
  records is not recorded, so it never replaces that result. When the latest comparison cannot be
  read, the failure is recorded. When the App token cannot be created, nothing is recorded, and the
  sweep fails the result once a token can be created again.
- `visual-review review` writes the check run and the comment with a token for the visual review
  App, limited to check runs and pull requests. `resolve-pr` uses the same token to read the check
  run. Everything else, such as the runs, jobs, changed files, and their `package.json` and
  `pnpm-workspace.yaml` contents, is read with the workflow token.

The two jobs that hold the Cloudflare token pin `cloudflare/wrangler-action` to a commit and
`wranglerVersion` to an exact release. Renovate does not update `wranglerVersion`. Raise it by hand
in both workflows.

Review every pull request's changes as code, whatever the check says. Dependency changes are not
infrastructure: a pull request that only changes dependency ranges, the catalog, or `pnpm-lock.yaml`
can pass with no visual differences, and a malicious or broken dependency could still alter its own
comparison.

Never check out or run pull request code in `Visual review publish` or `Visual review sweep`.

### Configuration

`Visual review deploy`, `Visual review publish`, and `Visual review sweep` skip their job until
`VISUAL_REVIEW_PAGES_PROJECT` is set.

| Setting                                            | Where                                      | Value                                                                                                                              |
| -------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Pages project                                      | Cloudflare                                 | A direct upload project with the production branch `main`                                                                          |
| `VISUAL_REVIEW_PAGES_PROJECT`                      | Repository variable                        | The Pages project's name                                                                                                           |
| `VISUAL_REVIEW_APP_URL`                            | Repository variable, optional              | The app's origin. Defaults to `https://<project>.pages.dev`                                                                        |
| `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` | Secrets of the `visual-review` environment | A token with the account's Cloudflare Pages edit permission, and its account id                                                    |
| Visual review App                                  | GitHub                                     | A GitHub App installed on this repository only, with read and write access to checks and pull requests, and read access to Actions |
| `VISUAL_REVIEW_APP_CLIENT_ID`                      | Repository variable                        | The App's client id                                                                                                                |
| `VISUAL_REVIEW_APP_PRIVATE_KEY`                    | Secret of the `visual-review` environment  | A private key for the App                                                                                                          |

`Visual review publish` records no check run and writes no comment until
`VISUAL_REVIEW_APP_CLIENT_ID` is set. `Visual review sweep` skips its job until then.

Restrict the `visual-review` environment's deployment branches to `main`. A workflow edited in a
pull request then cannot read the Cloudflare secrets or the App key. The Cloudflare token can edit
every Pages project in its account, because Cloudflare does not scope a token to one project.

Cloudflare keeps a closed pull request's deployments. Nothing removes them.

## Capture freeze

`freezeMotionForCapture` finishes transitions and animations before applying reduced-motion and
zero-duration overrides. It pins underline colour to `currentColor` and pauses exit animations to
keep overlays mounted. It resumes only the exit animations it paused, leaving previously paused
animations paused, and removes its overrides after capture.

Exit transitions are style-locked during capture so reduced-motion rules cannot cancel them and
unmount an overlay before the screenshot.

The freeze hides the caret with `caret-color` and disables blinking with `caret-animation`. Forced
colours override the caret colour but not the animation setting, so a focused field shows a solid
caret in forced-colours captures. Do not use `forced-color-adjust: none` to hide it.

Browser setup loads Inter before rendering. `captureVisual` waits for the font, cleans up the motion
freeze, and parks the pointer outside the viewport. It avoids unnecessary viewport resizes, which
can close React Aria popovers, and refreshes body and HTML locators before capture.

## Tall scenes

`captureVisual` expands the page and test iframe before capturing tall scenes.

## Theme matrix

Capture each appearance with `captureVisualAppearance`:

```tsx
for (const appearance of visualAppearances) {
	test(`theme matrix: ${appearance.theme} ${appearance.mode}`, { tags: ['visual'] }, async () => {
		const { locator } = render(<Button>Continue</Button>, { appearance });

		await captureVisualAppearance(locator, 'button/theme-matrix', appearance);
	});
}
```

For portals, open the component and capture the portal or `document.body`.
