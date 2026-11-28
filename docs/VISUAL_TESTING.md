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

`apps/squint` shows a pull request's screenshot differences and records the reviewer's decision on
the `visual-review` check run. Its [README](../apps/squint/README.md) covers the app, its backend,
and deployment. `Visual review publish` deploys each pull request's report and records the check
run. The header comments of the `visual-review-*` workflows and the functions in
[`visual-review.ts`](../.github/scripts/visual-review.ts) document the mechanics.

### Review check

Only a verified, successful comparison against the newest `Visual baseline` run passes
`visual-review`. Differences, or a change to the visual testing infrastructure as
`findInfrastructureChanges` defines it, need approval. A new commit, a re-run, or a replaced
baseline resets the check, so approval never carries over. Re-run the comparison to record a new
result.

Branch protection requires `visual-regression` and `visual-review`, with the visual review App as
the source of `visual-review`, and requires branches to be up to date.

### Trust boundary

`Visual regression` runs pull request code, so its screenshots and `summary.json` are the pull
request's own claim. The check catches unintended visual changes, and code review catches deliberate
tampering. Never check out or run pull request code in `Visual review publish` or
`Visual review sweep`. They run only the scripts on `main` and treat the diff artefact as hostile
data.

## Capture helpers

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
