---
name: write-issue
description: >-
  Investigates a problem and drafts a GitHub issue for Luke UI. Use when asked to file, draft, or
  write up an issue, to turn a bug or finding into an issue, or to check whether an issue already
  exists.
---

# Write an issue

A good issue lets someone pick up the work without repeating your investigation or reopening
decisions that are already made.

1. Search for an existing issue with `gh issue list --search "<terms>" --state all`. When one covers
   the problem, suggest updating it instead of opening a duplicate.
2. Confirm the problem from the code, the tests, or a browser. Keep the evidence: a failing command,
   an accessibility tree, a screenshot, or a file and line.
3. Title a bug after its symptom and a task after its outcome, for example "Trigger-width Select and
   Combobox popovers overflow an edge-to-edge field and close on open".
4. Write the body in this order:
   - **Problem**: the current behaviour, the expected behaviour, and who it affects.
   - **Completion checklist**: outcomes someone can verify, not a list of files to edit.
   - **Scope**: what is out of scope, and decisions that are already made.
   - Long reproduction notes and investigation, in a collapsed `<details>` block.
5. Link the parent issue, or the issue or PR where you found the problem.
6. Name a file, helper, or approach only when it is already decided or technically required. Leave
   the rest to whoever implements it.
7. When the work is too large for one pull request, split it into sub-issues of a parent issue
   rather than a task checklist.

[#771](https://github.com/lukebennett88/luke-ui/issues/771) is a good model.

Return the title and body as a draft unless you are asked to create the issue. After you create or
edit an issue, read it back with `gh issue view` to confirm it.
