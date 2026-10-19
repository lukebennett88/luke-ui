# Visual regression testing

Visual cases are `visual`-tagged browser tests. [`TESTING.md`](./TESTING.md) defines what to capture
and comparison policy.

## Baseline

The `Visual baseline` and `Visual regression` workflows render inside the same digest-pinned
Playwright container (image tag and digest in those workflow files, kept in sync with the Docker
command below). That pins Chromium, OS libraries, and system fonts so baseline and compare share one
rendering environment. GitHub-hosted `ubuntu-latest` alone is not stable enough for pixel
screenshots.

The `Visual baseline` workflow renders `main` and uploads the `visual-baseline` artefact. Pull
requests download the newest `main` run, render their branch, and compare it.

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
VISUAL_CAPTURE_DIR=.artifacts/visual-regression/baseline \
  pnpm --filter @luke-ui/react run test:visual:capture
pnpm run test:visual
```

Run the first command on `main`. `test:visual` writes expected, actual, and diff PNGs plus
`summary.json` to `.artifacts/visual-regression`. Set `VISUAL_BASELINE_DIR` for another baseline.

Host Chromium and system fonts can still differ from CI. For captures that must match the baseline
and compare jobs, use the same digest-pinned Playwright image those workflows run in:

```sh
docker run --rm --ipc=host \
  -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
  -v "$PWD":/work -w /work \
  mcr.microsoft.com/playwright:v1.64.0-jammy@sha256:c064e7f355d2dda32f669801a1b09e86a1e9252395c844d2cfbbe5c44acb9b79 \
  bash -lc 'corepack enable && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 pnpm install --frozen-lockfile --no-runtime && pnpm build:packages && VISUAL_CAPTURE_DIR=.artifacts/visual-regression/baseline pnpm --filter @luke-ui/react run test:visual:capture'
```

Bump the image tag and digest together when the Playwright version in the catalog moves.

## Review

Changed, added, and removed captures upload the `visual-regression-diff` artefact. The `review` job
waits at the `visual-review` environment when that environment has a required reviewer.

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
