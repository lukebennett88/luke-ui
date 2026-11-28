---
name: write-issue
description: >-
  Investigates a problem and drafts a GitHub issue for Luke UI. Use when asked to file, draft, or
  write up an issue, to turn a bug or finding into an issue, to check whether an issue already
  exists, or to update an issue after it is resolved.
---

# Write an issue

A good issue lets someone act on it without repeating your investigation or reopening settled
decisions. It is not an implementation spec. Follow
[DOCUMENTATION.md](../../../docs/DOCUMENTATION.md#writing-style) for prose, and the
[repository guides](../../../README.md#repository-guides) that govern the problem.

## Before you write

1. Search open and closed issues for the same problem or outcome. When an existing issue owns it,
   propose updating that issue. Give distinct, actionable work its own issue rather than stretching
   a loosely related one.
2. Investigate in proportion. Reproduce a bug when practical, and keep the evidence, such as a
   failing command, an accessibility tree, or a screenshot. For a task, read enough code and docs to
   state the problem and the decisions already made. Say what you confirmed and what you assumed.

## Write

Use [#771](https://github.com/lukebennett88/luke-ui/issues/771), a bug, and
[#799](https://github.com/lukebennett88/luke-ui/issues/799), a task, as examples, not templates.
Leave out empty sections.

- Title a bug by its symptom and a task by its outcome, such as "Add a composed Dialog for Luke UI
  1.0", so the title still fits if the fix changes.
- Start with `Parent: #n.` and where the problem was found, when those apply.
- Explain what happens now, what should happen, and who it affects.
- Include a cause only when you confirmed it, and an approach only when it is decided or technically
  required. Present anything else as an open question.
- List decisions already made and what is out of scope.
- Write completion criteria as checkboxes for verifiable outcomes, not steps to follow.
- Link evidence with permalinks pinned to a commit. Plain paths are fine for general navigation. Put
  long reproduction notes and investigation in a collapsed `<details>` block.

Keep large work in one issue, even when it needs several pull requests. Use native sub-issues only
when parts need separate tracking. Create no epic or tracking issue by default.

## Work context

Give each actionable open issue exactly one work-context label for its next useful action. Label a
pull request too when it helps pick the next review or fix.

- `context:phone`: the action needs no local edit/test loop. Examples are discussing requirements,
  researching a decision, clarifying acceptance criteria, delegating a well-specified task, and
  reviewing a pull request remotely.
- `context:desktop`: the action needs a local environment. Examples are hands-on edit/test work,
  device or browser testing, live visual assessment, debugging, and prototyping.

Classify the next action, not all the work to close the issue. A code task that can be delegated and
reviewed remotely is `context:phone`. Blocked work takes the label of its next actionable step.
Replace the label as work progresses. Work context is independent of priority, ownership, issue
type, `ready-for-agent`, and `claimed`. Revisit ambiguous cases during triage instead of adding
labels.

## Publish

Return the title and body as a draft unless you are asked to create or edit the issue. Add
`ready-for-agent` only when told the issue is ready for an agent, apply the
[work-context label](#work-context), and add no other labels. Read the issue back after you create
or edit it.

## Update a resolved issue

When asked, put the outcome first, with a link to the pull request or decision that resolved it.
Move the original write-up into a collapsed `<details>` block when it is still useful.
[#776](https://github.com/lukebennett88/luke-ui/issues/776) is an example.
