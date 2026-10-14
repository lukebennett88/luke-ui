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

**Scope.** Fix small friction in the current task rather than logging it as unresolved debt. When a
task or PR fixes a symptom, remove its entry in the same change, or do not add one. When existing
guidance or a skill should have prevented a mistake, log the guidance gap even after you fix the
code, unless the same change also fixes the guidance. Do not make unrelated fixes under cover of
recording a papercut. Commit an entry separately, for example `Record papercut: <symptom>`, and
mention it in the PR. Run `pnpm run fix:format-root` before committing. When resolving a conflict in
this file, keep both additions. A session that can't commit reports its findings in its final
message.

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

## The token board's visual capture renders two different ways on the same code

- Seen: 2026-10-13 (#797). The Visual regression run for commit `42cf474f` (38333714238) and the run
  for commit `c818adf3` (38338181845) produced byte-identical `theme/token-board-*` renders that
  differ from the baseline. The run for commit `a2f12ba8` (38336322056) matched the baseline,
  although that commit contains the same code as `42cf474f`. The token board imports no field
  components.
- Where: `packages/@luke-ui/react/src/theme/token-board.browser.test.tsx`. Governing rule:
  docs/TESTING.md, "Remove nondeterminism. Do not add an allowance."
- Problem: about 290k mismatched pixels across the whole board (anti-aliasing, not a shift) appear
  on unrelated PRs, so reviewers must judge whether a token-board diff is real.

## The font-family browser assertion disagrees with Chromium's computed serialization

- Seen: 2026-10-13 (necessity-markers-dom cleanup). `TURBO_FORCE=true pnpm run test` failed at
  `src/theme/font-family.browser.test.ts:76`: the assertion accepted
  `-apple-system, BlinkMacSystemFont, Noto Sans CJK JP, sans-serif`, but Chromium returned
  `-apple-system, "system-ui", "Noto Sans CJK JP", sans-serif`.
- Where: `packages/@luke-ui/react/src/theme/font-family.browser.test.ts:76`. Governing rule:
  docs/TESTING.md, "Component tests".
- Problem: The assertion compares different font-family serializations, and the browser test fails
  on Chromium's returned value.

## Code review recommends appearance assertions prohibited by testing guidance

- Seen: 2026-10-13 (#802). Review of the Field necessity-marker colour change recommended
  computed-style colour assertions for disabled textual markers. The corrected recommendation is to
  extend existing visual captures instead.
- Where: PR #802 review. Governing rule: docs/TESTING.md, "Component tests" (computed styles only
  when layout is the contract); `.agents/skills/write-tests/SKILL.md` Reviewing.
- Problem: Review still proposed a prohibited appearance assertion even though TESTING.md forbids
  testing computed appearance unless layout is the contract, and the write-tests skill requires
  reviewers to consult that guidance.

## Component generator sorts the whole root components meta pages list

- Seen: 2026-10-13 (Form PR 2 for #796). `pnpm run generate:component --args form forms No` rewrote
  `apps/docs/content/docs/components/meta.json` so section headers and page entries were
  alphabetised, and added a bare `"forms"` entry. `check:docs` then reported
  `component-guide-inventory` mismatches for primitives and forms until the file was restored and
  only `forms/form` was inserted.
- Where: `packages/turbo-generators/src/apply-creation-plan.ts` `array-add-sorted`;
  `packages/turbo-generators/src/component-creation-plan.ts` root `components/meta.json` edit.
  Governing rule: docs/COMPONENTS.md component creation; docs inventory in
  `apps/docs/src/lib/component-guide-inventory.ts`.
- Problem: Root metadata interleaves `---Section---` markers with `group/name` pages in a fixed
  sidebar order. Sorting the entire `pages` array destroys that order, and the edit value is the
  docs group name rather than `group/name`, so generating into an existing group both scrambles
  navigation and fails inventory until the root meta is fixed by hand.
