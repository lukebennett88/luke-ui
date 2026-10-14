---
name: write-pr
description: >-
  Writes or updates a Luke UI pull request title and body from its diff. Use when opening a pull
  request, drafting pull request text, or refreshing a description after new commits.
---

# Write a pull request

A reviewer reads the description before the diff. Tell them what changed, why, and how you know it
works.

1. Read the net diff against the base with `git diff origin/main...HEAD`. Describe that diff, not
   the latest commit or the order you did the work in.
2. Write the title as a plain imperative sentence, like a commit subject. Do not add a prefix such
   as `feat:`.
3. Open with a short paragraph on the problem and the change. Add a `## Changes` list only when a
   paragraph can't carry it.
4. State public API changes, or write "No public API changes."
5. For a visual change, add before and after screenshots.
6. List each check you ran and its result. Name the checks you didn't run and say why. When a
   failure also happens on the base revision, say so and give the revision.
7. Write `Closes #n` only when the pull request meets the whole issue. Otherwise write `Refs #n`.

[#807](https://github.com/lukebennett88/luke-ui/pull/807) is a good model.

When you update a pull request, rewrite the description for the current diff. Do not append an
update section.

Return the text as a draft unless you are asked to open or update the pull request. After you
publish, read it back with `gh pr view` to confirm it.
