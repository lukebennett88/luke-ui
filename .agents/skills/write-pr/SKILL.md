---
name: write-pr
description: >-
  Writes or updates a Luke UI pull request title and body from its diff. Use when opening a pull
  request, drafting pull request text, or refreshing a description after new commits.
---

# Write a pull request

A reviewer reads the description before the diff. Tell them what changed, why, and how you know it
works. Most pull requests need one paragraph and a verification section.
[#807](https://github.com/lukebennett88/luke-ui/pull/807) is a good model. Follow
[DOCUMENTATION.md](../../../docs/DOCUMENTATION.md#writing-style) for prose.

1. Describe the net diff against the base, `git diff <base>...HEAD`, not the latest commit or the
   order you did the work in.
2. Write the title as a plain imperative sentence, like a commit subject, with no prefix such as
   `feat:`.
3. Open with a short paragraph on the problem and the change. Add a `## Changes` list only when a
   paragraph can't carry it. Add a small diagram, diff sketch, or tree when it clarifies the flow or
   structure.
4. Describe public API changes, breaking changes, and what a consumer must change, when there are
   any. Call out material merge risks, what they affect, and whether the change is hard to reverse,
   when that helps the reviewer.
5. When the rendered UI changes and a comparison helps, put before and after screenshots side by
   side in a table. Upload them with `--attach` on `gh pr create` or `gh pr edit` and reference each
   file from the table, as in `![Before](./before.png)`. Keep images out of the branch, and say so
   when you can't upload. For an interaction change, a short recording or a test often shows more.
6. End with `## Verification`: the local checks and their results, CI checks that are pending or
   failed, the checks you did not run and why, and the SHA the results apply to. Give the base
   revision for a failure that also happens on the base. Include concrete before-and-after evidence,
   such as a failing and then passing test, when it is useful. Summarise output instead of pasting
   it.
7. Write `Closes #n` only when the pull request completes the issue. Otherwise write `Refs #n`.

Leave out process notes, history, and lines such as "Do not merge until review is complete".

## Publish

Return the text as a draft unless you are asked to open or update the pull request.

- Open the pull request ready for review when the work is complete and the applicable local checks
  pass, even while CI is pending. Open it as a draft when work is unfinished, a blocking finding or
  decision is open, or a failure prevents a meaningful review, and say what is missing.
- Add `claimed` to the issue the pull request implements if it lacks it. Leave a parent issue that
  the pull request only links to unlabelled.
- Add no reviewers, assignees, or labels to the pull request.
- Read the pull request back with `gh pr view` after you publish.

## Update

Edit the description only when the direction changes, when something a reviewer should know is
added, or when a statement in it has become wrong. Rewrite the affected part for the current diff
instead of appending an update section. Reply to a review finding only when the commits do not
already make the answer clear.
