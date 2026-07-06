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
- When you change code, update or delete the docs that describe it in the same change — comments,
  JSDoc, MDX files in `apps/docs/content/docs/`, `README.md`, and `docs/*.md`. See
  [docs/CONVENTIONS.md](docs/CONVENTIONS.md#keeping-docs-current).

## Dev loop

- Run `pnpm run check` from the repo root to verify changes before committing.
- Component prose now lives in MDX files in `apps/docs/content/docs/`, not `.docs.md` files in the
  package. Update the relevant MDX page in the same change as the component code.
- Do not add or edit `.docs.md` files in `packages/@luke-ui/react/src/`.
