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

**Skills.** A skill for an established, repeatable workflow, such as writing a pull request, needs
no entry here. Propose any other new skill during triage, with evidence of a failure that a workflow
would have prevented and that a check or a pointer would not handle better. Two observed corrections
are a reason to consider a skill, not a requirement for one. The maintainer approves skill additions
and changes. Remove a skill when it is obsolete or when pilot or spot-check evidence shows it does
not help. Silence in this log is not evidence.

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

## CSS length props accept spacing token keys

- Seen: 2026-10-15 (#810). The new Typography copy button used `inlineSize="sp32"` and
  `minBlockSize="sp32"`; those CSS length props accepted the invalid spacing key. This task's
  handoff also flagged the same issue in `icon-gallery`.
- Where: `apps/docs/src/components/typography-tokens.tsx`; `AGENTS.md` routes Box styling to
  `docs/STYLING.md`.
- Problem: TypeScript accepts a spacing token key where a CSS length is required, so the prop can
  compile while producing an invalid CSS value.

## An aria-label-only ComboboxField leaves its mobile tray dialog unnamed

- Seen: 2026-10-15 (token catalogue redesign). `ComboboxField` with `aria-label` named the
  searchbox, but the 390px mobile tray dialog had no accessible name. A visible `label` supplies the
  label context the tray reads.
- Where: `packages/@luke-ui/react/src/core/primitives/combobox/tray.tsx` reads `LabelContext` for
  the tray's name.
- Problem: A valid field name supplied with `aria-label` does not reach the tray dialog, so
  consumers must use a visible label to name it.

## Agent submitted review-bound code that ignored existing CONVENTIONS or DOCUMENTATION rules

- Seen: 2026-10-16 (#820). Nested ternaries in type-cell / definition-name resolution where
  `docs/CONVENTIONS.md` requires an IIFE or early returns; historical and compatibility comments
  (`#822` narration, pre-1.0 definition-key shims) where `docs/DOCUMENTATION.md` forbids
  session-history and obsolete-compat prose.
- Where: `apps/docs/src/components/type-table.tsx`,
  `apps/docs/src/components/type-definitions-context.tsx`, related docs type-definition modules.
  Governing rules: `docs/CONVENTIONS.md` Code style; `docs/DOCUMENTATION.md` (no session-history
  prose; keep docs current).
- Problem: Written rules already forbade the patterns, but the agent still shipped them into review,
  so a human had to restate the guides. Prevention is stronger review-skill enforcement or a check,
  not more prose in the same guides.
