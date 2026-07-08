# Documentation

Use this guide when you write or move Luke UI documentation.

## Primary docs surface

The hosted docs app in `apps/docs` is the primary docs surface for app developers and library
authors. Component prose lives in `apps/docs/content/docs/**/*.mdx`.

Do not add generated package docs or `*.docs.md` files under `packages/@luke-ui/react/src/`.

The package README links to the hosted docs. Fumadocs provides:

- `/llms.txt` for the component index.
- `/llms-full.txt` for full docs.
- Per-page Markdown by appending `.md` to a docs URL.

## Component docs

Atoms and composed components get hosted docs pages in the primary component navigation.

Primitives are public API for library authors. Document every primitive export path in hosted docs.
Primitive pages live in the "Primitives" section under components.

Component pages may link to their related primitive pages, but should not carry the full primitive
API reference. Keep primitive pages separate from the primary app-developer component path unless
they become app-developer-facing.

Do not document exports that are not public API.

## MDX page structure

Use this order for component pages:

1. Frontmatter.
2. Short usage lead-in.
3. Primary example.
4. `## Best practices`, when the component needs explicit guidance.
5. Feature sections, ordered by importance to a consumer.
6. `## Accessibility`, when the component has user-facing accessibility behaviour worth calling out.
7. Related-component sections.
8. `## Props` with `<auto-type-table>`.

Keep cross-reference sections near the end. Keep props tables last.

Headings use sentence case. Capitalise only proper nouns and product names.

## Examples

Interactive examples live in `apps/docs/src/examples/<component>/`.

An example module default-exports a React component. Reference it from an MDX page with
`<ExampleBlock src="<component>/<name>" title="..." description="..." />`.

Keep example content aligned with the section that mentions it. If you add a feature section, add or
update an example in the same change when the feature is easier to understand visually.

Use short, legible sample values. Do not use lorem ipsum.

## API reference

Hosted `.mdx` files contain component prose, example blocks, and `<auto-type-table>` for API
reference. The API table comes from TypeScript types.

Component interfaces should redeclare important inherited `react-aria-components` props with useful
JSDoc. Long-tail inherited props can use a clear pointer to the upstream React Aria component.

## Keeping docs current

Docs must stay factually accurate. No authored doc should keep a stale path, command, script,
export, type, snippet, or cross-reference.

This applies to comments, JSDoc, MDX files in `apps/docs/content/docs/`, `README.md`, package
READMEs, and files in `docs/`.

- Update or delete docs that describe code in the same change as the code.
- When you move, rename, or remove a file, script, command, export, or symbol, search docs for old
  references.
- Prefer generated or source-owned content over hand-maintained lists that mirror code.
- Reference stable paths, commands, and headings. Do not pin docs to line numbers, generated class
  names, or exact command output.
- Do not add content that only explains one editing session.
