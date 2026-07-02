# Luke UI Agent Guide

- Use `catalog:` in `package.json` for dependency versions (catalog in `pnpm-workspace.yaml`). Do
  not add raw versions.
- See [docs/CONVENTIONS.md](docs/CONVENTIONS.md), [docs/STYLING.md](docs/STYLING.md) for conventions
  and styling.
- Run tasks through turbo from the repo root (`pnpm run check`, `pnpm run build`, …). Running
  package-local scripts directly skips turbo's `generate` dependencies, so generated files
  (`.generated/`, `routeTree.gen.ts`, spritesheet) may be missing.
- Scaffold components non-interactively:
  `pnpm run generate:component --args <name> <atom|composed> <docs-group> <recipe|none>`.
