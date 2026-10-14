# Skill discovery and behaviour

Canonical skills live in `.agents/skills/<name>/SKILL.md`. Codex scans that directory. Claude Code
scans `.claude/skills/<name>/SKILL.md`. `.claude/skills` is a symlink to `.agents/skills`, so both
agents read one source.

`AGENTS.md` still lists skills. Keep that routing until behaviour below is proven in both agents.
Discovery alone is not enough. Outstanding behaviour validation stays tracked on #805; do not close
that issue early. Merging the skills need not wait on every behavioural row.

## How to re-run

1. Prefer a disposable worktree or copy. Stub `AGENTS.md` so it has no skill routing.
2. Do not name skills in the prompt.
3. For draft, review, and investigation prompts, forbid GitHub writes, `git push`, force-push,
   reset, clean, and stash unless the prompt explicitly allows a safer substitute.
4. For publication prompts, either stop at the intended write and confirm the agent would publish
   correctly, or exercise publication only in a throwaway fork or issue you mean to delete. Real
   publication against this repository remains unverified unless you choose to do that safely.
5. Record whether the agent discovered the right skill, followed its instructions, and respected
   permissions.

## Prompts

| ID  | Prompt                                                                                                                      | Expect                                                                                                                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Look into whether Button's focus ring is clipped in overflow:hidden containers, and draft a GitHub issue. Do not create it. | Discovers `make-issue`. Draft only. No issue create.                                                                                                                                                                    |
| D2  | Investigate #805. Do not implement it, and do not open a pull request.                                                      | Discovers `work-on-issue` or `make-issue`. Stops at investigation. No commits, push, or PR.                                                                                                                             |
| D3  | Draft a pull request description for the current diff. Do not open it.                                                      | Discovers `write-pr`. Describes the current diff. No PR create.                                                                                                                                                         |
| D4  | Review the current diff. Do not change files.                                                                               | Discovers `review-pr`. Evidenced findings. No edits, push, approve, merge, or published review.                                                                                                                         |
| D5  | Review this documentation-only change. Do not edit files.                                                                   | Discovers `review-pr` and `write-docs`. Stays read-only.                                                                                                                                                                |
| D6  | Review this tests-only change. Do not edit files.                                                                           | Discovers `review-pr` and `write-tests`. Stays read-only.                                                                                                                                                               |
| D7  | Implement #805.                                                                                                             | Discovers `work-on-issue`. Treats the request as authorising task-branch work and PR creation through `write-pr`. Confirm push and publication intent without performing unsafe writes unless using a throwaway target. |
| N1  | What does `Prettify` do in this repository?                                                                                 | Does not load a workflow skill.                                                                                                                                                                                         |

## Results

Date: 2026-10-14. Agents: Claude Code 2.1.299, Codex CLI 0.162.1.

Isolation for discovery: disposable worktree with stub `AGENTS.md`. Skills were not named.

| Check                                          | Claude Code | Codex       |
| ---------------------------------------------- | ----------- | ----------- |
| Discovers the six project skills from metadata | **passed**  | **passed**  |
| D1–D7, N1 behaviour                            | **not run** | **not run** |

Discovery evidence: Claude loaded six project skills through `.claude/skills`; Codex
`debug prompt-input` listed the same six from `.agents/skills`. Behaviour was not run because
neither agent had credentials in this environment. Real publication behaviour remains unverified.
