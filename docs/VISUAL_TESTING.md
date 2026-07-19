# Visual regression testing

Visual tests compare the current checkout against a committed set of frozen "golden" screenshots,
captured once on the `ve-final` tag. Screenshots are committed under
`packages/@luke-ui/react/visual-goldens/`.

## Run the comparison

```sh
pnpm run test:visual
```

The command builds the packages, captures the current working tree, including uncommitted changes,
and compares it against the committed frozen goldens. There is no worktree checkout and no
`VISUAL_BASE_REF`/`VISUAL_BASE_SHA` to configure. The command compares matching capture IDs and
writes a self-contained report to `.artifacts/visual-regression/report/index.html`.

Local pixel differences are advisory: the command reports them but succeeds so intentional visual
work does not make the development loop permanently red. Capture failures, duplicate IDs, and other
infrastructure errors still fail.

## Re-baseline the goldens

The committed goldens are platform-specific and must match the CI runner, so they are captured on
Linux by the **Freeze visual goldens** workflow, not on a contributor's machine. After an
intentional visual change:

1. Run the **Freeze visual goldens** workflow against your branch from the Actions tab.
2. Download the `visual-goldens` artifact it produces.
3. Replace `packages/@luke-ui/react/visual-goldens/` with the artifact contents and commit it
   alongside your change, reviewing the PNG diffs in the pull request.

`pnpm --filter @luke-ui/react test:visual:freeze` runs the same capture locally. Use it to preview a
change, but do not commit macOS-captured goldens, because they will not match the Linux CI runner.
The manifest records the platform, architecture, and a config and lockfile signature, so environment
or config drift against the recorded goldens surfaces as a warning.

## Read the report

The report classifies captures as unchanged, changed, added, or removed. Added and removed captures
are informational. A changed result means matching IDs differ by more than 0.1% of their pixels. Use
the filters, overlay slider, and main, current, and diff images to review each result. Run
`pnpm --filter @luke-ui/react run test:visual:report` to open the latest local report.

## CI review

Pull requests that can affect rendered components run the same comparison against the committed
goldens on Linux. CI uploads the report as the `visual-regression-report` artifact. Added and
removed captures do not require approval. Before enabling this workflow, a repository administrator
must create the `visual-review` environment in GitHub settings and add a required reviewer.
Self-review may remain enabled. Without that protection rule, GitHub runs the review job immediately
and visual approval is not enforced. Once configured, matched visual changes pause the review job
and tie approval to that workflow run and commit.

## Why the goldens are a frozen, committed set

The committed goldens were captured once from the final Vanilla Extract revision. Panda's shipped
stylesheet is compared against that frozen set, so the parity gate stays stable and diffs remain
reviewable directly in the PR.

See [`TESTING.md`](./TESTING.md#visual-regression-tests) for how to write a visual test.

## Test every theme and mode

Migrated components use the shared appearance matrix for Tactile and Paper in explicit light and
dark modes. Pass each appearance to `renderVisual`, then capture it with `captureVisualAppearance`:

```tsx
import { test } from 'vite-plus/test';
import {
	captureVisualAppearance,
	renderVisual,
	visualAppearances,
} from '../test-utils/render-visual.js';

test.each(visualAppearances)('theme matrix: $theme $mode', async (appearance) => {
	const scene = renderVisual(<Button>Continue</Button>, appearance);

	await captureVisualAppearance(scene, 'button/theme-matrix', appearance);
});
```

The helper appends the selected appearance to the literal base ID. The example creates these stable
capture IDs:

- `button/theme-matrix-tactile-light`
- `button/theme-matrix-tactile-dark`
- `button/theme-matrix-paper-light`
- `button/theme-matrix-paper-dark`

Use one literal base ID for the matrix. The visual runner expands it during duplicate-ID validation,
so each look remains independently reviewable without repeating theme setup. Existing tests that
call `renderVisual(node)` continue to render in Tactile light.

Theme identity and colour mode stay separate. To cover nested mode, put `data-color-mode="dark"` or
`data-color-mode="light"` on a descendant inside the rendered scene. Do not add a nested theme
identity because identity classes are not nestable.

For a portalled surface, render the real component with the selected appearance, open it through
`userEvent`, and capture the portal or `document.body`. The component carries the identity class and
explicit colour mode from its trigger. Do not copy theme classes onto a test-only portal wrapper.
