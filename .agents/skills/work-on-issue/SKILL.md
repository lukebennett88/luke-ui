---
name: work-on-issue
description: >-
  Implements a Luke UI GitHub issue and delivers a pull request. Use when asked to implement, work
  on, or fix an issue by number or link.
---

# Work on an issue

## Authority

An explicit request to implement an issue or open its pull request authorises task-scoped worktrees,
edits, verification, staging, commits, pushing the task branch, and opening or updating the pull
request through [write-pr](../write-pr/SKILL.md). It counts as the instruction that a general "do
not stage or commit unless instructed" rule asks for. Investigation, planning, and review requests
carry none of this.

Honour narrower stopping points. Merging, published reviews, default-branch pushes, force-pushing
existing history, and destructive Git operations stay outside this authority.

## Start

1. Read the issue, its comments, its parent, and linked pull requests. Inspect the working tree,
   index, branch, and worktrees. Fetch the base and verify its remote SHA.
2. Add the `claimed` label to the issue you implement, not to its parent. When the issue is already
   claimed by something other than work you are resuming, such as an existing branch or pull request
   for it, ask before you start.
3. Work in a task worktree. Reuse one that exists for the same issue or pull request, and treat its
   uncommitted changes as part of the work: build on them, commit them with it, and ask about any
   that don't fit the issue. Otherwise create one from `origin/main`, or the base the request names,
   and run `pnpm install` in it.
4. Name the branch `luke/<issue-number>-<short-slug>`, for example
   `luke/768-theme-input-validation`. The prefix names the person responsible for the code, never
   the agent that wrote it.
5. Before your first edit, confirm that the working directory and the Git root are the worktree.
   Agents have edited the main checkout while reporting a worktree path.
6. State a short plan in chat, then start without waiting.

Deliver the whole issue in one pull request unless it is too large to review or holds parts that can
ship separately. Then say which part this pull request covers, and open no new issues for the rest.

## Build

- Follow the applicable [repository guides](../../../README.md#repository-guides), and
  [write-tests](../write-tests/SKILL.md) and [write-docs](../write-docs/SKILL.md) for tests and
  documentation. Keep [docs and skills current](../../../docs/DOCUMENTATION.md#keeping-docs-current)
  in the same change as the code.
- Stop and ask when a decision affects public API, accessibility, significant architecture,
  security, or the issue's scope, or when the issue contradicts a decision already made. Settle
  routine details by following existing code. Mention a decision in the pull request only when a
  reviewer needs it.
- Stay in scope. Fix small friction the task runs into, and follow
  [papercuts.md](../../papercuts.md) for the rest. Mention unrelated problems in your final report,
  with the issue that owns them when one exists.

## Verify

1. Run tasks through Turbo from the repository root, including focused runs of one test file, so
   their generate and build dependencies run. [WORKFLOWS.md](../../../docs/WORKFLOWS.md#commands)
   shows the form. Before changing Turbo configuration, read the installed package's bundled
   `docs/`, found with `node -p "require.resolve('turbo/package.json')"`.
2. Run, from the repository root:
   - `pnpm run lint:changed` before committing JS/TS changes. It lints files that differ from the
     merge base with `origin/main` under `--deny no-nested-ternary`. It skips untracked files, so
     stage new files first when staging is authorised.
   - `pnpm run check` for every change, and `pnpm run test:code` before opening the pull request.
     Fix formatting with `pnpm run fix:format`, not by hand.
   - `pnpm run test:visual` when Docker is available. Otherwise report it as **not run** and read
     CI's `compare` job. A passing job can still list visual differences. See
     [VISUAL_TESTING.md](../../../docs/VISUAL_TESTING.md#review) and
     [Reading CI](../../../docs/WORKFLOWS.md#reading-ci).
   - The relevant separate suites in [TESTING.md](../../../docs/TESTING.md), including
     `pnpm run test:consumer` for published package code, dependencies, or exports, and
     `pnpm run build:docs` for generated documentation behaviour such as props tables or
     type-definition assets.
3. Before you call a failure unrelated, reproduce it on the base revision under comparable
   conditions in a separate worktree, and note the revision. Existing evidence, such as a papercut
   entry or a failed CI run on the base, can be enough. A failure your change causes blocks the pull
   request. Report unrelated failures and verify the rest.
4. To undo your own edit or remove a probe file, edit or delete that file by path. To test against a
   pre-change file, use a temporary copy or a separate worktree. `git stash`, `git checkout --`,
   `git restore`, `git reset`, and `git clean` can discard work in progress, and a stash does not
   isolate generated build outputs or their cache.
5. Read the whole diff and apply the easy-to-miss checks in
   [review-pr](../review-pr/SKILL.md#review) before committing. Run a full review-pr when the risk
   warrants it, such as a change to public API, accessibility behaviour, shared infrastructure, or
   complex logic. Fix every blocking finding before you open the pull request, and fix the small
   issues that are worth it.

After addressing review findings, check the current [papercut log](../../papercuts.md#handoff).
Record qualifying candidates or recurrences, or explain why each omitted candidate does not qualify.
Self-review itself stays read-only, so return to implementation before changing the log or fixing
findings.

## Deliver

1. Commit with a plain imperative subject, such as "Validate authored theme inputs before
   inheritance". Push the branch and open the pull request with [write-pr](../write-pr/SKILL.md).
2. While you are still working, check CI for the head SHA and fix failures the change caused.
3. Update the parent issue only when the issue asks you to, and only once the work is verified.
   Never mark unfinished work as done.
4. Keep the worktree until the pull request is merged or the work is abandoned.

Stop earlier when the request says to, for example "investigate #123" or "don't open a PR yet". When
you stop without a pull request, remove `claimed` if this workflow added it, and say so.

Finish with what you changed and what is left of the issue, and report checks as
[AGENTS.md](../../../AGENTS.md) describes. Pending CI is not a failure.
