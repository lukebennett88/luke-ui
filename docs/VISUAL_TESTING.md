# Visual regression testing

How the visual gate runs. [`TESTING.md`](./TESTING.md#visual-regression) is the normative policy: it
decides what to capture, how sensitive the comparison is, and what review a baseline change needs.

Visual cases live in `*.browser.test.tsx`, tagged `visual`. The repository stores no screenshots,
baseline manifests, or Git LFS objects.

## The baseline

A push to `main` that touches the component packages runs the `Visual baseline` workflow, which
renders the visual cases and uploads them as the `visual-baseline` GitHub Actions artefact. A pull
request downloads that artefact from the latest successful `main` run, renders only its own branch,
and compares the two.

Nothing re-renders `main` during a pull request. When the artefact is missing or expired the job
fails and asks for the `Visual baseline` workflow to be re-run on `main`.

## Run the comparison locally

```sh
VISUAL_CAPTURE_DIR=.artifacts/visual-regression/baseline \
  pnpm --filter @luke-ui/react run test:visual:capture   # on main, once
pnpm run test:visual                                     # on your branch
```

`test:visual:capture` renders the visual-tagged cases into `VISUAL_CAPTURE_DIR`. `test:visual`
renders the working tree, compares it with `.artifacts/visual-regression/baseline`, and writes
`expected`, `actual`, and `diff` PNGs per capture to `.artifacts/visual-regression/diff` plus a
`summary.json` beside it. Set `VISUAL_BASELINE_DIR` to compare against a baseline somewhere else.
Delete `.artifacts/visual-regression` at any time to start clean.

Behavioural browser tests exclude the tag, so `test:browser` and `test:watch` stay fast.

## Sensitivity

Comparison is `pixelmatch` with `includeAA: true` and `threshold: 0.1`. The per-pixel colour
threshold is the only tolerance: anti-aliased edges are counted rather than discarded, and there is
no canvas-wide mismatch-ratio allowance, so a 16px icon on a 1024x800 canvas registers as a change
(see #312). Captures whose dimensions or recorded viewport differ also count as changed.

A capture is also rejected when it is taller than its recorded viewport and its bottom decile is a
single flat colour, which means the scene grew but never painted (see #310).

## Review

Changed, added, and removed captures all count as baseline changes. When a pull request has any of
them, CI uploads the `visual-regression-diff` artefact and the `review` job pauses at the
`visual-review` GitHub Environment until a reviewer approves it. That job has no path to success
other than approval.

A repository administrator must create the `visual-review` environment and add a required reviewer.
Without that protection rule GitHub runs the job immediately and nothing is enforced.

## Scenes taller than the viewport

`captureVisual` grows both the page and the Vitest test iframe before the screenshot, so a tall
scene comes out at 1:1 rather than scaled to fit.

## Test every theme and mode

Pass each appearance to `render`, then capture it with `captureVisualAppearance`:

```tsx
for (const appearance of visualAppearances) {
	test(`theme matrix: ${appearance.theme} ${appearance.mode}`, { tags: ['visual'] }, async () => {
		const { locator: scene } = render(<Button>Continue</Button>, { appearance });

		await captureVisualAppearance(scene, 'button/theme-matrix', appearance);
	});
}
```

The helper appends the appearance to the literal base ID, producing
`button/theme-matrix-tactile-light`, `-tactile-dark`, `-paper-light`, and `-paper-dark`. Use one
literal base ID for the matrix so each look stays independently reviewable.

Theme identity and colour mode stay separate. For nested mode, put `data-color-mode` on a descendant
inside the scene. Do not nest a theme identity class, which is not nestable.

For a portalled surface, render the real component with the selected appearance, open it through
`userEvent`, and capture the portal or `document.body`. Do not copy theme classes onto a test-only
portal wrapper.
