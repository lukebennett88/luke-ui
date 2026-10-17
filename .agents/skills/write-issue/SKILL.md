---
name: write-issue
description: >-
  Investigates a problem and drafts a GitHub issue for Luke UI. Use when asked to file, draft, or
  write up an issue, to turn a bug or finding into an issue, to check whether an issue already
  exists, or to update an issue after it is resolved.
---

# Write an issue

A good issue lets someone act on it without repeating your investigation or reopening decisions that
are already made. It is not an implementation spec.

Use `git` and `gh` when they are available. Equivalent tools and connectors are fine.

Follow [DOCUMENTATION.md](../../../docs/DOCUMENTATION.md#writing-style) for prose, and consult the
[repository guides](../../../README.md#repository-guides) that govern the problem.

## Before you write

1. Search open and closed issues for the same problem or outcome. When an existing issue owns it,
   propose updating that issue instead of opening another. Do not stretch a loosely related issue to
   avoid a new one. Distinct, actionable work gets its own issue.
2. Investigate in proportion. Reproduce a bug when practical, and keep the evidence, such as a
   failing command, an accessibility tree, or a screenshot. For a task, read enough code and docs to
   state the problem and the decisions already made. Say what you confirmed and what you assumed.

## Write

Use [#771](https://github.com/lukebennett88/luke-ui/issues/771), a bug, and
[#799](https://github.com/lukebennett88/luke-ui/issues/799), a task, as examples, not as a template.
Leave out any section that has nothing in it.

- Title a bug after its symptom and a task after its outcome, such as "Add a composed Dialog for
  Luke UI 1.0". The title should still fit if the fix changes.
- Start with `Parent: #n.` and where the problem was found, when those apply.
- Explain the problem or why the work matters: what happens now, what should happen, and who it
  affects.
- Include a cause only when you confirmed it, and an approach only when it is decided or technically
  required. Present anything else as an open question.
- List decisions already made and what is out of scope.
- Write completion criteria as checkboxes for outcomes someone can verify, not steps to follow.
- Link specific evidence with permalinks pinned to a commit. Plain paths are fine for general
  navigation. Put long reproduction notes and investigation in a collapsed `<details>` block.

Keep large work in one issue, even when it needs several pull requests. Use native sub-issues only
when parts need to be tracked separately. Do not create an epic or tracking issues by default.

## Work context

Classify the next useful action during issue triage and handoff. Apply exactly one work-context
label to each actionable open issue, and to a PR when it helps select the next review or fix.

| Label             | Next useful action                                                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `context:phone`   | Discuss requirements, research a decision, clarify acceptance criteria, delegate a sufficiently specified task, or review a PR remotely. The maintainer needs no local edit/test loop for that action. |
| `context:desktop` | Work hands-on with a local development environment, fast edit/test feedback, device or browser testing, live visual assessment, debugging, or exploratory prototyping.                                 |

A code task can be `context:phone` when the maintainer can delegate it and review the result
remotely. Agent assistance does not make an action `context:phone` when the maintainer needs a
running local environment to direct or verify it.

Classify the next action, not all the work needed to close the issue. Replace the stale context
label as work progresses, such as phone discussion, desktop implementation, then phone review. For
blocked work, classify the next actual actionable step, such as discussing the blocker or reviewing
a dependency. Do not imply that blocked implementation can proceed.

Work context does not express priority, complexity, ownership, issue type, or agent readiness. Keep
existing labels for those purposes. `ready-for-agent` means sufficiently specified for autonomous
implementation, independently of work context. `claimed` continues to mean claimed. Revisit
ambiguous classifications during regular triage instead of adding more context labels.

## Publish

Return the title and body as a draft unless you are asked to create or edit the issue. Add the
`ready-for-agent` label only when you are told the issue is ready for an agent. Apply the
[work-context rules](#work-context), and add no other labels. After you create or edit an issue,
read it back to confirm it.

## Update a resolved issue

When asked, put the outcome first, with a link to the pull request or decision that resolved it.
Move the original write-up into a collapsed `<details>` block when it is still useful.
[#776](https://github.com/lukebennett88/luke-ui/issues/776) is an example.
