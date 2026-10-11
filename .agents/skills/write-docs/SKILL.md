---
name: write-docs
description: >-
  Write, change, or review documentation in the Luke UI repository, including pull requests that
  change it: MDX pages in apps/docs/content/docs, docs/*.md guides, READMEs, and JSDoc when it is
  the main task or documents a new public export or prop.
---

# Write docs

[DOCUMENTATION.md](../../../docs/DOCUMENTATION.md) owns the documentation rules. This skill is the
workflow around it. When the two disagree, the guide wins.

## Workflow

1. Name the surface and its reader. Public docs serve a developer building with Luke UI. Internal
   guides in `docs/` serve a contributor. See [Surfaces](../../../docs/DOCUMENTATION.md#surfaces).
2. Search the existing docs for the topic before you write. When another page owns it, link to that
   page instead of repeating it.
3. Read the guide sections for the change:
   - What belongs:
     [What documentation is for](../../../docs/DOCUMENTATION.md#what-documentation-is-for),
     [Public documentation scope](../../../docs/DOCUMENTATION.md#public-documentation-scope), and
     [Internal documentation scope](../../../docs/DOCUMENTATION.md#internal-documentation-scope).
   - Wording: [Writing style](../../../docs/DOCUMENTATION.md#writing-style) and
     [Instructions](../../../docs/DOCUMENTATION.md#instructions).
   - Component guides: [Examples](../../../docs/DOCUMENTATION.md#examples),
     [MDX page structure](../../../docs/DOCUMENTATION.md#mdx-page-structure), and
     [API reference](../../../docs/DOCUMENTATION.md#api-reference).
   - JSDoc: [Comments and JSDoc](../../../docs/DOCUMENTATION.md#comments-and-jsdoc).
4. Open an exemplar of the same kind and match it:
   - Component guide: `apps/docs/content/docs/components/actions/button.mdx`, with its examples in
     `apps/docs/src/examples/button/`.
   - Authored guide: `apps/docs/content/docs/docs/forms.mdx`.
   - Internal guide: `docs/TESTING.md`.
5. Write the change, then run the checks and the checklist below.

## Verify

- Run `pnpm run check` from the repo root. It runs `check:docs` and `check:format-root`, which
  covers `docs/*.md`.
- If `check:format-root` fails on Markdown wrapping, run `pnpm run fix:format-root`. Do not re-wrap
  by hand.
- When you rename or remove a heading in `docs/`, search `.agents/skills/` for links to it.

## Quality checklist

Authors run this before finishing. Reviewers run it on the diff.

- [ ] Each section helps its reader answer a real question. Content that answers none is cut.
- [ ] No filler: no promotional adjectives, no lead-in that restates a heading or example, and no
      summary at the end of a section.
- [ ] Nothing is said twice, on this page or on another page. Repeated guidance becomes a link.
- [ ] Each sentence carries one idea in plain words. Instructions are commands.
- [ ] Public docs contain no implementation detail that leaves a developer's code unchanged.
- [ ] Examples are typechecked files, focused on one behaviour, with neutral content.
- [ ] Docs that describe changed code match it. No stale path, command, export, or heading link.

When reviewing:

- Run `pnpm run check` first. Do not report problems it already enforces.
- Give each finding a file and line, and cite the guide section that owns the rule.
- Report a problem once, with every location, rather than one comment per instance. Leave out
  preferences that no guide section supports.
