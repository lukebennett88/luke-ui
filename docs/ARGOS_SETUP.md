# Argos + Storybook GitHub Setup

This repository uses Argos visual testing through Storybook Vitest integration.

## Required GitHub Settings

1. Add repository secret:
   - Go to `Settings` -> `Secrets and variables` -> `Actions`.
   - Click `New repository secret`.
   - Name: `ARGOS_TOKEN`
   - Secret: your Argos project token from Argos project settings.
2. Enable GitHub Pages for workflow deploy:
   - Go to `Settings` -> `Pages`.
   - Under `Build and deployment`, set `Source` to `GitHub Actions`.

## Where The Secret Is Used

- Workflow: `.github/workflows/storybook.yml`
  - `visual-tests` job injects `ARGOS_TOKEN` into root script
    `pnpm run test:visual`.
  - For fork PRs (no repository secrets), tests still run but Argos upload is
    skipped automatically.
- Vitest config: `packages/@luke-ui/react/vitest.config.ts`
  - Argos plugin reads `process.env.ARGOS_TOKEN`.
- Root script: `package.json`
  - `test:visual` delegates to `@luke-ui/react` workspace script
    `test:visual`.
- Workspace script: `packages/@luke-ui/react/package.json`
  - `test:visual` runs `tsx scripts/test-visual.ts`.
  - The script uses existing `ARGOS_TOKEN` if set; otherwise it loads local
    package `.env.local` (when present), enables `ARGOS_UPLOAD=1` only when
    `ARGOS_TOKEN` is available, then runs the Storybook Vitest suite.

## Verify Configuration

1. Push to `main` (or run workflow manually).
2. Confirm `Storybook` workflow succeeds:
   - `visual-tests` job uploads Argos build.
   - `deploy-pages` job publishes Storybook.
3. Open a PR with a small Storybook-visible change and verify Argos check is
   reported.

## Local Testing

Use `packages/@luke-ui/react/.env.local` for local runs.

1. Set `ARGOS_TOKEN` in `packages/@luke-ui/react/.env.local`.
2. Run:
   - `corepack pnpm run test:visual`
   - This command enables upload automatically when `ARGOS_TOKEN` is present.

## Security Notes

- Do not commit tokens in source files.
- If a token was ever committed or shared, rotate it in Argos and update the
  `ARGOS_TOKEN` GitHub secret.
