# Conventions

## TypeScript

Use strict TypeScript. Import types with `import type`. Local imports include the explicit `.js`
extension.

## Formatting

`oxfmt` owns formatting. The repo uses tabs with width 2, 100-column wrapping, single quotes in
TypeScript, and double quotes in JSX.

## Naming

- **Components**: `PascalCase`, for example `Button.tsx`
- **Props**: `PascalCaseProps`, for example `ButtonProps`
- **Files**: `kebab-case`, for example `icon-button.tsx`
- **CSS**: `*.css.ts`
- **Stories**: `*.stories.tsx`

## Testing

See [TESTING.md](TESTING.md) for test type, placement, and writing rules.

Short version:

- Use the smallest test surface that proves the behaviour.
- Colocate tests with the source they cover.
- Test through public APIs and role-based queries.
- Start bug fixes with a failing test that reproduces the bug.

## Component Pattern

Components wrap `react-aria-components` and use `composeRenderProps` for styling.

Components follow the three-tier taxonomy from [CONTEXT.md](../CONTEXT.md):

- **Atom**: a single conceptual unit used directly by app developers, such as `Text`, `Link`,
  `Icon`, `Heading`, `Numeral`, `Emoji`, or `LoadingSpinner`. Atoms get hosted docs pages.
- **Composed**: an app-developer-facing pattern built from atoms or primitives, such as `Button`,
  `IconButton`, `TextField`, or `ComboboxField`. Composed components get hosted docs pages.
- **Primitive**: a building block for library authors. Primitives are documented in the hosted docs
  app under a de-emphasised "Library authors" section, but not in the primary navigation. A
  primitive may be a single file or a multi-file kit.

## Package paths

Composed components export at their bare package path, such as `@luke-ui/react/button`.

Primitive kits that support a composed component export at `[composed]/primitive`, for example:

- `@luke-ui/react/text-field/primitive`
- `@luke-ui/react/combobox-field/primitive`
- `@luke-ui/react/field/primitive`
- `@luke-ui/react/button/primitive`

## Exports

`tsdown` entry globs manage package exports. Do not hand-edit `package.json#exports`. Create files
in paths the package build already discovers.

## Docs

Component docs pages follow the structure in [ADR-0006](../docs/adr/0006-docs-md-structure-standard.md) (now superseded by ADR-0007; the section ordering still applies). Humans
and coding agents both read these docs, so optimise for clarity, not only brevity.

Headings use sentence case: capitalise only the first word and proper nouns.

Do not compress a sentence until the point is hard to parse. Do not add content whose only value is
explaining one editing session.

`CONTEXT.md` stays a terse index that links to ADRs. If a section starts restating an ADR in full,
the content belongs in the ADR instead.

### Keeping docs current

Docs must stay factually accurate: no doc should state something false about the code — a path,
command, script, export, type, code snippet, or cross-reference that has since changed or been
removed. This covers everything a human writes (comments, JSDoc, MDX prose in `apps/docs/content/docs/`,
`README.md`, `docs/*.md`), not generated output; when generated docs are wrong, fix the authored
source, not the generated file.

- Update or delete the docs that describe code in the same change as the code. Most rot is a doc
  that outlived the change that should have touched it.
- When you move, rename, or remove a file, script, `pnpm run` command, export, or symbol, search the
  docs for references and fix or delete them.
- Prefer generated or derived content over hand-maintained duplication. Before adding a list or
  table that mirrors the code or file tree, don't — point at the source of truth instead. If such a
  list must exist, update it whenever you add or remove what it enumerates.
- Reference stable things. Don't pin prose to volatile details like line numbers, generated class
  names, or exact command output; reference the durable path, command, or heading instead.

## Fumadocs examples

Each component's interactive hosted-docs demo lives in example modules under
`apps/docs/src/examples/<component>/`. An example module exports `meta` with a title and
description, and a default component that renders the example.

Use the `<Example>` component in an MDX page:

```tsx
<Example component="button" name="tones" />
```

`<Example>` renders a live preview and a "Code" tab with the example source.

Keep example content aligned with the MDX feature sections. If you add a feature section for a prop
or pattern, add or update an example in the same change.

Initial values should be short and legible. Do not use lorem ipsum.

Hosted `.mdx` files contain the component prose, frontmatter, `<Example>` components, and an
`<auto-type-table>` for the API reference. Do not add generated package docs.
