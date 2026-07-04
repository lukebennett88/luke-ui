# Argos + Storybook GitHub setup

The repository uses Argos visual testing through the Storybook Vitest integration.

## Required GitHub settings

1. Add repository secret:

- Go to `Settings` -> `Secrets variables` -> `Actions`.
- Click `New repository secret`.
- Name: `ARGOS_TOKEN`
- Secret: Argos project token from Argos project settings.

2. Enable GitHub Pages workflow deploy:

- Go to `Settings` -> `Pages`.
- Under `Build deployment`, set `Source` to `GitHub Actions`.

## Where secret used

- Workflow: `.github/workflows/storybook.yml`
- `visual-tests` injects `ARGOS_TOKEN` into `pnpm --filter @luke-ui/react test`.
- `visual-tests` builds Storybook and runs `pnpm deploy:storybook:argos` so Argos can add a PR
  preview or comment.
- Fork PRs do not receive repository secrets. Tests still run, but Argos upload is skipped
  automatically.
- `deploy-pages` passes `STORYBOOK_BASE_PATH` through `actions/configure-pages@v5` for the Storybook
  build.
- Turbo config: `turbo.json`
- `build:storybook` includes `STORYBOOK_BASE_PATH` in its `env` list.
- Vitest config: `packages/@luke-ui/react/vitest.config.ts`
- Argos plugin reads `process.env.ARGOS_TOKEN`.
- Root script: `package.json`
- `test` delegates to the `@luke-ui/react` workspace `test` script.
- `deploy:storybook:argos` deploys built Storybook static files to Argos.
- Workspace script: `packages/@luke-ui/react/package.json`
- `test` runs `tsx scripts/test-visual.ts`.
- The script uses an existing `ARGOS_TOKEN` if set. Otherwise it loads the local package
  `.env.local` when present, enables `ARGOS_UPLOAD=1` only when `ARGOS_TOKEN` is available, and runs
  the Storybook Vitest suite.

## Verify configuration

1. Push `main` and run the workflow manually.
2. Confirm the `Storybook` workflow succeeds:

- `visual-tests` uploads screenshots and deploys Storybook to Argos.
- `deploy-pages` publishes Storybook on `main`.

3. Open a PR with a small Storybook-visible change and verify Argos adds a PR comment or check.

## Local testing

Use `packages/@luke-ui/react/.env.local` for local runs.

1. Set `ARGOS_TOKEN` in `packages/@luke-ui/react/.env.local`.
2. Run `corepack pnpm --filter @luke-ui/react test`.

This command runs the Storybook Vitest suite and enables Argos upload automatically when
`ARGOS_TOKEN` is present.

## Security notes

- Do not commit tokens in source files.
- If the token is ever committed or shared, rotate it in Argos and update the `ARGOS_TOKEN` GitHub
  secret.
