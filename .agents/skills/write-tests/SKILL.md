---
name: write-tests
description: >-
  Write, change, or review tests in the Luke UI repository, including pull requests that change
  them: *.test.ts, *.browser.test.tsx, test fixtures, accessibility checks, and visual regression
  cases.
---

# Write tests

[TESTING.md](../../../docs/TESTING.md) owns the testing rules and wins where this skill disagrees.
Read all of it before you write or review a test, and follow its links for specialist workflows such
as visual regression.

## Workflow

1. Name the contract: what Luke UI adds or composes that the test must protect.
2. Choose the smallest test type in TESTING.md that proves it. Add a type test only when a public
   type contract could regress while ordinary compilation still passes.
3. Read the existing tests beside the code and the helpers they use. Match a comparable test:
   - Browser component test with axe and visual captures:
     `packages/@luke-ui/react/src/core/button/button.browser.test.tsx`.
   - Node unit test for pure logic: `packages/@luke-ui/react/src/core/styles/responsive.test.ts`.
   - Type contract test: `packages/@luke-ui/react/src/core/button/button.test.ts`.
4. Write the smallest meaningful test. For a bug fix, write it first and watch it fail for the
   reason the bug describes.
5. Remove nondeterminism, then verify from the repository root:
   - Run `TURBO_FORCE=true pnpm run test:code` and `pnpm run check`.
   - For a test that `test:code` leaves out, run the command TESTING.md gives for it.
   - Report a run that could not start as not run.

## Reviewing

- Follow [review-pr's check boundaries](../review-pr/SKILL.md#checks), even when this skill runs
  alone. Read existing results first, run checks or affected tests in isolation, and spend the
  review on what the checks cannot catch.
- Cite the TESTING.md section that owns a convention, not this skill. For a bug, an accessibility
  failure, or a flaky test, give a reproduction, a failing assertion, or the failed run. A
  preference with neither a convention nor a concrete impact is not a defect.
- Report each problem once, with every location. Leave out speculative findings and nits.
