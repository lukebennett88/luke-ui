# Standard structure for `.docs.md` prose files

Every `src/<component>/<component>.docs.md` file follows the same section order. Readers can then
predict where to find usage, props, accessibility notes, and cross-references regardless of which
component they are reading.

This extends [ADR-0003](0003-package-docs-surface.md), which established the two-surface docs split
and the "prose only" rule for `.docs.md` files.

## Decision

Use this section order:

1. **Usage lead-in**: unheaded prose and minimal code examples. Do not write an explicit `## Usage`
   heading. `render-page.ts` injects that heading when it assembles the generated package doc.
2. **`## Best Practices`**: a two-column `| Guidance | Practices |` table. `Guidance` contains plain
   `Do` or `Don't`. `Practices` contains the sentence. This is not a paired `| Do | Don't |` table.
   Add only rows that carry useful guidance.
3. **Feature sections**: one `##` heading per prop or concept, such as `## Size`, `## Tone`, or
   `## Validation`. Order sections by importance to a typical consumer. Do not sort alphabetically
   or follow TypeScript declaration order by default.
4. **`## Accessibility`**: include this when the component has user-facing accessibility behaviour
   to explain. Delete it when the component has nothing beyond default semantics to call out.
5. **Cross-reference sections**: always last.

Cross-reference section names:

- `## Primitive {Name}` for a composed component with a same-subpath, single-component primitive
  counterpart. `{Name}` is the primitive export name. Example: `## Primitive TextInput` in
  `text-field.docs.md`.
- `## Primitive kit` for a same-subpath primitive kit with multiple exports. Example:
  `combobox-field/primitive`.
- `## When to use vs {Name}` for an easily confused sibling component.

These names apply to component docs in the package: atoms, composed components, and component
utilities documented under the same subpath export.

## Rejected option

We rejected leaving the shape as tribal knowledge. "Copy a sibling file" did not catch drift.
`button.docs.md` had no headings while other component docs used one `##` heading per feature, and
nothing flagged the mismatch.

## Docs are authored in the package

All component prose is authored in `packages/@luke-ui/react/src/<component>/<component>.docs.md`,
next to the component source.

Hosted docs MDX files under `apps/docs` are wiring only. They contain frontmatter, the interactive
`<story.WithControl />` demo, and an `<include>` for generated package docs.

## Consequences

- The component generator scaffolds `## Best Practices` and `## Accessibility` placeholders for new
  component docs.
- Primitives have no `.docs.md` file and no authored `## Usage` heading, per ADR-0003.
- Placeholder content in `.docs.md` must be visible text, not HTML comments. Generated Markdown is
  included in Fumadocs MDX and also read as plain Markdown by npm users and agents.
- Visible placeholders are easier to catch than hidden comments. A forgotten hidden comment can
  render as an empty section with no clue.
- This standard applies to Atom and Composed component docs. A separate audit can update older files
  that do not yet match it.
