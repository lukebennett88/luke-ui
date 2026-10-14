---
name: work-on-issue
description: >-
  Implement a GitHub issue and deliver a reviewable pull request. Use when asked to implement, work
  on, or fix an issue, or to deliver a PR for a tracked issue. Authorises task-scoped branch work,
  commits, pushing the task branch, and PR creation through write-pr, unless the request stops at
  investigation, planning, or verification. Do not use for drafting issues, reviewing someone else's
  PR, approving, or merging.
---

# Work on issue

Implement a GitHub issue and deliver a reviewable pull request.

"Implement #123" or "work on #123" authorises task-scoped branch or worktree creation, edits,
verification, staging, commits, pushing the task branch, and pull request creation or updates
through [write-pr](../write-pr/SKILL.md). That request satisfies a general "do not commit unless
instructed" restriction. Explicit investigation, implementation, or verification stopping points
override the default.

This does not authorise default-branch pushes, force-pushing existing history, destructive Git
operations, changes to unrelated issues or pull requests, published GitHub reviews, approval, or
merging.

When the work touches documentation, follow [write-docs](../write-docs/SKILL.md). When it touches
tests, follow [write-tests](../write-tests/SKILL.md). Follow [shared-rules.md](../shared-rules.md).

## Choose the work boundary

- Inspect the branch, working tree, index, attached worktrees, and issue or pull request context
  before editing. Reuse work that clearly belongs to the task. Ask when unclear ownership materially
  affects it.
- Isolate independent work, preferably in a worktree from the verified remote default branch or
  requested base. A new branch in a dirty checkout does not isolate changes. Report a blocker if
  safe isolation is unavailable.
- Inspect parent criteria, native sub-issues, dependencies, and existing work. Select one coherent
  incomplete unit unless the whole parent is requested. Prefer ready prerequisites. State the scope
  and reason before editing. Keep coupled work together when necessary. Existing sub-issues are not
  a prerequisite.
- Preserve parent-child relationships. Selecting work does not authorise restructuring issues. A
  whole-parent request may need several pull requests. Completing one unit does not complete that
  request.

## Verify before publication

Use repository gates and specialist workflows to verify changed behaviour. Investigate failures
before assigning cause. Where practical, reproduce suspected baseline failures in isolation at the
appropriate base revision with comparable commands and conditions. Record revisions, commands, and
observations. Failure before edits alone proves neither failure on base nor independence from the
task.

| Verification state                                                                                                     | Ready-for-review PR?                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Applicable local checks pass; required CI-only checks await publication or execution                                   | Yes. Identify pending checks.                                                                            |
| Proven pre-existing, unrelated failure; changed behaviour remains meaningfully verified and its applicable checks pass | Yes. Disclose evidence and gaps. Do not expand scope to fix unrelated failures. Merge gates still apply. |
| Introduced, task-related, or unresolved failure                                                                        | No. Investigate and resolve it.                                                                          |
| Baseline failure prevents meaningful verification of changed behaviour                                                 | No. Report the blocker.                                                                                  |
| Incomplete implementation, blocking review findings, or unresolved decision                                            | No. Report the blocker.                                                                                  |

During the active workflow, inspect available CI results, investigate task-related failures, rerun
affected checks, and refresh pull request status. On return, identify pending or not-run checks and
any unrelated or infrastructure blockers. A skipped required job needs an explanation. Do not claim
full verification or continuing monitoring unless supported or arranged.

## Inspect and review

Inspect every final diff for completeness, unintended edits, documentation accuracy, and
verification claims. Apply [review-pr](../review-pr/SKILL.md) for public API changes,
accessibility-sensitive behaviour, shared infrastructure, complex logic, or other meaningful
regression risks. Use risk, not line count. Routine docs corrections and mechanical edits normally
need only diff inspection and applicable checks.

Self-review remains read-only, even within implementation. It may use the same agent. It does not
count as independent human review or approval. Return to implementation to address findings,
evaluate pending papercuts, and rerun affected checks. Re-review materially changed areas when
needed, without automatically repeating the full review.

Papercut recording follows [.agents/papercuts.md](../../papercuts.md). Self-review drafts stay **not
recorded**. Authorised implementation records qualifying entries or explains omissions.

## Finish

Report the implemented scope, remaining parent work or blockers, verification evidence, and pull
request state. Do not claim partial work is complete.
