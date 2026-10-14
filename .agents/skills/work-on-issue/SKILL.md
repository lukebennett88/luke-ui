---
name: work-on-issue
description: >-
  Implements a Luke UI GitHub issue and delivers a pull request. Use when asked to implement, work
  on, or fix an issue by number or link.
---

# Work on an issue

1. Read the issue, its parent, and linked pull requests with `gh issue view <n> --comments`. When
   the issue is too large for one pull request, choose one piece that stands on its own. Say which
   piece you chose and why before you start.
2. Check `git status` and `git worktree list`. When the checkout has changes that are not part of
   this task, start a new worktree from `origin/main` instead of working around them.
3. Make the change. Follow [write-tests](../write-tests/SKILL.md) for tests,
   [write-docs](../write-docs/SKILL.md) for documentation, and the guides that
   [AGENTS.md](../../../AGENTS.md) routes to for the code you touch.
4. Verify from the repo root:
   - `pnpm run check`
   - `TURBO_FORCE=true pnpm run test`
   - `pnpm run test:consumer` when the change touches the published package, its dependencies, or
     its exports
5. When a check fails, run the same command on the base revision before you call the failure
   unrelated, and note the revision. A failure your change causes blocks the pull request. An
   unrelated failure does not, as long as the rest of the change is verified and the pull request
   says so.
6. Read the whole diff. When it changes public API, accessibility behaviour, or shared
   infrastructure, review it with [review-pr](../review-pr/SKILL.md). Fix every blocking finding
   before you open the pull request, and fix the small issues that are worth it. Mention a
   deliberate deferral in the pull request only when it matters.
7. Commit with a plain imperative subject, such as "Validate authored theme inputs before
   inheritance". Push the branch and open the pull request with [write-pr](../write-pr/SKILL.md).

Stop earlier when the request says to, for example "investigate #123" or "don't open a PR yet".
Never push to `main`, force-push, or merge.

Finish with what you changed, what is left of the issue, and which checks passed, failed, or did not
run.
