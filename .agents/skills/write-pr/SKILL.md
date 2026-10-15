---
name: write-pr
description: >-
  Writes or updates a Luke UI pull request title and body from its diff. Use when opening a pull
  request, drafting pull request text, or refreshing a description after new commits.
---

# Write a pull request

A reviewer reads the description before the diff. Tell them what changed, why, and how you know it
works. Keep it short. Most pull requests need one paragraph and a verification section.

1. Read the net diff against the base branch with `git diff <base>...HEAD`. Describe that diff, not
   the latest commit or the order you did the work in.
2. Write the title as a plain imperative sentence, like a commit subject. Do not add a prefix such
   as `feat:`.
3. Open with a short paragraph on the problem and the change. Add a `## Changes` list only when a
   paragraph can't carry it.
4. Describe public API changes, breaking changes, and what a consumer must change, when there are
   any.
5. When the rendered UI changes and a comparison helps the reviewer, add before and after
   screenshots side by side in a table. Upload them with `--attach` on `gh pr create` or
   `gh pr edit`, and reference each file from the table, as in `![Before](./before.png)`. Do not
   commit images to the branch. When you can't upload, say so. For an interaction change, a short
   recording or a test often shows more than a screenshot.
6. End with `## Verification`. Give the checks that ran locally and their results, and the CI checks
   that are pending or failed. Name the checks you did not run and why. Give the SHA the results
   apply to, and the base revision for a failure that also happens on the base. Summarise output
   instead of pasting it.
7. Write `Closes #n` only when the pull request completes the issue. Otherwise write `Refs #n`.

Leave out process notes, history, and lines such as "Do not merge until review is complete".
[#807](https://github.com/lukebennett88/luke-ui/pull/807) is a good model.

## Publish

Return the text as a draft unless you are asked to open or update the pull request.

- Open the pull request ready for review when the work is complete and the local checks that apply
  pass, even while CI is pending. Open it as a draft when work is unfinished, a blocking finding or
  decision is open, or a failure prevents a meaningful review, and say what is missing.
- Add the `claimed` label to the issue the pull request implements if it does not have it yet. Do
  not label a parent issue that the pull request only links to.
- Do not add reviewers, assignees, or labels to the pull request.
- After you publish, read the pull request back with `gh pr view` to confirm it.

## Update

Edit the description only when the direction changes, when something a reviewer should know is
added, or when a statement in it has become wrong. Rewrite the affected part for the current diff
instead of appending an update section. Reply to a review finding only when the commits do not
already make the answer clear.
