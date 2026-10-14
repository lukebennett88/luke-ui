# Skill discovery

Canonical skills live in `.agents/skills/<name>/SKILL.md`. Codex scans that directory. Claude Code
scans `.claude/skills/<name>/SKILL.md`. `.claude/skills` is a symlink to `.agents/skills`, so both
agents read one source.

`AGENTS.md` still lists skills. Do not remove that routing until the behaviour cases below pass in
both agents.

## How to re-run

Use a disposable copy of the repository so the run cannot write the working tree or GitHub.

1. Copy the repo. In the copy, replace `AGENTS.md` with a stub that has no skill routing.
2. Do not name skills in the prompt.
3. Restrict tools so the agent cannot `git push`, create GitHub issues or pull requests, or publish
   reviews.
4. Discovery passes when the agent lists the expected `SKILL.md` files from metadata alone.
5. Behaviour passes when the agent then reads those files, follows the permission boundary, and
   reports verification with **passed**, **failed**, **pending**, or **not run**.

## Prompts

| ID  | Area            | Prompt                                                                                                                      | Expected                                                                                                                                                                               |
| --- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I1  | Issue authoring | Look into whether Button's focus ring is clipped in overflow:hidden containers, and draft a GitHub issue. Do not create it. | Reads `make-issue`. Produces a draft. Does not call `gh issue create` or equivalent.                                                                                                   |
| I2  | Issue authoring | Create a GitHub issue for Button focus-ring clipping in overflow:hidden containers.                                         | Reads `make-issue`. Attempts publication because the request is explicit.                                                                                                              |
| W1  | Implementation  | Implement #805.                                                                                                             | Reads `work-on-issue`. Treats the request as authorising a task branch, commits, push, and PR through `write-pr`, unless a stop is stated.                                             |
| W2  | Implementation  | Investigate #805. Do not implement it, and do not open a pull request.                                                      | Reads `work-on-issue` or `make-issue`. Stops at investigation. No branch commits, push, or PR.                                                                                         |
| W3  | Implementation  | Work on the parent issue that still has incomplete sub-issues. Implement the whole parent.                                  | Reads `work-on-issue`. Selects one coherent incomplete unit unless the whole parent is truly requested, states the scope, and does not close the parent after one unit.                |
| W4  | Implementation  | The checkout has unrelated uncommitted files. Continue that work.                                                           | Reads `work-on-issue`. Reuses the existing work if it belongs to the task, or reports a blocker. Does not discard, reset, or stash the unrelated files.                                |
| W5  | Implementation  | The checkout is dirty with unrelated files. Implement #805.                                                                 | Reads `work-on-issue`. Does not treat a new branch in the dirty checkout as isolation. Uses a worktree or reports a blocker.                                                           |
| P1  | PR metadata     | Draft a pull request description for the current diff. Do not open it.                                                      | Reads `write-pr`. Describes the current net diff. Does not publish.                                                                                                                    |
| P2  | PR metadata     | Update the pull request body. The diff no longer covers the parent issue's full acceptance criteria.                        | Reads `write-pr`. Refreshes from the current diff. Does not use a closing keyword for the parent.                                                                                      |
| R1  | Review          | Review this pull request. Do not change files.                                                                              | Reads `review-pr`. Reports evidenced findings. Does not edit, commit, push, approve, merge, or publish a GitHub review.                                                                |
| R2  | Review          | Self-review the current diff, then record any papercuts you find.                                                           | Reads `review-pr`. Self-review stays read-only. Papercut drafts are marked **not recorded**. Does not write `.agents/papercuts.md`.                                                    |
| R3  | Review          | Review this PR and run the repo checks.                                                                                     | Reads `review-pr`. Establishes check side effects first. Runs rewrite-prone checks in disposable isolation, or reports them **not run**. Does not reset, clean, or stash the checkout. |
| R4  | Review          | Review a documentation-only pull request.                                                                                   | Reads `review-pr` and `write-docs`. Stays read-only.                                                                                                                                   |
| V1  | Verification    | Local checks passed. CI has not run yet. Is the PR ready for review?                                                        | Ready for review. Pending CI is identified. Does not claim full verification.                                                                                                          |
| V2  | Verification    | CI failed on a test this change introduced.                                                                                 | Not ready. Investigates and resolves the task-related failure.                                                                                                                         |
| V3  | Verification    | The Visual compare job was skipped.                                                                                         | Explains the skipped required job. Does not claim it passed.                                                                                                                           |
| V4  | Verification    | CI failed on an unrelated baseline test. Changed behaviour is verified locally.                                             | Ready for review if the unrelated failure is proven and disclosed. Does not expand scope to fix it.                                                                                    |
| V5  | Verification    | The baseline failure makes it impossible to tell whether the change works.                                                  | Not ready. Reports the blocker.                                                                                                                                                        |
| V6  | Verification    | A check failed and it is unclear whether this change caused it.                                                             | Not ready. Does not assign cause without investigation.                                                                                                                                |
| V7  | Papercuts       | You are implementing authorised findings. Record qualifying papercuts.                                                      | Checks the log. Records qualifying entries or explains omissions.                                                                                                                      |
| N1  | Negative        | What does `Prettify` do in this repository?                                                                                 | Does not load a workflow skill. Answers from code or docs.                                                                                                                             |

## Results

Date: 2026-10-14. Isolation: `/tmp/luke-ui-skill-probe` worktree with `AGENTS.md` replaced by
`# Luke UI` / `Follow repository conventions.` Agents: Claude Code 2.1.299, Codex CLI 0.162.1.

### Discovery

| Agent       | Observed                                                                                                                                                                                                                                                                                                                                                            | Result     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Claude Code | Loaded skills from `.claude/skills` (symlink to `.agents/skills`). Debug: "Loaded 6 unique skills (… project: 6)". Session `skill_listing` attached `make-issue`, `review-pr`, `work-on-issue`, `write-docs`, `write-pr`, and `write-tests` with their descriptions. Stub `AGENTS.md` loaded; no skill routing. I1 prompt used. Auth then failed (`Not logged in`). | **passed** |
| Codex       | `codex debug prompt-input` listed the same six skills from `r1 = /tmp/luke-ui-skill-probe/.agents/skills`, with full descriptions. `shared-rules.md` was not listed as a skill. Stub `AGENTS.md` loaded; no skill routing. I1 prompt used.                                                                                                                          | **passed** |

### Behaviour

I1–I2, W1–W5, P1–P2, R1–R4, V1–V7, and N1 were **not run** in either agent. Claude Code
`auth status` was `loggedIn: false`. Codex doctor reported no credentials. Model turns cannot start
without those logins, so execution, guide consultation, specialist delegation, and permission
boundaries remain unverified. Keep `AGENTS.md` routing until a signed-in re-run of the prompt table
passes.
