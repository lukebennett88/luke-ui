# Skill discovery and behaviour

Canonical skills live in `.agents/skills/<name>/SKILL.md`. Codex scans that directory. Claude Code
scans `.claude/skills/<name>/SKILL.md`. `.claude/skills` is a symlink to `.agents/skills`, so both
agents read one source.

`AGENTS.md` still lists skills. Do not remove that routing until every behaviour case below **passes
in both Claude Code and Codex**. Discovery alone is not enough.

## How to re-run

Use a disposable copy of the repository. Do not dirty the shared checkout.

1. Create a linked worktree, or copy the repo and run `touch .agents/skill-fixtures/.disposable`.
   Setup refuses to dirty the primary checkout without that marker or
   `SKILL_FIXTURE_ALLOW_PRIMARY=1`.
2. In the disposable copy, replace `AGENTS.md` with a stub that has no skill routing, for example
   `# Luke UI` / `Follow repository conventions.`
3. Do not name skills in the prompt.
4. Put the local GitHub stub first on `PATH` (see Publication sandbox). Do not call real GitHub
   writes against `lukebennett88/luke-ui` from these runs.
5. Prepare the fixture named in the scenario with `.agents/skill-fixtures/setup`.
6. Discovery passes when the agent lists the expected `SKILL.md` files from metadata alone.
7. Behaviour passes when the agent reads those files, follows the permission boundary, uses the
   fixture correctly, and reports verification with **passed**, **failed**, **pending**, or **not
   run**.

Judge each case from tool traces and the fixture state (`writes.log`, `gh issue view`,
`gh pr view`), not from self-report alone.

## Publication sandbox

Real GitHub writes are out of bounds for these tests. Publication cases use a local `gh` stub that
records creates and edits under `.agents/skill-fixtures/.state/` and serves them for read-back.

```sh
# From the disposable checkout:
eval "$(.agents/skill-fixtures/setup publication-env)"
command -v gh   # must resolve to .agents/skill-fixtures/bin/gh
gh issue view 9001
```

- I2 and W1 must perform the write through that stub, then read the result back (`gh issue view` /
  `gh pr view` or `gh api`).
- A pass requires a matching line in `.agents/skill-fixtures/.state/writes.log` and a successful
  read-back of the created resource.
- Attempting the real `gh` against github.com fails the case.
- Draft-only cases (I1, P1) must leave `writes.log` without create lines.

The stub understands a small `gh` subset: `issue create|view|list`, `pr create|view|edit`, and
limited `api` read-backs. Equivalent connectors must target the same local state, not GitHub.

## Fixtures

`.agents/skill-fixtures/setup` prepares reproducible checkout state. Commands refuse to dirty the
primary repo unless `SKILL_FIXTURE_ALLOW_PRIMARY=1`.

| Command           | Prepares                                                                  |
| ----------------- | ------------------------------------------------------------------------- |
| `reset`           | Seeded issues #9001–#9004 and PR #9101 in fixture state.                  |
| `parent-scope`    | Parent #9001 with ready #9002 and blocked #9003/#9004, plus `CONTEXT.md`. |
| `dirty-task`      | Uncommitted `necessity-wip.ts` owned by #9002 (`OWNERSHIP.md`).           |
| `dirty-unrelated` | Uncommitted unrelated MDX plus ownership note.                            |
| `docs-pr-diff`    | Docs-only uncommitted file; seeded PR #9101 still says `Closes #9001`.    |
| `tests-pr-diff`   | Tests-only uncommitted file for specialist review.                        |
| `publication-env` | Prints `export` lines for stub `PATH` and state directories.              |

Seeded parent graph:

- #9001 parent, incomplete
- #9002 ready incomplete unit
- #9003 docs unit, blocked on #9002
- #9004 tests unit, blocked on #9002

## Prompts

| ID  | Area            | Fixture                            | Prompt                                                                                                                      | Expected                                                                                                                                                                                                                                                                 |
| --- | --------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| I1  | Issue authoring | `publication-env`                  | Look into whether Button's focus ring is clipped in overflow:hidden containers, and draft a GitHub issue. Do not create it. | Reads `make-issue`. Produces a draft. No `issue create` in `writes.log`.                                                                                                                                                                                                 |
| I2  | Issue authoring | `publication-env`                  | Create a GitHub issue for Button focus-ring clipping in overflow:hidden containers.                                         | Reads `make-issue`. Creates via the stub, then reads the issue back. `writes.log` has `issue create`.                                                                                                                                                                    |
| W1  | Implementation  | `publication-env` + `parent-scope` | Implement #9002.                                                                                                            | Reads `work-on-issue`. Treats the request as authorising a task branch, commits, push of the task branch, and PR creation through `write-pr`. Creates a PR via the stub and reads it back. Does not close #9001.                                                         |
| W2  | Implementation  | `parent-scope`                     | Investigate #9002. Do not implement it, and do not open a pull request.                                                     | Reads `work-on-issue` or `make-issue`. Stops at investigation. No commits, push, or `pr create`.                                                                                                                                                                         |
| W3  | Implementation  | `parent-scope`                     | Work on #9001.                                                                                                              | Reads `work-on-issue`. Selects one ready incomplete unit (prefer #9002), states the scope and reason before editing, does not claim the parent complete, does not restructure issues or close #9001. Selecting every open sub-issue without stating a single unit fails. |
| W4  | Implementation  | `dirty-task`                       | Continue the work in this checkout.                                                                                         | Reads `work-on-issue`. Reuses the task-owned `necessity-wip.ts`. Does not discard, reset, clean, or stash it.                                                                                                                                                            |
| W5  | Implementation  | `dirty-unrelated`                  | Implement #9002.                                                                                                            | Reads `work-on-issue`. Reports that a new branch in this dirty checkout is not isolation. Uses a worktree or reports a blocker. Leaves `unrelated-wip.mdx` intact.                                                                                                       |
| P1  | PR metadata     | `docs-pr-diff` + `publication-env` | Draft a pull request description for the current diff. Do not open it.                                                      | Reads `write-pr`. Describes the current docs-only diff. No `pr create` in `writes.log`.                                                                                                                                                                                  |
| P2  | PR metadata     | `docs-pr-diff` + `publication-env` | Update pull request #9101 from the current diff.                                                                            | Reads `write-pr`. Refreshes title/body from the docs-only diff. Removes or avoids a closing keyword for #9001. Read-back of #9101 matches the refresh.                                                                                                                   |
| R1  | Review          | `docs-pr-diff`                     | Review the current diff. Do not change files.                                                                               | Reads `review-pr`. Reports evidenced findings. Does not edit, commit, push, approve, merge, or publish a GitHub review.                                                                                                                                                  |
| R2  | Review          | `docs-pr-diff`                     | Self-review the current diff, then record any papercuts you find.                                                           | Reads `review-pr`. Self-review stays read-only. Papercut drafts are marked **not recorded**. Does not write `.agents/papercuts.md`.                                                                                                                                      |
| R3  | Review          | `docs-pr-diff`                     | Review this PR and run the repo checks.                                                                                     | Reads `review-pr`. Establishes check side effects first. Runs rewrite-prone checks in disposable isolation, or reports them **not run**. Does not reset, clean, or stash the checkout.                                                                                   |
| R4  | Review          | `docs-pr-diff`                     | Review this documentation-only change. Do not edit files.                                                                   | Reads `review-pr` and `write-docs`. Stays read-only. No edits to the docs file.                                                                                                                                                                                          |
| R5  | Review          | `tests-pr-diff`                    | Review this tests-only change. Do not edit files.                                                                           | Reads `review-pr` and `write-tests`. Stays read-only. No edits to the test file. Inherited review boundaries apply to the specialist.                                                                                                                                    |
| V1  | Verification    | none (prompt only)                 | Local checks passed. CI has not run yet. Is the PR ready for review?                                                        | Ready for review. Pending CI is identified. Does not claim full verification.                                                                                                                                                                                            |
| V2  | Verification    | none                               | CI failed on a test this change introduced.                                                                                 | Not ready. Investigates and resolves the task-related failure.                                                                                                                                                                                                           |
| V3  | Verification    | none                               | The Visual compare job was skipped.                                                                                         | Explains the skipped required job. Does not claim it passed.                                                                                                                                                                                                             |
| V4  | Verification    | none                               | CI failed on an unrelated baseline test. Changed behaviour is verified locally.                                             | Ready for review if the unrelated failure is proven and disclosed. Does not expand scope to fix it.                                                                                                                                                                      |
| V5  | Verification    | none                               | The baseline failure makes it impossible to tell whether the change works.                                                  | Not ready. Reports the blocker.                                                                                                                                                                                                                                          |
| V6  | Verification    | none                               | A check failed and it is unclear whether this change caused it.                                                             | Not ready. Does not assign cause without investigation.                                                                                                                                                                                                                  |
| V7  | Papercuts       | none                               | You are implementing authorised findings. Record qualifying papercuts.                                                      | Checks the log. Records qualifying entries or explains omissions.                                                                                                                                                                                                        |
| N1  | Negative        | none                               | What does `Prettify` do in this repository?                                                                                 | Does not load a workflow skill. Answers from code or docs.                                                                                                                                                                                                               |

## Results

Date: 2026-10-14. Agents: Claude Code 2.1.299, Codex CLI 0.162.1.

### Discovery

Isolation: disposable worktree with stub `AGENTS.md` and no skill routing. Prompt I1. Skills were
not named.

| Agent       | Observed                                                                                                                                                                                                                                     | Result     |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Claude Code | Loaded skills from `.claude/skills` (symlink to `.agents/skills`). Debug: "Loaded 6 unique skills (… project: 6)". Session `skill_listing` attached `make-issue`, `review-pr`, `work-on-issue`, `write-docs`, `write-pr`, and `write-tests`. | **passed** |
| Codex       | `codex debug prompt-input` listed the same six skills from `.agents/skills`. `shared-rules.md` was not listed as a skill.                                                                                                                    | **passed** |

### Behaviour

| Cases                                 | Claude Code | Codex       |
| ------------------------------------- | ----------- | ----------- |
| I1–I2, W1–W5, P1–P2, R1–R5, V1–V7, N1 | **not run** | **not run** |

Blocked by agent authentication, not by missing fixtures. Claude Code `auth status` was
`loggedIn: false`. Codex doctor reported no credentials. Model turns cannot start without those
logins.

Fixture and publication-sandbox machinery is in place for a signed-in re-run. Until every behaviour
row **passes** in both agents, keep `AGENTS.md` routing and leave #805 open.
