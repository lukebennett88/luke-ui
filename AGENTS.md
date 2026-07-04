# Luke UI agent guide

- Use `catalog:` for dependency versions in `package.json`. The catalog lives in
  `pnpm-workspace.yaml`. Do not add raw versions.
- Read [docs/CONVENTIONS.md](docs/CONVENTIONS.md), [docs/STYLING.md](docs/STYLING.md), and
  [docs/TESTING.md](docs/TESTING.md) before changing code, styles, or tests.
- Run tasks through Turbo from the repo root, for example `pnpm run check` or `pnpm run build`.
  Package-local scripts can skip Turbo `generate` dependencies, which may leave generated files
  missing.
- Scaffold components non-interactively:
  `pnpm run generate:component --args <name> <atom|composed> <docs-group> <recipe|none>`.
