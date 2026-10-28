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

**Scope.** Fix small friction within authorised implementation rather than logging unresolved debt.
When the same change resolves the symptom, remove its entry or do not add one. A guidance failure
qualifies when evidence shows output contradicted an applicable rule that the workflow required
consulting. This includes agent-authored documentation and test violations on the first occurrence,
even after correction. Record the symptom, location, rule, and workflow requirement. Do not infer
that the agent skipped or misunderstood guidance. Correcting implementation alone does not resolve a
guidance failure.

### Handoff

Read-only review, including self-review, never writes this log. Supply an evidenced candidate in
`Seen`/`Where`/`Problem` format, or a `Seen` occurrence for a matching entry. Reference the finding
and mark it **not recorded**. A draft remains pending until authorised implementation evaluates it.

Authorised implementation addressing the findings checks the current log and records each qualifying
candidate or occurrence. Explain why each omitted candidate does not qualify. Reuse an existing
entry for a recurring symptom. Keep both additions when resolving a log conflict.

Permission to record grants no authority to edit code, stage, commit, push, or publish. When
committing is authorised, commit log-only entries separately, for example
`Record papercut: <symptom>`, and mention them in the PR. Follow
[work-on-issue verification](skills/work-on-issue/SKILL.md#verify) before committing. A session that
cannot record or commit reports pending candidates and their status in its final message.

**Triage.** Mention it in your final message when this file reaches 10 entries, or when one entry
reaches 3 occurrences. At 10 entries, triage the whole log. At 3 occurrences, triage that entry.
Each triaged entry is fixed, transferred to a GitHub issue that tracks that specific failure, or
rejected. A guidance failure is fixed only when the guidance changes. Search for an existing issue
before you open a new one. When you reject an entry because the intended behaviour is unclear,
document the intended behaviour. Remove resolved, transferred, and rejected entries. Git history
archives them. Never delete an entry only because it is old.

**Skills.** A skill for an established, repeatable workflow, such as writing a pull request, needs
no entry here. Propose any other new skill during triage, with evidence of a failure that a workflow
would have prevented and that a check or a pointer would not handle better. Two observed corrections
are a reason to consider a skill, not a requirement for one. The maintainer approves skill additions
and changes. Remove a skill when it is obsolete or when pilot or spot-check evidence shows it does
not help. Silence in this log is not evidence.

## Production settings API adds a control used only by tests

- Seen: 2026-10-21 (PR #903, #880). Review of `748dc121` found `holdMutations` and three mutation
  waits with callers only in browser tests.
- Where: `apps/reference-app/src/api/settings-api.ts` and `app.browser.test.tsx`. `docs/TESTING.md`,
  Component tests, forbids production APIs that exist only to make tests easier. The write-tests
  workflow requires reading that guide before authoring tests.
- Problem: The agent-authored timing cleanup added a production control solely for tests despite the
  required guidance. review-pr's easy-to-miss list and work-on-issue's pre-commit step already name
  the rule, so pointing to it again is not a remedy. Correcting the implementation does not
  establish that test authoring applies that rule.

## Agent-authored comments narrate history

- Seen: 2026-10-21 (PR #903, #880). Review of `748dc121` found a keyboard-navigation comment
  describing prior browser round trips and a 15.7-second investigation timing. Seen again:
  2026-10-22 (PR #911, #899 Part 5). Review of `ecf1ea9` found a Link test comment opening "#899
  asks text Links to stay underlined", citing the issue to justify the rule. Seen again: 2026-10-28
  (#965). Review found new packed-consumer type-test comments describing renamed token paths.
- Where: `apps/docs/src/components/search.browser.test.tsx`,
  `packages/@luke-ui/react/src/core/link/link.browser.test.tsx`, and
  `packages/@luke-ui/react/src/core/packed-consumer/react-fixture.ts`. `docs/DOCUMENTATION.md`,
  Comments and JSDoc, requires comments to explain code without its history. The review-pr workflow
  requires consulting the applicable repository guides.
- Problem: Agent-authored comments narrated history despite the required guidance. review-pr's
  easy-to-miss list and work-on-issue's pre-commit step already name the rule, so pointing to it
  again is not a remedy. Correcting the comments does not establish that comment authoring applies
  the rule.

## Existing nested ternary blocks changed-file lint

- Seen: 2026-10-23 (#912, PR #913). The changed-file lint check reported nested ternaries at
  `generate.ts:59` and `generate.ts:61`. The same check failed on the unchanged file at `402309a2`.
- Where: `packages/scaffolding/scripts/generate.ts`. `docs/CONVENTIONS.md`, Code style, forbids
  nested ternaries. The work-on-issue workflow requires `vp lint --deny no-nested-ternary` for
  changed JavaScript and TypeScript files.
- Problem: Updating suppression comments makes the required lint check report an existing nested
  ternary outside the change's scope.

## Docs type-table watch tests cannot find source modules

- Seen: 2026-10-27 (#928). The same two failures were reported during #827 and reproduce on
  unchanged `origin/main` at `edbee8e7`. Seen again: 2026-10-27 (#933). The full test run failed
  both docs watcher cases, which reproduce on the unchanged base `871c5e2` in a separate worktree.
- Where: `apps/docs/src/lib/remark-watch-type-table-sources.test.ts:444`. `pnpm run test` fails when
  `server.moduleGraph.getModulesByFile(sourcePath)` returns `undefined` for both watched source
  cases.
- Problem: The docs test suite fails on the base revision while checking that Vite recompiles MDX
  after a type-table source change.

## Browser tests use DOM selectors for named controls

- Seen: 2026-10-27 (#929). The newly authored `field-surfaces.browser.test.tsx` used
  `querySelectorAll('input'/'button')` to locate controls. Seen again: 2026-10-27 (#933). The newly
  authored `invalid-boundaries.browser.test.tsx` located the named Country Combobox with
  `querySelector` before review corrected it to `getByRole('combobox', { name: 'Country' })`.
- Where: `packages/@luke-ui/react/src/core/styles/field-surfaces.browser.test.tsx` and
  `packages/@luke-ui/react/src/core/styles/invalid-boundaries.browser.test.tsx`. `docs/TESTING.md`,
  Component tests, prefers roles and accessible names; the write-tests workflow requires reading
  that guide and its checklist requires role/name queries.
- Problem: Agent-authored browser tests used DOM selectors despite the required testing guidance.
  review-pr also calls out this rule, so another pointer does not address the workflow failure.
  Correcting the selectors does not establish that test authoring applies the rule.

## Pure validation cases added to a browser test

- Seen: 2026-10-28 (#962). Review moved invalid code-font input cases from
  `font-family.browser.test.ts` to `validate-input.test.ts`.
- Where: `packages/@luke-ui/react/src/theme/`. `docs/TESTING.md`, Test types, places pure logic in
  Node unit tests; the write-tests workflow requires reading that guide.
- Problem: Agent-authored pure validation cases initially used the browser suite despite the
  required test-type guidance. Correcting the tests does not establish that the workflow applies it.

## Authored documentation uses a prose semicolon

- Seen: 2026-10-28 (#962). `pnpm run check` rejected a semicolon in the new code-font guidance.
- Where: `apps/docs/content/docs/docs/authoring-a-theme.mdx`. `docs/DOCUMENTATION.md`, Writing
  style, forbids prose semicolons; the write-docs workflow requires consulting the guide.
- Problem: Agent-authored prose breached the required writing rule before the check caught it.
  Correcting the prose does not establish that the workflow applies the rule.
