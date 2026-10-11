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
   - Run `TURBO_FORCE=true pnpm run test` and `pnpm run check` from the repo root.
   - For a test that `pnpm run test` leaves out, run the command TESTING.md gives for it.
   - Report a run that could not start as not run, not as passing.

## Quality checklist

Authors use this before finishing. Reviewers use it on the diff.

- [ ] Each test proves a contract that Luke UI adds or composes and that no other test proves. It
      does not re-prove behaviour another component owns.
      ([Component tests](../../../docs/TESTING.md#component-tests))
- [ ] The test type is the smallest that proves the contract, in the place TESTING.md gives.
- [ ] Browser component tests prefer roles and accessible names over text queries or DOM selectors.
      ([Component tests](../../../docs/TESTING.md#component-tests))
- [ ] Tests assert computed styles only when layout is the contract.
      ([Component tests](../../../docs/TESTING.md#component-tests))
- [ ] In component tests, use `for…of` with the distinguishing value in the test title. Do not use
      `test.each`, `it.each`, or `describe.each`.
      ([Component tests](../../../docs/TESTING.md#component-tests))
- [ ] No result depends on timing, test order, or leftover state.
- [ ] The tests ran for real, or the report says why they did not.

## Reviewing

- Run `pnpm run check` and the affected tests first. Do not report what they already catch. Spend
  the review on what they cannot.
- Support every finding with evidence. For a convention violation, cite the TESTING.md section. For
  a bug, an accessibility failure, or a flaky test, give a reproduction, a failing assertion, or the
  failed run. Do not report a preference as a defect without a convention or a concrete impact.
- Report each problem once, with every location. Leave out speculative findings and nits.
