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
requests download the newest `main` run, render their branch, and compare it.

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

Configure branch protection to require `visual-regression`. The workflow cannot make its own status
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

| Comparison                                                    | `visual-review` conclusion |
| ------------------------------------------------------------- | -------------------------- |
| No differences, or skipped because nothing visual changed     | `success`                  |
| Differences, or a change to the visual testing infrastructure | `action_required`          |
| Did not finish                                                | `failure`                  |
| Cancelled, usually because a newer push superseded it         | Unchanged                  |

A pull request that changes the files in `INFRASTRUCTURE_PATHS` in
[`visual-review.ts`](../.github/scripts/visual-review.ts) needs a review even when nothing differs,
because those files decide how its own comparison runs.

A later comparison run on the same commit, such as a re-run, updates the same check run and resets
it to its new result. The check run's text keeps the commit's history of comparisons and decisions.
Its external id records the comparison run and the baseline run it was compared against.
`Visual regression` writes the baseline run id to `baseline.json` in its artefact, and
`Visual review publish` confirms through the GitHub API that the id names a successful
`Visual baseline` run on `main` before recording its commit. An unconfirmed baseline is recorded as
unverified.

A new commit starts with no check run, so an approval never carries over to it. To make approval
block merging, require `visual-review` in branch protection with the visual review App as its
source, so a status with the same name from anywhere else does not count. Also require branches to
be up to date before merging: the baseline only changes when `main` does, so an up-to-date branch is
always compared against the current baseline.

### Trust boundary

`Visual regression` runs pull request code, so it holds no publishing credentials.
`Visual review publish` starts from `workflow_run`, runs only the scripts on `main`, and treats the
`visual-regression-diff` artefact as hostile data:

- `visual-review resolve-pr` finds the pull request from the run's head commit through the GitHub
  API. It publishes only when that commit is still the pull request's head, and never reads a pull
  request number from the artefact.
- `visual-review prepare` validates `summary.json` and builds the upload from an allow-list: the
  PNGs each validated capture id implies, checked as regular files with a PNG signature. Nothing
  else in the artefact is published, so it cannot add Pages control files such as `_worker.js`.
- `visual-review prepare` refuses a report over 3,000 files, 300 MiB in total, or 20 MiB in one
  image.
- Wrangler runs from a directory that `prepare` creates and that must not exist beforehand, so the
  deployment never includes the repository's `functions/` directory or a file planted beside the
  upload.
- `visual-review review` writes the check run and the comment with a token for the visual review
  App, limited to check runs and pull requests. It reads the pull request's changed files and the
  baseline run with the workflow token.

The two jobs that hold the Cloudflare token pin `cloudflare/wrangler-action` to a commit and
`wranglerVersion` to an exact release. Renovate does not update `wranglerVersion`. Raise it by hand
in both workflows.

A pull request controls its own comparison, so its report and comment describe what that pull
request chose to publish. A pull request that changes the visual testing infrastructure always needs
a review for that reason. Review those changes as code, too.

Never check out or run pull request code in `Visual review publish`.

### Configuration

Both workflows skip their job until `VISUAL_REVIEW_PAGES_PROJECT` is set.

| Setting                                            | Where                                      | Value                                                                                                  |
| -------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Pages project                                      | Cloudflare                                 | A direct upload project with the production branch `main`                                              |
| `VISUAL_REVIEW_PAGES_PROJECT`                      | Repository variable                        | The Pages project's name                                                                               |
| `VISUAL_REVIEW_APP_URL`                            | Repository variable, optional              | The app's origin. Defaults to `https://<project>.pages.dev`                                            |
| `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` | Secrets of the `visual-review` environment | A token with the account's Cloudflare Pages edit permission, and its account id                        |
| Visual review App                                  | GitHub                                     | A GitHub App installed on this repository only, with read and write access to checks and pull requests |
| `VISUAL_REVIEW_APP_CLIENT_ID`                      | Repository variable                        | The App's client id                                                                                    |
| `VISUAL_REVIEW_APP_PRIVATE_KEY`                    | Secret of the `visual-review` environment  | A private key for the App                                                                              |

`Visual review publish` records no check run and writes no comment until
`VISUAL_REVIEW_APP_CLIENT_ID` is set.

Restrict the `visual-review` environment's deployment branches to `main`. A workflow edited in a
pull request then cannot read the Cloudflare secrets. The token can edit every Pages project in its
account, because Cloudflare does not scope a token to one project.

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
