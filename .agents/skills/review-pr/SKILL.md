---
name: review-pr
description: >-
  Review a Luke UI pull request or the current diff and report evidenced findings. Use when asked to
  review a PR, review a diff, or self-review before publication in this repository. Prefer this
  skill over bundled code-review here. Read-only by default: do not edit files, commit, push,
  approve, merge, or publish a GitHub review unless separately and explicitly authorised. Do not use
  to implement fixes.
---

# Review PR

Review a pull request or the current diff and report evidenced findings. Review is read-only by
default, including self-review. File edits, commits, pushes, and published GitHub reviews require
separate explicit authority. Do not implicitly approve or merge. Requests to fix findings transfer
to [work-on-issue](../work-on-issue/SKILL.md).

When the diff includes documentation, also follow [write-docs](../write-docs/SKILL.md). When it
includes tests, also follow [write-tests](../write-tests/SKILL.md). Follow
[shared-rules.md](../shared-rules.md).

## Workflow

1. Inspect the exact diff and revision, surrounding code, tests, issue intent, public contracts, and
   guidance. Prioritise correctness, regressions, accessibility, relevant security, API contracts,
   and verification gaps. Give severity, precise locations, and evidence. Exclude speculation,
   preferences, and advice that contradicts guidance.
2. Establish check side effects before execution. In the reviewed checkout, preserve existing files
   and staging state. At most write disposable ignored artifacts. Run checks that may rewrite
   source, generated files, or snapshots in disposable isolation at the exact PR revision when
   practical. Disclose that committed-code checks do not verify extra uncommitted changes.
3. Do not run format fixes, snapshot updates, or other modifying acceptance commands as
   verification. Never clean up side effects by resetting, cleaning, stashing, or restoring the
   checkout. Remove only disposable resources created by the review. Isolation needs no extra
   approval. Unsafe checks are **not run**, with reasons.
4. Inspect CI for the reviewed revision and report verification using the shared evidence rules.
5. Report qualifying papercuts without writing the log. Follow
   [.agents/papercuts.md](../../papercuts.md): report the defect once, supply a draft in the
   `Seen`/`Where`/`Problem` format, reference the finding and any matching entry, and mark it **not
   recorded**.
