# Visual regression testing

Visual regression tests render a component in a real browser (Chromium via Playwright), screenshot
it, and compare it against a committed baseline image. They replace the previous Argos setup with a
self-hosted approach built on Vitest's native `toMatchScreenshot` matcher — no external service, no
account, no upload quota.

For how to write a visual test, see [`TESTING.md`](./TESTING.md#visual-regression-tests). This
document covers the CI and baseline-management plumbing.

## How it works

- Tests live in `packages/@luke-ui/react/src/**/*.visual.test.tsx` and run in the `visual` Vitest
  project (`packages/@luke-ui/react/vitest.config.ts`).
- `pnpm --filter @luke-ui/react run test:visual` runs them; the aggregate `test` script includes it,
  so CI runs visual tests alongside unit, browser, and Storybook tests.
- Baselines are committed to git as `__screenshots__/<test-file>/<id>-chromium-<os>.png`.
- Screenshot filenames encode the OS, so macOS (`darwin`) and CI (`linux`) baselines never collide.

## Baselines are Linux-only

Font and GPU rendering differ across operating systems, so a macOS baseline would spuriously fail on
CI's Linux runners. To keep one source of truth, **only `*-chromium-linux.png` baselines are tracked
in git** (see the `__screenshots__` rules in `.gitignore`). Screenshots you generate locally on
macOS are ignored — run visual tests locally for a fast sanity check, but treat CI as authoritative.

## Updating baselines

When you intentionally change a component's appearance, regenerate the Linux baselines through CI:

1. Push your branch.
2. Run the **Update Visual Baselines** workflow (`.github/workflows/update-visual-baselines.yml`)
   from the Actions tab, selecting your branch. It runs `test:visual -u` on Linux and commits the
   updated `*-linux.png` files back to your branch.
3. Re-run the pull request's checks so they validate against the new baselines (the workflow's push
   uses `GITHUB_TOKEN`, which does not re-trigger them automatically).
4. Review the changed PNGs in the pull request's file diff. GitHub renders image diffs (2-up, swipe,
   onion skin) so you can confirm the change is intentional before merging.

## Coverage

Every public atom and composed component should have a `*.visual.test.tsx` beside it, covering its
meaningful states — at minimum its default rendering, size or tone variants, and any interactive
state that changes appearance (focus, open, pressed, invalid).

The source tree is the coverage record: a component is covered when a `<component>.visual.test.tsx`
sits next to it, and that file's `test(...)` names say which states. To find gaps, compare the
public component exports against the existing `*.visual.test.tsx` files. Don't keep a coverage list
here — it would duplicate the file tree and fall out of date.

## Reviewing failures

When a visual test fails in CI, the `visual-tests` job uploads the actual and diff images as a
`visual-diffs` workflow artifact (see `.github/workflows/storybook.yml`). Download it from the run
summary to see what changed.

## One-time bootstrap

`workflow_dispatch` workflows are only available once the workflow file exists on the default
branch. Split the rollout across two pull requests so `main` never goes red:

1. **PR 1 — workflows and docs only.** Merge `.github/workflows/update-visual-baselines.yml`, the
   `visual-diffs` upload step in `storybook.yml`, the `.gitignore` rules, and these docs. Do **not**
   include the `visual` Vitest project, the `test:visual` wiring in `package.json`, or any
   `*.visual.test.tsx` files — otherwise `test:visual` runs with zero matching files and fails with
   "no test files found". After this merges, the **Update Visual Baselines** workflow is available
   on `main` and CI is still green.
2. **PR 2 — config, tests, and baselines.** Add the `visual` project config, the `test:visual`
   wiring, the shared helper, and the `*.visual.test.tsx` files on a branch and push. Its first CI
   run fails (no baselines yet) — but only on the PR, never on `main`. Run **Update Visual
   Baselines** against the PR branch to generate and commit the Linux baselines, then re-run the
   PR's checks (see the note below). With baselines committed, the PR goes green and merges cleanly.

> **Note:** commits the workflow pushes use the default `GITHUB_TOKEN`, which does not re-trigger
> other workflows. After baselines are pushed to a branch, re-run the PR's checks (or push any
> commit) so they validate against the new baselines.

(If you would rather ship everything in one PR, the only cost is a single red CI run on `main` after
merge, which the next **Update Visual Baselines** run clears.) After the bootstrap, `main` stays
green and baselines only change when you deliberately update them.
