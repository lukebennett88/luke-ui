---
name: work-on-issue
description: >-
  Implements a Luke UI GitHub issue and delivers a pull request. Use when asked to implement, work
  on, or fix an issue by number or link.
---

# Work on an issue

Use `git` and `gh` when they are available. Equivalent tools and connectors are fine.

## Start

1. Read the issue, its comments, its parent, and linked pull requests.
2. Add the `claimed` label to the issue you will implement, not to a parent it belongs to. When the
   issue already has `claimed`, check whether the claim belongs to work you are resuming, such as an
   existing branch or pull request for this issue. When it doesn't, ask before you start.
3. Work in a worktree for this task. Reuse one that already exists for the same issue or pull
   request. Otherwise create one from `origin/main`, or from the base branch the request names, and
   install dependencies in it with `pnpm install`.
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

- Follow [write-tests](../write-tests/SKILL.md) for tests, [write-docs](../write-docs/SKILL.md) for
  documentation, and the guides that [AGENTS.md](../../../AGENTS.md) routes to for the code you
  touch.
- Stop and ask when a decision affects public API, accessibility, significant architecture,
  security, or the issue's scope, or when the issue contradicts a decision already made. Settle
  routine details by following existing code. Mention a decision in the pull request only when a
  reviewer needs it.
- Stay in scope. Fix small friction the task runs into, and follow
  [papercuts.md](../../papercuts.md) for the rest. Mention unrelated problems in your final report,
  with the issue that owns them when one exists.

## Verify

1. Run the affected tests while you work.
2. Before you open the pull request, run `pnpm run check` and `TURBO_FORCE=true pnpm run test` from
   the repo root, plus each separately run suite in [TESTING.md](../../../docs/TESTING.md) that
   covers what you changed.
3. Before you call a failure unrelated, show that it also happens on the base revision under
   comparable conditions, and note the revision. Rerun only what you need. Existing evidence, such
   as a papercut entry or a failed CI run on the base, can be enough. A failure your change causes
   blocks the pull request. An unrelated failure does not, as long as the rest of the change is
   verified and the pull request says so.
4. Read the whole diff. Review it with [review-pr](../review-pr/SKILL.md) when the risk warrants it,
   for example a change to public API, accessibility behaviour, shared infrastructure, or complex
   logic. Fix every blocking finding before you open the pull request, and fix the small issues that
   are worth it.

## Deliver

1. Commit with a plain imperative subject, such as "Validate authored theme inputs before
   inheritance". Push the branch and open the pull request with [write-pr](../write-pr/SKILL.md).
2. While you are still working, check CI for the head SHA and fix failures the change caused.
3. Leave the parent issue alone unless the issue asks you to update it. Then update it once the work
   is verified, and never mark unfinished work as done.
4. Keep the worktree until the pull request is merged or the work is abandoned.

Stop earlier when the request says to, for example "investigate #123" or "don't open a PR yet". When
you stop working on the issue without a pull request, remove `claimed` if this workflow added it,
and say so. Never push to `main`, force-push, or merge.

Finish with what you changed and what is left of the issue. Report each check as passed, failed,
pending, or not run, as [AGENTS.md](../../../AGENTS.md) describes. Pending CI is not a failure.
