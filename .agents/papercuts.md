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
- Seen: 2026-10-14 (#805). `npx --yes @anthropic-ai/claude-code --help` from the repo root failed
  with `EBADDEVENGINES Invalid semver version "24.21.0" does not match "v24.19.0"`. The same command
  succeeded from `/tmp`, where the workspace `package.json` is not applied.
- Where: root `package.json` `devEngines.runtime`; docs/DEPENDENCIES.md Tooling versions;
  `.github/renovate.json5` custom regex manager for node.
- Problem: The documented contract is `<major>.x`, and the regex manager is supposed to keep that
  form with `rangeStrategy: 'replace'`. The non-major group still rewrote the field to an exact
  version, so the PR had to be corrected by hand. An exact pin also rejects nearby Node 24.x
  runtimes that still match the documented `<major>.x` contract.

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
  `-apple-system, "system-ui", "Noto Sans CJK JP", sans-serif`. 2026-10-14 (#768): the same failure
  reproduced on clean baseline `0b31387f` with
  `TURBO_FORCE=true pnpm exec turbo run test:browser:run --filter=@luke-ui/react -- src/theme/font-family.browser.test.ts`.
  2026-10-14 (#800): `TURBO_FORCE=true pnpm run test` returned the same failure (528 browser tests
  passed, 1 failed, 73 skipped). The assertion also failed on clean baseline `b8a982be`.
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

## Theme authoring prose promises unchanged colour channels

- Seen: 2026-10-14 (#800). The draft said "An accent side you set explicitly keeps its authored
  lightness". Review corrected it to "bypasses this adaptation" because the generator searches a
  tone-faithful band and may move the solid anchor. The #808 review also found both adaptation
  descriptions promised preserved chroma, which sRGB gamut mapping can reduce.
- Where: `apps/docs/content/docs/docs/authoring-a-theme.mdx`, "Define the input" and "When an accent
  cannot be used"; `packages/@luke-ui/react/src/theme/scale.ts`, `resolveSolidAnchor`, and
  `packages/@luke-ui/react/src/theme/color.ts`, `gamutMapOklch`. Governing rule:
  docs/DOCUMENTATION.md, "Review" and "Keeping docs current".
- Problem: The prose overstated which authored colour channels are preserved, despite the
  documentation guide's factual accuracy requirement.

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
  session-history and obsolete-compat prose. Review also had to ask for a `Stack` in place of a docs
  `*.css.ts` layout class, which `docs/DOCUMENTATION.md` "Docs app architecture" already required.
  Head `21205f6c` still exported `clearTypeDefinitionsCache` and
  `resetTypeDefinitionsOutputCleanGuardForTests` only for tests, after the same PR added the
  `docs/TESTING.md` rule against production code paths that exist only for tests.
- Where: `apps/docs/src/components/type-table.tsx`,
  `apps/docs/src/components/type-definitions-context.tsx`,
  `apps/docs/src/components/type-popover.css.ts`, `apps/docs/src/lib/load-type-definitions.ts`,
  `apps/docs/src/lib/remark-attach-type-definitions.ts`. Governing rules: `docs/CONVENTIONS.md` Code
  style; `docs/DOCUMENTATION.md` (no session-history prose; keep docs current; Docs app
  architecture); `docs/TESTING.md` Component tests.
- Problem: Written rules already forbade the patterns, but the agent still shipped them into review,
  so a human had to restate the guides. Prevention is stronger review-skill enforcement or a check,
  not more prose in the same guides.

## Tests and verification used synthetic type definitions while the built Button guide could not load PressAction

- Seen: 2026-10-16 (#820). At head `21205f6c`, the Button guide and the Button primitive guide both
  document a `ButtonProps` declared in a `button.tsx`, so fumadocs gave both tables the id
  `button.tsx-ButtonProps`. Their definition assets were named from that id, the primitive guide
  wrote the file last, and the built `/components/actions/button/` popover for `PressAction` showed
  "Definition not available." The PR's verification counted 39 generated assets, and its browser
  tests mocked `fetch` with hand-written JSON. No test or check opened a popover on a generated
  page. The maintainer found the failure in a screenshot of the Button API.
- Where: `apps/docs/src/lib/remark-attach-type-definitions.ts` asset naming;
  `apps/docs/src/components/type-table.browser.test.tsx`. Governing rules: `docs/TESTING.md`
  Component tests ("Exercise the real loading and rendering path");
  `.agents/skills/review-pr/SKILL.md` Review ("Confirm behaviour when it matters");
  `.agents/skills/work-on-issue/SKILL.md` Verify.
- Problem: Verification checked that generated files existed, not that each page loaded its own
  definitions, so a filename collision passed every local check and CI.

## Papercut triage removed entries as transferred to issues that do not track them

- Seen: 2026-10-16 (#820). Commit `21205f6c` deleted six entries. It moved the visual baseline race,
  token board, and font-family entries "toward #718 / #795", the Renovate `devEngines` entry "toward
  #349", and the appearance-assertion review entry "toward #804", and dropped the theme authoring
  prose entry "as already fixed". #718 is the 1.0 visual and accessibility audit, #795 evaluates
  parallel GitHub Actions steps, #349 is Renovate's Dependency Dashboard, and #804 is a broad
  guidance audit. None of them names those failures. The theme prose was fixed in #808, and the
  entry stayed on `main` because the guidance gap remained. The maintainer had the entries restored.
- Where: `.agents/papercuts.md` Triage and Scope paragraphs.
- Problem: Triage lets an entry be "transferred to a GitHub issue" without saying that the issue
  must track that specific failure, so a general audit, a dependency dashboard, and unrelated CI
  work were treated as owners, and the evidence left the log. A guidance-gap entry was also removed
  as fixed, although the Scope paragraph keeps such entries until the guidance changes.

## Related async load state was split across independent useState values

- Seen: 2026-10-16 (#820). At `63bafaa2`, `TypeDefinitionsProvider` kept `fetched`, `loadError`, and
  `loadStatus` in three `useState` calls that every load path had to update together. Review asked
  to "Model state using a reducer pattern or state machine".
- Where: `apps/docs/src/components/type-definitions-context.tsx`. Context: `docs/CONVENTIONS.md`
  Code style covers a boolean that should be a union, not state whose parts change together.
- Problem: No guide says how to model state whose parts change together, so one load state machine
  was spread across setters that could disagree.
