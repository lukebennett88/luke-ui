# Luke UI agent guide

- Use `catalog:` dependency versions in `package.json`. The catalog lives in `pnpm-workspace.yaml`.
  Do not add raw versions.
- Read [docs/CONVENTIONS.md](docs/CONVENTIONS.md), [docs/COMPONENTS.md](docs/COMPONENTS.md),
  [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md), [docs/STYLING.md](docs/STYLING.md), and
  [docs/TESTING.md](docs/TESTING.md) before changing code, styles, docs, or tests.
- Run tasks through Turbo from the repo root, for example `pnpm run check` or `pnpm run build`.
  Package-local scripts can skip Turbo `generate` dependencies, which can leave generated files
  missing.
- Scaffold components non-interactively:
  `pnpm run generate:component --args <name> <atom|composed> <docs-group> <recipe|none>`.
- When you change code, update or delete the docs that describe it in the same change. This includes
  comments, JSDoc, MDX files in `apps/docs/content/docs/`, `README.md`, package READMEs, and files
  in `docs/`. See [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md#keeping-docs-current).

## Dev loop

- Run `pnpm run check` from the repo root before committing.
- Component prose lives in MDX files in `apps/docs/content/docs/`, not `.docs.md` files in the
  package. Update the relevant MDX page in the same change as component code.
- Do not add or edit `.docs.md` files in `packages/@luke-ui/react/src/`.
