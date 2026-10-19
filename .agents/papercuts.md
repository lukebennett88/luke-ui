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

## Generated scaffold JSDoc names the recipe class

- Seen: 2026-10-18 (#870). Review of PR #870 found function-level JSDoc such as "Renders a `div`
  with the component recipe class."
- Where: `packages/turbo-generators/src/component-creation-plan.ts` and
  `primitive-creation-plan.ts`. Governing rules: `docs/DOCUMENTATION.md`, Comments and JSDoc (public
  docs explain observable behaviour). `.agents/skills/work-on-issue/SKILL.md` requires consulting
  those guides before implementing.
- Problem: Agent-authored generator output described an internal recipe detail in published JSDoc.
  Correcting the wording does not establish that scaffold authoring applies those rules.

## The README rendering summary omits React Aria's supported render API

- Seen: 2026-10-17 (#858). The README feature list replaced `render` with `renderRoot` and named
  callbacks. Review identified that React Aria's `render` remains supported and asked to retain it.
- Where: `README.md`, Features. Governing rules: `docs/CONVENTIONS.md`, Element choice, and
  `docs/DOCUMENTATION.md`, Editing prose (check behavioural claims against the implementation).
  `.agents/skills/write-docs/SKILL.md` requires consulting the applicable documentation sections.
- Problem: The agent-authored summary omitted a supported rendering API despite the applicable
  guides. Correcting the feature list does not establish that the authoring workflow applies those
  rules.

## New feature documentation follows Accessibility

- Seen: 2026-10-18 (#847). `pnpm run check` rejected a new Form control-size section after
  Accessibility.
- Where: `apps/docs/content/docs/components/forms/form.mdx`. `docs/DOCUMENTATION.md`, MDX page
  structure, places feature sections before Accessibility. The write-docs workflow requires
  consulting that guide before editing documentation.
- Problem: The agent-authored section contradicted the required page order. Correcting the order
  does not establish that documentation authoring applies the page-structure guidance.

## New layout tests locate named controls with DOM selectors

- Seen: 2026-10-18 (#847). Self-review found new Button and Link inline-size tests using
  `querySelector('button')` and `querySelector('a')` for named controls.
- Where: `packages/@luke-ui/react/src/core/button/button.browser.test.tsx` and
  `link/link.browser.test.tsx`. `docs/TESTING.md`, Component tests, prefers role and accessible-name
  locators. The write-tests workflow requires reading that guide before authoring tests.
- Problem: The agent-authored tests used DOM selectors despite available semantic locators.
  Correcting the tests does not establish that test authoring applies the locator guidance.
