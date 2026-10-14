---
name: write-docs
description: >-
  Write, change, or review documentation in the Luke UI repository, including pull requests that
  change it: MDX pages in apps/docs/content/docs, docs/*.md guides, READMEs, and JSDoc when it is
  the main task or documents a new public export or prop. Use when asked to write, update, or review
  docs. Do not use to file issues, implement a tracked issue, or open a pull request.
---

# Write docs

[DOCUMENTATION.md](../../../docs/DOCUMENTATION.md) owns the documentation rules. This skill helps
you apply them. When this skill and the guide disagree, the guide wins. When invoked from a workflow
skill, inherit that workflow's permission and safety boundaries.

## Workflow

1. Name the surface and its reader. See [Surfaces](../../../docs/DOCUMENTATION.md#surfaces).
2. Search the docs for the topic. When another page owns it, link to that page.
3. Find an existing file of the same kind and match it: the component guide exemplar in the
   [Authoring checklist](../../../docs/DOCUMENTATION.md#authoring-checklist), or a comparable
   authored guide, internal guide, README, or public declaration.
4. Read the guide sections that the checklist below links to for your change.
5. Write the change, run `pnpm run check` from the repo root, and work through the checklist.

## Quality checklist

Authors use this before finishing. Reviewers use it on the diff.

- [ ] Does each section belong on this page and help its reader?
      [What documentation is for](../../../docs/DOCUMENTATION.md#what-documentation-is-for),
      [Public documentation scope](../../../docs/DOCUMENTATION.md#public-documentation-scope),
      [Internal documentation scope](../../../docs/DOCUMENTATION.md#internal-documentation-scope)
- [ ] Say it once. Put guidance on the page that owns the topic, and link to it from other pages.
      ([Writing style](../../../docs/DOCUMENTATION.md#writing-style))
- [ ] Does the prose meet the writing rules?
      [Writing style](../../../docs/DOCUMENTATION.md#writing-style),
      [Instructions](../../../docs/DOCUMENTATION.md#instructions)
- [ ] Do examples, page structure, and JSDoc follow their rules?
      [Examples](../../../docs/DOCUMENTATION.md#examples),
      [MDX page structure](../../../docs/DOCUMENTATION.md#mdx-page-structure),
      [API reference](../../../docs/DOCUMENTATION.md#api-reference),
      [Comments and JSDoc](../../../docs/DOCUMENTATION.md#comments-and-jsdoc)
- [ ] Does the whole page survive the page-level questions?
      [Review](../../../docs/DOCUMENTATION.md#review)
- [ ] Do the docs match the code after the change?
      [Keeping docs current](../../../docs/DOCUMENTATION.md#keeping-docs-current)

## Reviewing

- Run `pnpm run check` first. Do not report what it already catches. Spend the review on what it
  cannot.
- Support every finding with evidence. For a convention violation, cite the DOCUMENTATION.md section
  that owns it, not this skill. For a defect without a written convention, such as a wrong
  statement, a broken link, or a rendering problem, show it. Do not report a preference as a defect
  without a convention or a concrete impact.
- Report each problem once, with every location. Leave out speculative findings and nits.
