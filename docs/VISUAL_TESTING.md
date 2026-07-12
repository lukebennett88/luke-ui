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
`.artifacts/visual-regression/report/index.html`.

The first run installs and builds the comparison worktree. Later runs reuse its ignored cache while
the base SHA, platform, architecture, browser, lockfile, and visual configuration remain unchanged.
Delete `.artifacts/visual-regression` at any time to start clean.

Local pixel differences are advisory: the command reports them but succeeds so intentional visual
work does not make the development loop permanently red. Capture failures, duplicate IDs, and other
infrastructure errors still fail.

## Read the report

The report classifies captures as unchanged, changed, added, or removed. Added and removed captures
are informational. A changed result means matching IDs differ by more than 0.1% of their pixels. Use
the filters, overlay slider, and main, current, and diff images to review each result. Run
`pnpm --filter @luke-ui/react run test:visual:report` to open the latest local report.

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
tradeoff is that each comparison renders two revisions; the disposable base cache limits repeated
work.

See [`TESTING.md`](./TESTING.md#visual-regression-tests) for how to write a visual test.
