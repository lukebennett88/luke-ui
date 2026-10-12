# Papercuts

This log records repository friction, technical debt, and guidance gaps observed during real work.
Read these instructions before you add or update an entry. Level-two headings are reserved for
entries, so the number of `##` headings is the number of entries.

**Format.** Start each entry with a `## <symptom>` heading, followed by three list items: `Seen`,
`Where`, and `Problem`. Name the symptom, not a proposed solution. Write "Generated files are
missing after a package-local script", not "Run generate before every script". In `Where`, name the
location of the observed failure, and cite the governing rule or skill as context.

**Evidence.** Record a papercut only with evidence: a concrete task, PR, file, command, failure,
before and after example, or observed cost. A quality problem that no guide covers counts when it
has evidence. "Could be cleaner" does not. Do not record sandbox, network, or environment failures,
guesses, speculative improvements, changed minds, clarifications, or unsupported taste.

**Recurrence.** Search the headings first. When the symptom already has an entry, add a `Seen`
occurrence instead of a new entry. Add one dated occurrence per independent task or PR, with its
evidence, such as `2026-10-11 (#801)`. Retries within one task count once. Several PRs on the same
date count separately. Silence does not mean an entry is resolved.

**Scope.** Fix small friction within the current task rather than logging it as unresolved debt.
Always log an observed guidance failure, even when the code is corrected, because the guidance gap
remains. Do not make unrelated fixes under cover of recording a papercut. Commit an entry
separately, for example `Record papercut: <symptom>`, and mention it in the PR. Run
`pnpm run fix:format-root` before committing. When resolving a conflict in this file, keep both
additions. A session that can't commit reports its findings in its final message.

**Triage.** Mention it in your final message when this file reaches 10 entries, or when one entry
reaches 3 occurrences. At 10 entries, triage the whole log. At 3 occurrences, triage that entry.
Each triaged entry is fixed, transferred to a GitHub issue, or rejected. Search for an existing
issue before you open a new one. When you reject an entry because the intended behaviour is unclear,
document the intended behaviour. Remove resolved, transferred, and rejected entries. Git history
archives them. Never delete an entry only because it is old.

**Skills.** Propose a new skill only during triage, with at least two observed corrections that a
workflow would have prevented and that a check or a pointer would not handle better. The maintainer
approves skill additions and changes. Remove a skill when it is obsolete or when pilot or spot-check
evidence shows it does not help. Silence in this log is not evidence.

## Visual compare fails while the main baseline run is still in progress

- Seen: 2026-10-12 (#782, #783, #785, #792). `visual-ci resolve-baseline` exited with "The newest
  Visual baseline run on `main` is in_progress. Wait for … then re-run this job." Re-run after the
  baseline finished passed compare.
- Where: `.github/workflows/visual-regression.yml` Resolve baseline step; docs/VISUAL_TESTING.md.
- Problem: Parallel Renovate PRs that touch the lockfile all start compare while a main Visual
  baseline run is still uploading, so every PR fails the same way until someone re-runs the job.

## Renovate rewrote `devEngines.runtime` from `24.x` to an exact Node version

- Seen: 2026-10-12 (#783). Renovate's non-major PR changed `"version": "24.x"` to
  `"version": "24.21.0"` and the lockfile `specifier` to `runtime:24.21.0`.
- Where: root `package.json` `devEngines.runtime`; docs/DEPENDENCIES.md Tooling versions;
  `.github/renovate.json5` custom regex manager for node.
- Problem: The documented contract is `<major>.x`, and the regex manager is supposed to keep that
  form with `rangeStrategy: 'replace'`. The non-major group still rewrote the field to an exact
  version, so the PR had to be corrected by hand.
