---
name: write-tests
description: >-
  Write, change, or review tests in the Luke UI repository, including pull requests that change
  them: *.test.ts, *.browser.test.tsx, test fixtures, accessibility checks, and visual regression
  cases.
---

# Write tests

[TESTING.md](../../../docs/TESTING.md) owns the testing rules. Read all of it before you write or
review a test. It links to its visual regression companion. This skill is the workflow around it.
When the two disagree, the guide wins.

## Workflow

1. Name the contract the change must protect. Test what Luke UI adds or composes, not React Aria
   Components or the browser.
2. Choose the test type that proves that contract with the smallest surface: a unit test for pure
   logic or a public type contract, a browser test for behaviour and axe, or a `visual`-tagged
   browser test for meaningful appearance.
3. Read the neighbouring tests in the same directory and the helpers in
   `packages/@luke-ui/react/src/core/test-utils/`. Reuse a helper before writing a new one.
4. Match an exemplar:
   - Behaviour, axe, and theme-matrix captures:
     `packages/@luke-ui/react/src/core/button/button.browser.test.tsx`.
   - A small text component with a parameterised loop:
     `packages/@luke-ui/react/src/core/code/code.browser.test.tsx`.
   - Public type contracts: `packages/@luke-ui/react/src/core/button/button.test.ts`.
5. For a bug fix, write the failing test first and watch it fail for the reason the bug describes.
6. Remove nondeterminism. Wait for a state the test can observe, not for a fixed time.

## Verify

- Run `TURBO_FORCE=true pnpm run test` from the repo root. A `FULL TURBO` replay is not a real run.
  Do not pass `--force` after `--`.
- Run `pnpm run check` from the repo root. It does not run tests.
- Run `pnpm run test:consumer` when the change touches the packed-consumer harness.
- Report a run that could not start, such as a missing browser or no network, as not run. Do not
  report it as passing.

## Quality checklist

Authors run this before finishing. Reviewers run it on the diff.

- [ ] The test proves a Luke UI contract that would otherwise be unprotected.
- [ ] The test type and file placement match the contract.
- [ ] The test goes through public exports, `render()`, roles, and accessible names.
- [ ] Parameterised cases use `for…of` with the value in the title.
- [ ] Nothing depends on timing, test order, leftover state, or a mismatch allowance.
- [ ] Each test asserts something distinct. No case repeats another or exists only for coverage.
- [ ] The tests ran for real and passed, or the report says why they did not run.

When reviewing:

- Run `pnpm run check` and the affected tests first. Do not report problems they already catch.
- Give each finding a file and line. Cite the `TESTING.md` section for a convention.
- Back a bug, accessibility failure, or flaky test with proof: a reproduction, a failing assertion,
  or the run that failed.
- Report a problem once, with every location, rather than one comment per instance. Leave out
  preferences that no guide section supports.
