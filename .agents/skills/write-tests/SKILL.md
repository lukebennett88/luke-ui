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

Review with [review-pr](../review-pr/SKILL.md), citing the TESTING.md section that owns each
convention. Show a flaky test with the failed run.
