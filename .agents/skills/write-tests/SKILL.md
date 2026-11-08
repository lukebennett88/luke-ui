---
name: write-tests
description: >-
  Write, change, or review tests in the Luke UI repository, including pull requests that change
  them: *.test.ts, *.browser.test.tsx, test fixtures, accessibility checks, and visual regression
  cases.
---

# Write tests

[TESTING.md](../../../docs/TESTING.md) owns the testing rules. Read all of it before you write or
review a test, and follow its links for specialist workflows such as visual regression. When this
skill and the guide disagree, the guide wins.

## Workflow

1. Identify the contract: what Luke UI adds or composes that a test must protect.
2. Select the smallest test type in TESTING.md that proves it. Add a type test only when a public
   type contract could regress while ordinary compilation still passes.
3. Inspect the existing tests beside the code and the helpers they use. Match a comparable test:
   - Browser component test with axe and visual captures:
     `packages/@luke-ui/react/src/core/button/button.browser.test.tsx`.
   - Node unit test for pure logic: `packages/@luke-ui/react/src/core/styles/responsive.test.ts`.
   - Type contract test: `packages/@luke-ui/react/src/core/button/button.test.ts`.
4. Write the smallest meaningful test. For a bug fix, write it first and watch it fail for the
   reason the bug describes.
5. Remove nondeterminism, then verify:
   - Run `TURBO_FORCE=true pnpm run test:code` and `pnpm run check` from the repo root.
   - For a test that `pnpm run test:code` leaves out, run the command TESTING.md gives for it.
   - Report a run that could not start as not run, not as passing.

## Quality checklist

Authors use this before finishing. Reviewers use it on the diff.

- [ ] Check each test's contract and test type against
      [Test types](../../../docs/TESTING.md#test-types) and
      [Component tests](../../../docs/TESTING.md#component-tests).
- [ ] Check component test queries, assertions, and cases against
      [Component tests](../../../docs/TESTING.md#component-tests).
- [ ] Check timing and state isolation against
      [Timing and synchronisation](../../../docs/TESTING.md#timing-and-synchronisation).
- [ ] Run the relevant checks above, or report why they did not run.

## Reviewing

- Follow [review-pr's check boundaries](../review-pr/SKILL.md#checks), including when this skill is
  used alone. Inspect existing results before running checks or affected tests in isolation. Spend
  the review on what the checks cannot catch.
- Support every finding with evidence. For a convention violation, cite the TESTING.md section that
  owns it, not this skill. For a bug, an accessibility failure, or a flaky test, give a
  reproduction, a failing assertion, or the failed run. Do not report a preference as a defect
  without a convention or a concrete impact.
- Report each problem once, with every location. Leave out speculative findings and nits.
