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

## Theme builds refresh tracked dependency metadata

- Seen: 2026-10-19 (#847). Building unchanged main `5ca271c` and both implementation worktrees
  changed the Paper and Tactile manifests' recorded metrics version from `4.3.0` to `4.4.0`. Seen
  again: 2026-10-19 (#873). Required check and consumer builds on `fa51e2ac` changed the same two
  manifests from metrics `4.3.0` to `4.4.0`.
- Where: `packages/@luke-ui/theme-paper/package.json` and
  `packages/@luke-ui/theme-tactile/package.json`, `inlinedDependencies`. The dependency update in
  #886 changed the installed version. AGENTS.md requires keeping unrelated changes out of task
  commits.
- Problem: Required builds leave unrelated tracked changes behind, requiring authors to identify and
  restore the generated metadata before finishing their work.

## Docs watcher tests cannot find type-source modules

- Seen: 2026-10-19 (#873).
  `pnpm exec turbo run test --filter=docs -- src/lib/remark-watch-type-table-sources.test.ts`
  reproduced two failures and three passes on unchanged base `fa51e2ac`, matching the full test run.
  Seen again: 2026-10-21 (#880). The same two failures and three passes reproduced on unchanged
  `main` `b9e653f0` and in the #880 branch's full test run, where every other test passed. Seen
  again: 2026-10-22 (#899 review fixes). Both watcher failures reproduced on unchanged `b693c949`
  and in the task checkout. The focused docs run had 23 passes and two failures, both with
  `undefined` at the same module-count assertion.
- Where: `apps/docs/src/lib/remark-watch-type-table-sources.test.ts:444`,
  `expectTypeTableWatchLink`, called by the direct-source and imported-type MDX recompilation tests.
  `docs/TESTING.md` requires reporting test results; the work-on-issue workflow requires reproducing
  unrelated failures on the base revision.
- Problem: Both tests receive `undefined` from `server.moduleGraph.getModulesByFile(sourcePath)` and
  fail the module-count assertion. These baseline failures block a passing full test run; they do
  not establish whether hot reload itself fails.

## Prose example adds unnecessary application context

- Seen: 2026-10-19 (PR #895). The native-elements example introduced project setup and a search
  shortcut. Review identified the unnecessary application context.
- Where: `apps/docs/src/examples/prose/native-elements.tsx`. `docs/DOCUMENTATION.md`, Examples,
  requires neutral or self-referential content without unnecessary application context. The
  write-docs workflow requires consulting that guide before editing examples.
- Problem: The agent-authored example contradicted the required content guidance. Correcting it does
  not establish that example authoring applies the guidance.

## Production settings API adds a control used only by tests

- Seen: 2026-10-21 (PR #903, #880). Review of `748dc121` found `holdMutations` and three mutation
  waits with callers only in browser tests.
- Where: `apps/reference-app/src/api/settings-api.ts` and `app.browser.test.tsx`. `docs/TESTING.md`,
  Component tests, forbids production APIs that exist only to make tests easier. The write-tests
  workflow requires reading that guide before authoring tests.
- Problem: The agent-authored timing cleanup added a production control solely for tests despite the
  required guidance. Correcting the implementation does not establish that test authoring applies
  that rule.

## Search test comments narrate investigation history

- Seen: 2026-10-21 (PR #903, #880). Review of `748dc121` found a keyboard-navigation comment
  describing prior browser round trips and a 15.7-second investigation timing.
- Where: `apps/docs/src/components/search.browser.test.tsx`. `docs/DOCUMENTATION.md`, Comments and
  JSDoc, requires comments to explain code without its history. The review-pr workflow requires
  consulting the applicable repository guides.
- Problem: The agent-authored comment narrated session history despite the required guidance.
  Correcting the comment does not establish that comment authoring applies that rule.

## An agent ran destructive Git commands on its own uncommitted task changes

- Seen: 2026-10-22 (#910). To compare stylesheet sizes, the agent ran `git stash` and
  `git stash pop` in the task checkout around a base build, instead of building the base in a
  separate worktree. The stash restored cleanly. Seen again: 2026-10-22 (#899 Part 5). To remove an
  untracked probe test, the agent ran `git checkout -- .` in `packages/@luke-ui/react`, which
  discarded every uncommitted package edit in the Part 5 worktree. The agent re-applied the edits
  from the session before committing.
- Where: the task checkouts for `luke/funny-albattani-r0nlst` and `luke/899-consumer-docs`.
  AGENTS.md, Universal rules, says to preserve existing work and not to reset, clean, stash, or
  overwrite it. `.agents/skills/work-on-issue/SKILL.md`, Verify, says to compare in a separate
  worktree. AGENTS.md requires reading both.
- Problem: The agent's commands contradicted the preservation rule twice in one issue, once with
  loss of uncommitted work. Recovering the work does not establish that the workflow applies the
  rule.

## Class names joined with a template string instead of `cx`

- Seen: 2026-10-22 (PR #907, #899 Part 2). Review of `6075a64` found `createSprinkles` joining the
  utility and paired background classes with `${result.className} ${backgroundClassName}`.
- Where: `packages/@luke-ui/react/src/core/styles/create-sprinkles.ts`. `docs/CONVENTIONS.md`,
  Reuse, says to prefer `cx` from `@luke-ui/react/utils` for class names. The work-on-issue workflow
  requires consulting that guide for JS/TS changes.
- Problem: The agent-authored helper hand-rolled class joining despite the required guidance.
  Removing the helper does not establish that implementation applies that rule.

## A browser test suppressed lint with an ESLint directive

- Seen: 2026-10-22 (PR #911, #899 Part 5). Review of `f7612f6` found
  `// eslint-disable-next-line no-await-in-loop -- …` in a Button contrast test.
- Where: `packages/@luke-ui/react/src/core/button/button.browser.test.tsx`. `docs/CONVENTIONS.md`,
  Linting, says oxlint owns linting and to suppress a rule with a plain comment and
  `// oxlint-disable-next-line <plugin>/<rule>`. The root `vite.config.ts` already turns
  `no-await-in-loop` off for these browser tests. The work-on-issue workflow requires consulting
  that guide for JS/TS changes.
- Problem: The agent-authored suppression used another linter's syntax for a rule that was already
  off, despite the required guidance. Removing it does not establish that test authoring applies
  that rule.
