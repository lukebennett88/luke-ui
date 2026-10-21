# Visual regression testing

Visual cases are `visual`-tagged browser tests. [`TESTING.md`](./TESTING.md) defines what to capture
and comparison policy.

## Baseline

The `Visual baseline` and `Visual regression` workflows render inside the same digest-pinned
Playwright container. The image string lives in `PLAYWRIGHT_VISUAL_IMAGE`
(`packages/@luke-ui/react/scripts/visual-regression-contract.ts`). Both workflows pin that value,
and a script test fails if they drift. That pins Chromium, OS libraries, and system fonts so
baseline and compare share one rendering environment. GitHub-hosted `ubuntu-latest` alone is not
stable enough for pixel screenshots. Both workflows set `PLAYWRIGHT_BROWSERS_PATH=/ms-playwright`,
and Turbo’s visual tasks pass that variable through so the test process uses the browsers baked into
the image.

The `Visual baseline` workflow renders `main` and uploads the `visual-baseline` artefact. Pull
requests download the newest `main` run, render their branch, and compare it.

After a rendering-environment change (for example moving baseline and compare into this container),
the first compare against the previous host baseline can show large intentional diffs. Once that
change merges, push or re-run `Visual baseline` on `main` so the next PRs compare against captures
from the pinned container.

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

This authoritative comparison also runs as part of `pnpm test`. It requires Docker with
`linux/amd64` support and an authenticated `gh` CLI with access to repository Actions artefacts.
Apple Silicon uses emulation. Missing Docker, an unavailable baseline, failed captures, and visual
differences all fail the command. There is no host fallback.

The CLI checks the newest `main` baseline workflow run on every comparison. It reuses a cached
baseline only when its run ID and attempt match that successful run and the cache contains PNGs.
Otherwise, it downloads and validates that run's artefact before replacing the local baseline. It
never falls back to an older run. Explicit local captures stay separate from the authoritative
cache.

The container receives current source without host dependencies or build outputs. A Docker volume
stores dependency installs keyed by the pinned image, platform, lockfile, workspace and install
configuration, package manifests, hooks, and patches. A warm run restores that install and skips
dependency installation, then builds packages and captures fresh screenshots inside the container.
It never reuses host builds or task-result caches.

Expected, actual, and diff PNGs plus `summary.json` are written to `.artifacts/visual-regression`.
`pnpm test:visual:capture` explicitly captures a local baseline in Docker. An authoritative compare
still selects the newest successful `main` workflow artefact rather than accepting that local
replacement. Bump `PLAYWRIGHT_VISUAL_IMAGE` and both workflow `image:` lines together when
Playwright moves.

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

## Capture freeze

`freezeMotionForCapture` waits a couple of animation frames, finishes in-flight CSS transitions and
animations, then applies reduced-motion and zero-duration overrides. Cancelling a transition
mid-flight (for example `text-decoration-color` on text Links) otherwise freezes an interpolated
value and flakes the capture. During the freeze, `text-decoration-color` is pinned to `currentColor`
so underlines cannot disappear from a cancelled colour transition. Exit animations are paused rather
than finished so finishing them cannot unmount an open overlay before the screenshot. Restore
resumes only the exit animations the freeze paused. CSS exit transitions are style-locked so
reduced-motion recipe resets (`transition: none`) cannot cancel them mid-capture. Already-paused
exit animations stay paused after restore.

Browser setup loads the theme Inter file before each test mounts so fixtures measure against that
face from the first paint. Code surfaces keep the production monospace stack — the harness does not
override component font styles. `freezeMotionForCapture` restores reduced-motion, the freeze
stylesheet, and exit locks if setup fails after installing them. `captureVisual` awaits Inter, owns
motion freeze cleanup in nested finally blocks, skips no-op viewport resizes (React Aria closes
popovers on document scroll), re-binds body/html locators immediately before the screenshot so
live-region text changes cannot invalidate the locator, and parks the pointer outside the viewport
after each capture. Browser tests also park the pointer in `afterEach` so a leftover cursor cannot
leave text Links hovered (standard prominence removes the underline under hover).

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
