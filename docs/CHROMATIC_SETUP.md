# Chromatic + Storybook GitHub setup

The repository uses Chromatic for Storybook visual testing.

## Required GitHub settings

1. Add repository secret:

- Go to `Settings` -> `Secrets variables` -> `Actions`.
- Click `New repository secret`.
- Name: `CHROMATIC_PROJECT_TOKEN`
- Secret: project token from the Chromatic project settings.

2. Enable GitHub Pages workflow deploy:

- Go to `Settings` -> `Pages`.
- Under `Build deployment`, set `Source` to `GitHub Actions`.

## Where secret used

- Workflow: `.github/workflows/storybook.yml`
- `visual-tests` passes `CHROMATIC_PROJECT_TOKEN` to the `chromaui/action` step, which builds
  Storybook and publishes it to Chromatic for visual diffing and PR checks.
- `exitZeroOnChanges: true` keeps the job green when Chromatic finds visual changes; review and
  acceptance happens in the Chromatic UI/PR check, not by failing CI.
- Fork PRs do not receive repository secrets. Storybook interaction tests still run, but the
  Chromatic publish step is skipped automatically.
- Storybook config: `packages/@luke-ui/react/.storybook/main.ts`
- `@chromatic-com/storybook` addon surfaces visual test results inside the local Storybook UI.
- Root script: `package.json`
- `chromatic` runs the Chromatic CLI against an existing `storybook-static` build (for local/manual
  publishing outside CI).

## Verify configuration

1. Push `main` and run the workflow manually.
2. Confirm the `Storybook` workflow succeeds:

- `visual-tests` publishes the build to Chromatic.
- `deploy-pages` publishes Storybook on `main`.

3. Open a PR with a small Storybook-visible change and verify Chromatic adds a PR check with the
   visual diff.

## Local testing

1. Set `CHROMATIC_PROJECT_TOKEN` in your shell environment.
2. Run `corepack pnpm build:storybook` then `corepack pnpm chromatic`.

Alternatively, install the Chromatic addon's Storybook integration (already configured) and use the
"Visual tests" panel inside `pnpm --filter @luke-ui/react dev:storybook` to link the project and run
tests interactively.

## Security notes

- Do not commit tokens in source files.
- If the token is ever committed or shared, rotate it in Chromatic and update the
  `CHROMATIC_PROJECT_TOKEN` GitHub secret.
