# Luke UI agent guide

Workflow and specialist skills live in `.agents/skills/`. Claude Code loads the same files through
`.claude/skills`, a symlink to that directory.

## Task routing

- Investigating or writing GitHub issues: follow
  [.agents/skills/make-issue/SKILL.md](.agents/skills/make-issue/SKILL.md).
- Implementing an issue and delivering a reviewable pull request: follow
  [.agents/skills/work-on-issue/SKILL.md](.agents/skills/work-on-issue/SKILL.md). That request
  authorises task-scoped commits, pushing the task branch, and opening its pull request.
  Investigation, planning, and review do not. Honour narrower stopping points.
- Creating or updating a pull request title and body: follow
  [.agents/skills/write-pr/SKILL.md](.agents/skills/write-pr/SKILL.md).
- Reviewing a pull request or diff: follow
  [.agents/skills/review-pr/SKILL.md](.agents/skills/review-pr/SKILL.md).
- Documentation, including pull request reviews that touch it: follow
  [.agents/skills/write-docs/SKILL.md](.agents/skills/write-docs/SKILL.md). This covers MDX pages in
  `apps/docs/content/docs/`, `docs/*.md`, READMEs, and JSDoc when it is the main task or documents a
  new public export or prop.
- Writing, changing, or reviewing tests, including pull request reviews that touch them: follow
  [.agents/skills/write-tests/SKILL.md](.agents/skills/write-tests/SKILL.md).
- Read the whole `SKILL.md` of every skill that applies before you write or review. To review a pull
  request, first check whether its diff touches documentation, tests, or both. A grep, an excerpt,
  or a skill listing is not a read.
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

- When your current task runs into repository friction or technical debt you can point to, follow
  [.agents/papercuts.md](.agents/papercuts.md). Read its header first.
- When your task or PR fixes the symptom, remove its entry in the same change, or do not add one.
- When existing guidance or a skill should have prevented a mistake, follow the handoff in that
  file. Review drafts stay **not recorded**. Authorised implementation records qualifying entries or
  explains omissions.
- Recording a papercut is allowed in any PR. When committing is authorised, use a separate commit.
  It is not permission to fix the problem. If you can't commit, report it in your final message.
