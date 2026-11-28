---
name: write-docs
description: >-
  Write, change, or review documentation in the Luke UI repository, including pull requests that
  change it: MDX pages in apps/docs/content/docs, docs/*.md guides, READMEs, and JSDoc when it is
  the main task or documents a new public export or prop.
---

# Write docs

[DOCUMENTATION.md](../../../docs/DOCUMENTATION.md) owns the documentation rules and wins where this
skill disagrees.

## Workflow

1. Name the surface and its reader. See [Surfaces](../../../docs/DOCUMENTATION.md#surfaces).
2. Search the docs for the topic. When another page owns it, link to that page.
3. Match an existing file of the same kind: the component guide exemplar in the
   [Authoring checklist](../../../docs/DOCUMENTATION.md#authoring-checklist), or a comparable guide,
   README, or public declaration.
4. Read the guide sections the change touches. Check the whole page against
   [Review](../../../docs/DOCUMENTATION.md#review), including whether the docs match the code.
5. Run `pnpm run check` from the repository root.

## Reviewing

- Follow [review-pr's check boundaries](../review-pr/SKILL.md#checks), even when this skill runs
  alone. Read existing check results first, cover gaps with isolated checks, and spend the review on
  what the checks cannot catch.
- Cite the DOCUMENTATION.md section that owns a convention, not this skill. Show a defect that has
  no written convention, such as a wrong statement, a broken link, or a rendering problem. A
  preference with neither a convention nor a concrete impact is not a defect.
- Report each problem once, with every location. Leave out speculative findings and nits.
