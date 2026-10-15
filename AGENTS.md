# Luke UI agent guide

## Skills

Skills in `.agents/skills/` hold this repository's workflows. Some agents discover them there, and
others do not, so this list is the index. When a task matches a skill, read its whole `SKILL.md`
before you start. A grep, an excerpt, or a skill listing is not a read.

- Writing or investigating a GitHub issue:
  [.agents/skills/write-issue/SKILL.md](.agents/skills/write-issue/SKILL.md).
- Implementing an issue and opening its pull request:
  [.agents/skills/work-on-issue/SKILL.md](.agents/skills/work-on-issue/SKILL.md).
- Writing or updating a pull request title and body:
  [.agents/skills/write-pr/SKILL.md](.agents/skills/write-pr/SKILL.md).
- Reviewing a pull request or a diff:
  [.agents/skills/review-pr/SKILL.md](.agents/skills/review-pr/SKILL.md).
- Documentation, including pull request reviews that touch it:
  [.agents/skills/write-docs/SKILL.md](.agents/skills/write-docs/SKILL.md). This covers MDX pages in
  `apps/docs/content/docs/`, `docs/*.md`, READMEs, and JSDoc when it is the main task or documents a
  new public export or prop.
- Writing, changing, or reviewing tests, including pull request reviews that touch them:
  [.agents/skills/write-tests/SKILL.md](.agents/skills/write-tests/SKILL.md).

More than one skill can apply. To review a pull request, first check whether its diff touches
documentation, tests, or both.

## Task routing

- Incidental edits to existing JSDoc or code comments:
  [docs/DOCUMENTATION.md#comments-and-jsdoc](docs/DOCUMENTATION.md#comments-and-jsdoc).
- Writing or changing JavaScript, TypeScript, or TSX: [docs/CONVENTIONS.md](docs/CONVENTIONS.md).
- Adding or restructuring a component, primitive, or icon: [docs/COMPONENTS.md](docs/COMPONENTS.md).
  Scaffold non-interactively with `pnpm run generate:component --args <name> <docs-group>` or
  `pnpm run generate:primitive --args <name>`.
- Changing public exports, props, or types: [docs/PUBLIC_API.md](docs/PUBLIC_API.md).
- Editing `*.css.ts` files, recipes, or theme files: [docs/STYLING.md](docs/STYLING.md).
- Changing dependencies in `package.json`: [docs/DEPENDENCIES.md](docs/DEPENDENCIES.md). Use
  `catalog:` versions, not raw versions.

## Dev loop

- Leave changes you did not make as you found them. Do not reset, clean, stash, or overwrite them,
  and keep them out of your commits.
- Report each check as passed, failed, pending, or not run. Say whether a result came from a local
  run or from CI, and say why a check did not run.
- Do not add a changeset before 1.0.0, even if changeset-bot asks for one. See
  [docs/DEPENDENCIES.md#changesets](docs/DEPENDENCIES.md#changesets).
- When you change code, update or delete the docs and skills that describe it in the same change.
  See [docs/DOCUMENTATION.md#keeping-docs-current](docs/DOCUMENTATION.md#keeping-docs-current).
- Run tasks through Turbo from the repo root. Package-local scripts can skip Turbo `generate`
  dependencies, which can leave generated files missing.
- Run `pnpm run check` before committing. It covers barrels, format, lint, types, and docs but
  **not** tests. Run `pnpm run test` separately.
- Run `pnpm run test:consumer` when a change touches the published package, its dependencies, or its
  exports. It needs network access, so `pnpm run test` leaves it out.

### Verification traps

- A clean checkout can still be behind its remote, and a pull request's head can move after you read
  it. Fetch, and read the head SHA again, before you review or build on a branch.
- Do not use `git stash` to compare check results with and without a change. The stashed run leaves
  `dist/` built from the wrong sources, Turbo caches it, and later runs fail with errors such as
  `TS2307: Cannot find module '@luke-ui/react/box'`. Compare in a separate worktree instead.
- Only the root `pnpm run check` runs `check:format-root`, which covers files outside packages such
  as `docs/*.md`, and knip (`check:cycles`, `check:unused`). If `check:format-root` fails on
  Markdown wrapping, run `pnpm run fix:format-root`. Do not re-wrap by hand.
- The Turbo cache is shared across worktrees, so `FULL TURBO` can replay another branch's result.
  For a real run, use `TURBO_FORCE=true pnpm run test`, not `pnpm run test -- --force`.
- publint runs on every build through `publint: true` in `packages/@luke-ui/react/vite.config.ts`.
  Do not add a `check:publint` script.
- Lint rules live in the `lint` block of the root `vite.config.ts`. A `.oxlintrc.json` file is
  ignored, and oxlint has no `no-restricted-syntax` rule. Two `lint.overrides` entries matching the
  same file and rule do not merge: the later entry wins.
- In `apps/docs`, a `src/lib/` module imported by a client component must not import `node:fs` or
  `node:path`. If it does, the page returns HTTP 200 but its MDX body renders empty.
- Turbo behaviour varies by version. Before changing Turbo config or commands, read the bundled
  `docs/` of the installed package, found with `node -p "require.resolve('turbo/package.json')"`.

## Papercuts

- When your current task runs into repository friction or technical debt you can point to, record it
  in `.agents/papercuts.md`. Read its header first.
- When your task or PR fixes the symptom, remove its entry in the same change, or do not add one.
- When a user or reviewer corrects a mistake that existing guidance or a skill should have
  prevented, record the gap there too, even after you fix the mistake, unless the same change also
  updates the guidance.
- Recording a papercut is allowed in any PR, as a separate commit. It is not permission to fix the
  problem. If you can't commit, report it in your final message.
