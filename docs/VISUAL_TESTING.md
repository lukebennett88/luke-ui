# Visual regression testing

Visual tests compare the current checkout with the latest `origin/main` on the same machine and in
the same Chromium installation. The repository does not store screenshots, baseline manifests, or
Git LFS objects.

## Run the comparison

```sh
pnpm run test:visual
```

The command captures the local `origin/main` ref in a disposable Git worktree, then captures the
current working tree, including uncommitted changes. Fetch before running when you need the latest
remote commit. Set `VISUAL_BASE_REF` to use another local ref, such as `upstream/main` in a fork.
The command compares matching capture IDs and writes a self-contained report to
`.artifacts/visual-regression/report/index.html`. Capture identity, harness files, and that artifact
directory are defined in `packages/@luke-ui/react/src/core/test-utils/visual-capture-id.ts` and
`packages/@luke-ui/react/scripts/visual-regression-contract.ts`. GitHub Actions cannot import those
modules. A unit test fails if the workflow lists a different harness file or artifact path.
`vitest.config.ts` is copied into the base worktree, so it also cannot import those modules. A unit
test fails if it drifts from the capture-dir literals.

The first run installs and builds the comparison worktree. Later runs reuse its ignored cache while
the base SHA, platform, architecture, browser, lockfile, and visual configuration remain unchanged.
Delete `.artifacts/visual-regression` at any time to start clean.

Local pixel differences are advisory: the command reports them but succeeds so intentional visual
work does not make the development loop permanently red. Capture failures, duplicate IDs, and other
infrastructure errors still fail.

Scenes taller than the fixed viewport are captured by growing both the page and the Vitest test
iframe before the screenshot, so they come out at 1:1 rather than the scaled-to-fit size used for
scenes that fit the viewport. The runner fails if a tall capture from the current tree's bottom
decile comes back blank, since that means the scene only painted part of its height.

## Read the report

The report classifies captures as unchanged, changed, added, or removed. Added and removed captures
are informational. A changed result means the capture-wide mismatch ratio exceeds 0.1%
(`mismatchRatio > 0.001`). The comparison runs `pixelmatch` with `includeAA: true` and
`threshold: 0.1`, counting anti-aliased edge pixels rather than discarding them, so a thin icon
stroke on a large canvas still registers. Use the filters, overlay slider, and main, current, and
diff images to review each result. Run `pnpm --filter @luke-ui/react run test:visual:report` to open
the latest local report.

A diff small enough to keep the capture-wide ratio under 0.1% can be missed, so keep a direct
assertion for intent the visual gate cannot promise. The LoadingSkeleton rounding fix in #225, for
example, stays guarded by a `getComputedStyle` assertion.

## CI review

Pull requests that can affect rendered components run the same comparison on Linux. CI uploads the
report as the `visual-regression-report` artifact. Added and removed captures do not require
approval. Before enabling this workflow, a repository administrator must create the `visual-review`
environment in GitHub settings and add a required reviewer. Self-review may remain enabled. Without
that protection rule, GitHub runs the review job immediately and visual approval is not enforced.
Once configured, matched visual changes pause the review job and tie approval to that workflow run
and commit.

## Why screenshots are not committed

Rendering both revisions on the same device avoids platform-specific baselines and the usual
macOS-to-Linux update loop. It also keeps forks simple and avoids binary repository growth. The
tradeoff is that each comparison renders two revisions. The disposable base cache limits repeated
work.

See [`TESTING.md`](./TESTING.md#visual-regression-tests) for how to write a visual test.

## Test every theme and mode

Migrated components use the shared appearance matrix for Tactile and Paper in explicit light and
dark modes. Pass each appearance to `render`, then capture it with `captureVisualAppearance`:

```tsx
import { test } from 'vite-plus/test';
import { captureVisualAppearance, visualAppearances } from '../test-utils/visual.js';
import { render } from '../test-utils/render.js';

for (const appearance of visualAppearances) {
	test(`theme matrix: ${appearance.theme} ${appearance.mode}`, async () => {
		const { locator: scene } = render(<Button>Continue</Button>, { appearance });

		await captureVisualAppearance(scene, 'button/theme-matrix', appearance);
	});
}
```

The helper appends the selected appearance to the literal base ID. The example creates these stable
capture IDs:

- `button/theme-matrix-tactile-light`
- `button/theme-matrix-tactile-dark`
- `button/theme-matrix-paper-light`
- `button/theme-matrix-paper-dark`

Use one literal base ID for the matrix. The visual runner expands it during duplicate-ID validation,
so each look remains independently reviewable without repeating theme setup. Existing tests that
call `render(node)` continues to render in Tactile light.

Theme identity and colour mode stay separate. To cover nested mode, put `data-color-mode="dark"` or
`data-color-mode="light"` on a descendant inside the rendered scene. Do not add a nested theme
identity because identity classes are not nestable.

For a portalled surface, render the real component with the selected appearance, open it through
`userEvent`, and capture the portal or `document.body`. The component carries the identity class and
explicit colour mode from its trigger. Do not copy theme classes onto a test-only portal wrapper.
