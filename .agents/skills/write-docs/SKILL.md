---
name: write-docs
description: >-
  Write, change, or review documentation in the Luke UI repository, including pull requests that
  change it: MDX pages in apps/docs/content/docs, docs/*.md guides, READMEs, and JSDoc when it is
  the main task or documents a new public export or prop.
---

# Write docs

When the task concerns ownership or dependencies, consult
[Architecture](../../../docs/ARCHITECTURE.md).

[DOCUMENTATION.md](../../../docs/DOCUMENTATION.md) owns the documentation rules. This skill helps
you apply them. When this skill and the guide disagree, the guide wins.

## Workflow

1. Name the surface and its reader. See [Surfaces](../../../docs/DOCUMENTATION.md#surfaces).
2. Search the docs for the topic. When another page owns it, link to that page.
3. Find an existing file of the same kind and match it: the component guide exemplar in the
   [Authoring checklist](../../../docs/DOCUMENTATION.md#authoring-checklist), or a comparable
   authored guide, internal guide, README, or public declaration.
4. Read the guide sections relevant to the change. Check the whole page using
   [Review](../../../docs/DOCUMENTATION.md#review), including whether the docs match the code.
5. Run `pnpm run check` from the repo root.

## Reviewing

- Follow [review-pr's check boundaries](../review-pr/SKILL.md#checks), including when this skill is
  used alone. Inspect existing check results first. Cover gaps with safe checks in isolation. Spend
  the review on what the checks cannot catch.
- Support every finding with evidence. For a convention violation, cite the DOCUMENTATION.md section
  that owns it, not this skill. For a defect without a written convention, such as a wrong
  statement, a broken link, or a rendering problem, show it. Do not report a preference as a defect
  without a convention or a concrete impact.
- Report each problem once, with every location. Leave out speculative findings and nits.
