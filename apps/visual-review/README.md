# Visual review

A review interface for the visual regression comparison. It shows one pull request's differences,
and lists every open pull request with the state of its report.
[Visual regression testing](../../docs/VISUAL_TESTING.md#visual-review-app) explains how reports are
published and how the app is deployed.

- `/` lists the repository's open pull requests from GitHub's public API and loads each one's
  report.
- `/?pr=<number>` reviews one pull request.
- `/?source=local` reviews the comparison in `.artifacts/visual-regression`. Only the development
  server serves it.

A review keeps its state in the query string, so every view is a link: the selected capture, the
view (`side`, `overlay`, or `diff`), the zoom, the filter, and whether differences are outlined. The
sidebar lists the keyboard shortcuts.

The app reads a report over HTTP: `summary.json`, and one PNG per image at
`diff/<capture id>.<expected|actual|diff>.png`. `src/report/schema.ts` validates that contract with
Zod. The app imports nothing from the scripts that write it. `src/review/diff-regions.ts` reads the
diff image's pixels to outline where a capture differs.

The app is built with Luke UI through its public entrypoints and the Tactile theme. React Aria's
`RouterProvider` sends Luke UI `Link` navigation through the History API, and the app has no router
dependency. [`FRICTION.md`](./FRICTION.md) records the gaps it found.

Two build-time variables configure a deployment:

- `VITE_VISUAL_REVIEW_DATA_URL_TEMPLATE` is the origin of a pull request's report, with `{pr}`
  standing for its number. Without it, only the local source loads.
- `VITE_VISUAL_REVIEW_REPOSITORY` is the `owner/name` of the GitHub repository. It defaults to
  `lukebennett88/luke-ui`.

Run commands from the repository root:

```bash
pnpm test:visual
pnpm run dev:visual-review
pnpm exec turbo run test --filter=visual-review
pnpm run check
```

`pnpm test:visual` writes the comparison that `http://localhost:5175/?source=local` reviews. Set
`VISUAL_REVIEW_LOCAL_DIR` to review a comparison in another directory.
