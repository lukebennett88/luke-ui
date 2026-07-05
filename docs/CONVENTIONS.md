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
- **Primitive**: a building block for library authors. Primitives are documented in package docs,
  but not in hosted docs. A primitive may be a single file or a multi-file kit.

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

`.docs.md` files follow the structure in [ADR-0006](adr/0006-docs-md-structure-standard.md). Humans
and coding agents both read these docs, so optimise for clarity, not only brevity.

Headings use sentence case: capitalise only the first word and proper nouns.

Do not compress a sentence until the point is hard to parse. Do not add content whose only value is
explaining one editing session.

`CONTEXT.md` stays a terse index that links to ADRs. If a section starts restating an ADR in full,
the content belongs in the ADR instead.

### Keeping docs current

Docs must stay factually accurate: no doc should state something false about the code — a path,
command, script, export, type, code snippet, or cross-reference that has since changed or been
removed. This covers everything a human writes (comments, JSDoc, `.docs.md` prose, `README.md`,
`docs/*.md`), not generated output; when generated docs are wrong, fix the authored source, not the
generated file.

- Update or delete the docs that describe code in the same change as the code. Most rot is a doc
  that outlived the change that should have touched it.
- When you move, rename, or remove a file, script, `pnpm run` command, export, or symbol, search the
  docs for references and fix or delete them.
- Prefer generated or derived content over hand-maintained duplication. Before adding a list or
  table that mirrors the code or file tree, don't — point at the source of truth instead. If such a
  list must exist, update it whenever you add or remove what it enumerates.
- Reference stable things. Don't pin prose to volatile details like line numbers, generated class
  names, or exact command output; reference the durable path, command, or heading instead.

## Fumadocs stories

Each component's interactive hosted-docs demo lives in one file:
`apps/docs/src/<component>/<component>.story.tsx`.

The story uses `@fumadocs/story/vite/client`, which is registered as a Vite plugin in
`apps/docs/vite.config.ts`.

Define a narrow `<Component>StoryProps` type with `Pick<<Component>Props, 'a' | 'b'>`. Include only
props that make useful hosted controls. Drop event handlers, refs, escape hatches such as
`className` and `style`, and obscure ARIA props.

Control order follows the key order inside `Pick`, not the declaration order in `<Component>Props`.
`@fumadocs/story` reads the resolved type with `ts-morph` and preserves the pick order, so list keys
in the order they should appear in the panel.

Render the real component through a small `<Component>Playground` wrapper inside the shared
`StoryWrapper` from `../lib/story-wrapper`. Pass it directly to
`defineStory({ Component, args: { initial } })`.

Generic components should fix the generic to one concrete sample type inside the playground. See
`combobox-field.story.tsx`.

Keep story props aligned with `.docs.md` feature sections. If you add a feature section for a prop,
add that prop to the story `Pick` in the same change.

Initial values should be short and legible, like the `.docs.md` examples. Do not use lorem ipsum.

Hosted `.mdx` files are wiring only: frontmatter, an interactive demo, and an `<include>` for
generated package docs. Do not add hand-authored component prose there.
