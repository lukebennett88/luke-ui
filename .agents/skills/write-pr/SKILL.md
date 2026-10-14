---
name: write-pr
description: >-
  Write or refresh a pull request title and body from the current diff. Use when asked to open,
  update, or describe a pull request, or when work-on-issue delegates publication. Draft-only
  requests produce text without publishing. Never review, approve, or merge.
---

# Write PR

Describe the current diff as a pull request title and body. Publish on explicit request or
delegation from [work-on-issue](../work-on-issue/SKILL.md). A draft-only request produces text.
Follow [shared-rules.md](../shared-rules.md).

Never review, approve, or merge.

## Workflow

1. Inspect the net diff, relevant commits, linked issues, and existing title and body.
2. Describe the resulting change and why it matters. Refresh stale metadata after review changes.
3. Include meaningful public API, breaking, or migration implications. Add examples only when
   useful. Omit implementation history and mandatory boilerplate.
4. Relay existing verification evidence accurately. Do not rerun tests solely for metadata.
5. Link parents for context. Use closing keywords only for issues whose full acceptance criteria the
   pull request satisfies.
