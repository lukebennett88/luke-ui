# Luke UI agent guide

- Use `catalog:` dependency versions in `package.json`. The catalog lives in `pnpm-workspace.yaml`.
  Do not add raw versions. See [docs/DEPENDENCIES.md](docs/DEPENDENCIES.md).
- Read [docs/CONVENTIONS.md](docs/CONVENTIONS.md), [docs/COMPONENTS.md](docs/COMPONENTS.md),
  [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md), [docs/STYLING.md](docs/STYLING.md), and
  [docs/TESTING.md](docs/TESTING.md) before changing code, styles, docs, or tests.
- Read [docs/TESTING.md](docs/TESTING.md) before adding or changing tests. It is the only normative
  testing guide.
- Run tasks through Turbo from the repo root, for example `pnpm run check` or `pnpm run build`.
  Package-local scripts can skip Turbo `generate` dependencies, which can leave generated files
  missing.
- Scaffold components non-interactively: `pnpm run generate:component --args <name> <docs-group>`.
- Scaffold primitives non-interactively: `pnpm run generate:primitive --args <name>`.
- When you change code, update or delete the docs that describe it in the same change. This includes
  comments, JSDoc, MDX files in `apps/docs/content/docs/`, `README.md`, package READMEs, and files
  in `docs/`. See [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md#keeping-docs-current).
- [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md) is the only normative documentation guide. It
  decides what belongs in documentation as well as how to word MDX prose, JSDoc, and code comments.
- For JavaScript and TypeScript code style, follow
  [docs/CONVENTIONS.md#code-style](docs/CONVENTIONS.md#code-style).

## Dev loop

- Run `pnpm run check` from the repo root before committing. `check` covers barrels, format, lint,
  types, and docs but **not** tests. Run `pnpm run test` separately. `test.yml` runs component and
  docs tests; visual regression has its own workflow.
- Component prose lives in MDX files in `apps/docs/content/docs/`, not `.docs.md` files in the
  package. Update the relevant MDX page in the same change as component code.
- Do not add or edit `.docs.md` files in `packages/@luke-ui/react/src/`.

### Verification traps

- A package-local `check:*` run is not what CI runs. Only the root `pnpm run check` runs
  `check:format-root`, which covers files outside packages such as `docs/*.md`, and knip
  (`check:cycles`, `check:unused`). If `check:format-root` fails on Markdown wrapping, run
  `pnpm run fix:format-root`. Do not re-wrap by hand.
- The Turbo cache is shared across worktrees, so `FULL TURBO` can replay another branch's result.
  For a real run, use `TURBO_FORCE=true pnpm run test`. Do not use `pnpm run test -- --force`,
  because the flag goes to the package script.
- publint runs on every build through `publint: true` in `packages/@luke-ui/react/vite.config.ts`.
  Do not add a `check:publint` script.
- Lint rules live in the `lint` block of the root `vite.config.ts`. A `.oxlintrc.json` file is
  ignored, and oxlint has no `no-restricted-syntax` rule. Two `lint.overrides` entries matching the
  same file and rule do not merge: the later entry wins.
- In `apps/docs`, a `src/lib/` module imported by a client component must not import `node:fs` or
  `node:path`. If it does, the page returns HTTP 200 but its MDX body renders empty.
