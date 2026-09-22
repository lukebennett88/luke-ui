# Visual regression testing

Visual cases are `visual`-tagged browser tests. [`TESTING.md`](./TESTING.md) defines what to capture
and comparison policy.

## Baseline

The `Visual baseline` workflow renders `main` and uploads the `visual-baseline` artefact. Pull
requests download the newest `main` run, render their branch, and compare it.

The newest run must have succeeded and retain its artefact. Never fall back to an older successful
run: a stale baseline can pass an unchecked change. Re-run `Visual baseline` on `main` when the
baseline is unavailable.

## Run locally

```sh
VISUAL_CAPTURE_DIR=.artifacts/visual-regression/baseline \
  pnpm --filter @luke-ui/react run test:visual:capture
pnpm run test:visual
```

Run the first command on `main`. `test:visual` writes expected, actual, and diff PNGs plus
`summary.json` to `.artifacts/visual-regression`. Set `VISUAL_BASELINE_DIR` for another baseline.

## Review

Changed, added, and removed captures upload the `visual-regression-diff` artefact. The `review` job
waits at the `visual-review` environment when that environment has a required reviewer.

## Capture freeze

`freezeMotionForCapture` waits a couple of animation frames, finishes in-flight CSS transitions and
animations, then applies reduced-motion and zero-duration overrides. Cancelling a transition
mid-flight (for example `text-decoration-color` on text Links) otherwise freezes an interpolated
value and flakes the capture. During the freeze, `text-decoration-color` is pinned to `currentColor`
so underlines cannot disappear from a cancelled colour transition. Exit animations are paused rather
than finished so finishing them cannot unmount an open overlay before the screenshot.

`captureVisual` skips no-op viewport resizes (React Aria closes popovers on document scroll),
re-binds body/html locators immediately before the screenshot so live-region text changes cannot
invalidate the locator, and parks the pointer outside the viewport after each capture. Browser tests
also park the pointer in `afterEach` so a leftover cursor cannot leave text Links hovered (standard
prominence removes the underline under hover).

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
