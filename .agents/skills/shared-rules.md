# Shared workflow rules

These rules apply to `make-issue`, `work-on-issue`, `write-pr`, and `review-pr`.

- Authority comes from the request, not from discovering a skill. Honour stated scope limits and
  stopping points. Reading or drafting does not authorise GitHub writes.
- Preserve existing work and staging state. Do not discard, overwrite, reset, clean, or stash it
  without explicit authority. Keep unrelated changes out of task commits.
- Prefer `git` and `gh` when available. Equivalent tools are allowed. Permissions and outcomes must
  match in Claude Code and Codex. Verify external writes by reading the result back. Report
  unavailable capabilities.
- Identify the revision verified. Distinguish local checks run from CI inspected. Report each as
  **passed**, **failed**, **pending**, or **not run**, with reasons for skipped or unavailable
  checks.
- Consult relevant guides and specialist skills. Their instructions inherit the enclosing workflow's
  permission and safety boundaries.
