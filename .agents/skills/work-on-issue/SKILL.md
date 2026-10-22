---
name: work-on-issue
description: >-
  Implements a Luke UI GitHub issue and delivers a pull request. Use when asked to implement, work
  on, or fix an issue by number or link.
---

# Work on an issue

Use `git` and `gh` when they are available. Equivalent tools and connectors are fine.

## Authority

An explicit request to implement an issue or open its PR authorises task-scoped worktrees, edits,
verification, staging, commits, pushing the task branch, and PR creation or updates through
[write-pr](../write-pr/SKILL.md). It supplies the instruction required by a general "do not stage or
commit unless instructed" rule. Investigation, planning, and review requests do not.

Honour narrower stopping points. This authority excludes merging, published reviews, default-branch
pushes, force-pushing existing history, and destructive Git operations.

## Start

1. Read the issue, its comments, its parent, and linked pull requests. Inspect the working tree,
   index, branch, and worktrees. Fetch the base and verify its remote SHA before building on it.
2. Add the `claimed` label to the issue you will implement, not to a parent it belongs to. When the
   issue already has `claimed`, check whether the claim belongs to work you are resuming, such as an
   existing branch or pull request for this issue. When it doesn't, ask before you start.
3. Work in a worktree for this task. Reuse one that already exists for the same issue or pull
   request. Otherwise create one from `origin/main`, or from the base branch the request names, and
   install dependencies in it with `pnpm install`. Uncommitted changes in a reused worktree are part
   of the work you are resuming, so build on them and commit them with it. Ask about any that don't
   fit the issue.
4. Name the branch `luke/<issue-number>-<short-slug>`, for example
   `luke/768-theme-input-validation`. The prefix names the person responsible for the code, whoever
   wrote it. Never use an agent's name, such as `claude/` or `cursor/`.
5. Before your first edit, confirm that the working directory and the Git root are the worktree.
   Agents have edited the main checkout while reporting a worktree path.
6. State a short plan in chat, then start without waiting.

Aim to deliver the whole issue in one pull request. Split it only when the work is too large to
review or holds changes that can ship separately, and say which part this pull request covers. Do
not open new issues for the parts you leave.

## Build

- Consult the guides for the surfaces you touch before implementing:
  - JS/TS/React: [CONVENTIONS.md](../../../docs/CONVENTIONS.md), including incidental
    [comments and JSDoc](../../../docs/DOCUMENTATION.md#comments-and-jsdoc).
  - Components, primitives, and icons: [COMPONENTS.md](../../../docs/COMPONENTS.md).
  - Public exports, props, and types: [PUBLIC_API.md](../../../docs/PUBLIC_API.md).
  - CSS, recipes, and themes: [STYLING.md](../../../docs/STYLING.md).
  - Dependencies and release metadata: [DEPENDENCIES.md](../../../docs/DEPENDENCIES.md).
  - Tests: [write-tests](../write-tests/SKILL.md). Documentation:
    [write-docs](../write-docs/SKILL.md).
- Keep [docs and skills current](../../../docs/DOCUMENTATION.md#keeping-docs-current) in the same
  change as the code.
- Stop and ask when a decision affects public API, accessibility, significant architecture,
  security, or the issue's scope, or when the issue contradicts a decision already made. Settle
  routine details by following existing code. Mention a decision in the pull request only when a
  reviewer needs it.
- Stay in scope. Fix small friction the task runs into, and follow
  [papercuts.md](../../papercuts.md) for the rest. Mention unrelated problems in your final report,
  with the issue that owns them when one exists.

## Verify

1. Run tasks through Turbo from the repository root so their generate and build dependencies run.
   Before changing Turbo configuration or commands, read the installed package's bundled `docs/`,
   found with `node -p "require.resolve('turbo/package.json')"`.
2. When the diff adds or modifies JS/TS files, run
   `pnpm exec vp lint --deny no-nested-ternary <changed-files>` from the repository root before
   committing, passing every such file. This enforces
   [Code style](../../../docs/CONVENTIONS.md#code-style) on the change without requiring unrelated
   cleanup. Run `pnpm run check` for every change. It covers barrels, format (including root
   Markdown), lint, types, docs, cycles, and unused code. For formatting failures, use
   `pnpm run fix:format` rather than re-wrapping Markdown by hand. Before opening the PR, run
   `pnpm run test` separately; Turbo test tasks are configured not to cache results. Run the
   separate suites in [TESTING.md](../../../docs/TESTING.md) that cover the change, including
   `pnpm run test:consumer` for published package code, dependencies, or exports. When the change
   affects generated documentation behaviour, such as props tables or type-definition assets, also
   run `pnpm run build:docs` so the production docs output is checked, including
   `check:type-definition-links`.
3. Before you call a failure unrelated, show that it also happens on the base revision under
   comparable conditions, and note the revision. Rerun only what you need. Existing evidence, such
   as a papercut entry or a failed CI run on the base, can be enough. A failure your change causes
   blocks the pull request. An unrelated failure does not, as long as the rest of the change is
   verified and the pull request says so. Compare in a separate worktree: stashing does not isolate
   generated build outputs or their cache. To undo your own edit or remove a probe file, edit or
   delete that file by path. Do not run `git stash`, `git checkout -- <path>`, `git restore`,
   `git reset`, or `git clean` in a task checkout, even on your own uncommitted changes: each can
   discard other work in progress.
4. Read the whole diff. Apply the easy-to-miss checks in [review-pr](../review-pr/SKILL.md#review)
   before committing. Review it with [review-pr](../review-pr/SKILL.md) when the risk warrants it,
   for example a change to public API, accessibility behaviour, shared infrastructure, or complex
   logic. Fix every blocking finding before you open the pull request, and fix the small issues that
   are worth it.

After addressing review findings, check the current [papercut log](../../papercuts.md#handoff).
Record qualifying candidates or recurring occurrences, or explain why each omitted candidate does
not qualify. Self-review itself stays read-only. Return to implementation before changing the log or
fixing findings.

## Deliver

1. Commit with a plain imperative subject, such as "Validate authored theme inputs before
   inheritance". Push the branch and open the pull request with [write-pr](../write-pr/SKILL.md).
2. While you are still working, check CI for the head SHA and fix failures the change caused.
3. Leave the parent issue alone unless the issue asks you to update it. Then update it once the work
   is verified, and never mark unfinished work as done.
4. Keep the worktree until the pull request is merged or the work is abandoned.

Stop earlier when the request says to, for example "investigate #123" or "don't open a PR yet". When
you stop working on the issue without a pull request, remove `claimed` if this workflow added it,
and say so.

Finish with what you changed and what is left of the issue. Report each check as passed, failed,
pending, or not run, as [AGENTS.md](../../../AGENTS.md) describes. Pending CI is not a failure.
