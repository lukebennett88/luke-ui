# Luke UI agent guide

## Skills

Skills in `.agents/skills/` hold this repository's workflows. Some agents discover them there, and
others do not, so this list is the index. When a task matches a skill, read its whole `SKILL.md`
before you start. A grep, an excerpt, or a skill listing is not a read.

- Writing or investigating a GitHub issue:
  [.agents/skills/write-issue/SKILL.md](.agents/skills/write-issue/SKILL.md).
- Implementing an issue and opening its pull request:
  [.agents/skills/work-on-issue/SKILL.md](.agents/skills/work-on-issue/SKILL.md).
- Writing or updating a pull request title and body:
  [.agents/skills/write-pr/SKILL.md](.agents/skills/write-pr/SKILL.md).
- Reviewing a pull request or a diff:
  [.agents/skills/review-pr/SKILL.md](.agents/skills/review-pr/SKILL.md).
- Documentation, including pull request reviews that touch it:
  [.agents/skills/write-docs/SKILL.md](.agents/skills/write-docs/SKILL.md). This covers MDX pages in
  `apps/docs/content/docs/`, `docs/*.md`, READMEs, and JSDoc when it is the main task or documents a
  new public export or prop.
- Writing, changing, or reviewing tests, including pull request reviews that touch them:
  [.agents/skills/write-tests/SKILL.md](.agents/skills/write-tests/SKILL.md).

More than one skill can apply. To review a pull request, first check whether its diff touches
documentation, tests, or both.

## Universal rules

- Read the applicable [repository guides](README.md#repository-guides) before changing or reviewing
  their subject. Keep technical rules in those guides and workflows in skills.
- Preserve existing work and staging state. Do not reset, clean, stash, or overwrite it. Keep
  unrelated changes out of task commits.
- Follow the request's scope and stopping point. Git and GitHub write authority for implementation
  comes from [work-on-issue](.agents/skills/work-on-issue/SKILL.md#authority). Investigation,
  planning, and review do not grant it.
- Report checks as **passed**, **failed**, **pending**, or **not run**, with the verified revision.
  Distinguish local runs from CI inspected and explain skipped or unavailable checks.
- When a task encounters evidenced repository friction or a guidance violation, follow
  [.agents/papercuts.md](.agents/papercuts.md). Read-only review, including self-review, hands off
  candidates without writing the log.
