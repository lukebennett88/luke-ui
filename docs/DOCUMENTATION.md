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

## Writing style

These rules cover MDX pages, JSDoc, code comments, and package READMEs.

**Simplified Technical English.** Luke UI follows the rules of ASD-STE100. The approved-word
dictionary needs a paid licence. This guide states the rule set only, not the word list.

- Write descriptive sentences with 25 words or fewer. Write instructions with 20 words or fewer.
  Split a long sentence into two. Do not trim words from it.
- Write one instruction per sentence. Keep each paragraph to six sentences or fewer.
- Use active voice. Name the actor in each sentence.
- Write instructions as commands. Write "Pass a title", not "A title should be passed".
- Use simple tenses. Avoid perfect tenses, such as "has changed", and continuous tenses, such as "is
  changing".
- Keep articles. Do not drop "the" or "a" to shorten a sentence.
- Avoid "-ing" forms as nouns or in participial phrases. An established technical name, such as
  "styling" or "theming", is an exception.
- Keep noun clusters to three words or fewer.
- Write positively. Avoid double negatives, such as "not uncommon".
- State what a thing does. Avoid "can be used to", "allows you to", and "enables you to".

**One term per concept.** Do not use different words for the same concept. Use the same word every
time.

| Term                   | Definition                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `someone`              | The person who uses an interface built with Luke UI. Never write "a person", "people", "users", or "the user".                                   |
| `developer`            | The reader of these docs.                                                                                                                        |
| `assistive technology` | A singular, uncountable term. Never write "assistive technologies". Write "screen reader" only when the behaviour is specific to screen readers. |
| `control`              | An interactive element.                                                                                                                          |
| `field`                | A label, control, description, and validation message together.                                                                                  |
| `set`                  | Use `set` for a boolean prop.                                                                                                                    |
| `pass`                 | Use `pass` for a value or node prop.                                                                                                             |
| `choose`               | Use `choose` when someone picks from options.                                                                                                    |
| `select`               | Use `select` only for a control's selection state.                                                                                               |

**Spelling and punctuation.** Spell words in Australian English. Write headings in sentence case. Do
not use an em dash or a semicolon in prose. One exception applies. The em dash inside an
`<ExampleBlock title>` separates the title from its qualifier. It stays.

**Comments explain the code, not its history.** Luke UI is pre-1.0. Do not carry a prior state in a
comment.

- Do not write "previously", "used to", "no longer", "an earlier pass", or "the old X".
- Do not use an issue number to narrate why a change happened.
- Do not name another design system to justify a decision. A design system may appear as test
  reference data, as `theme/__fixtures__/radix-scales.ts` does.
- Keep an explanation that justifies a rule a reader would otherwise undo. When unsure, shorten the
  explanation rather than delete it.

**Say it once.** Cut a sentence when its only content restates the prop, token, or concept in its
own heading.

## Component docs

Atoms and composed components get hosted docs pages in the primary component navigation.

Primitives are public API for library authors. Document every primitive export path in hosted docs.
Primitive pages live in the "Primitives" section under components.

Component pages may link to their related primitive pages, but should not carry the full primitive
API reference. Keep primitive pages separate from the primary app-developer component path unless
they become app-developer-facing.

Do not document exports that are not public API.

## MDX page structure

Each component has a folder named for its URL slug:

- `index.mdx` is the component guide and keeps the `/components/<group>/<component>` URL.
- `props.mdx` is the API reference at `/components/<group>/<component>/props`.
- `meta.json` uses `"pages": ["!props"]` and `"collapsible": false` so the component stays one
  ordinary sidebar link without exposing the props page in the tree.

The page header adds Guide and Props links from these routes. Keep that navigation in the shared
docs route rather than duplicating it in MDX.

Use this order for component guide pages:

1. Frontmatter.
2. Short usage lead-in.
3. Primary example.
4. `## Best practices`, when the component needs explicit guidance.
5. Feature sections, ordered by importance to a consumer.
6. `## Accessibility`, when the component has user-facing accessibility behaviour worth calling out.
7. Related-component sections.

Keep cross-reference sections near the end. Put only the `## Props` section and its
`<auto-type-table>` content on `props.mdx`.

Headings use sentence case. Capitalise only proper nouns and product names.

## Examples

Interactive examples live in `apps/docs/src/examples/<component>/`.

An example module default-exports a React component. Reference it from an MDX page with
`<ExampleBlock src="<component>/<name>" title="..." description="..." />`.

Every component guide starts with a focused `basic.tsx` example and references it as the primary
`<ExampleBlock src="<component>/basic" ... />`. This is the default first example generated for a
new component.

Keep example content aligned with the section that mentions it. If you add a feature section, add or
update an example in the same change when the feature is easier to understand visually.

Use short, legible sample values. Do not use lorem ipsum.

Prefer a typechecked `ExampleBlock` over an inline TSX fence whenever the code benefits from a
rendered preview. Reserve inline TSX for non-renderable setup, partial composition, or API details
that would be less clear inside a complete example.

## Site chrome

Every surface shares one top nav, `SiteNav` in `apps/docs/src/components/site-nav.tsx`. It carries
the wordmark, the primary destinations, search, and the appearance controls. The destination list
and its active-route matching live in `apps/docs/src/lib/site-destinations.ts`, so the nav and the
docs layout navigate to the same places. Appearance controls belong to the nav on every surface, not
to the docs sidebar footer.

The docs routes use Fumadocs' notebook layout with `nav.mode: 'top'`, which spans the header across
the full width and starts the sidebar beneath it. `apps/docs/src/lib/layout.shared.tsx` supplies the
nav through the layout's `header` slot as `DocsSiteNav`
(`apps/docs/src/components/docs-site-nav.tsx`), which adds the sidebar triggers. The playground and
the 404 render `SiteNav` directly.

`DocsSiteNav` passes `hasSidebarNavigation`, which hides the bar's destinations below `lg` — the
breakpoint where Fumadocs starts listing them in the sidebar and its mobile drawer instead, so they
never appear twice. It also keeps the bar on one row at exactly `h-14`, which the layout's
`--fd-header-height` is declared to match; changing the bar's height means changing both. Surfaces
with no sidebar keep the destinations at every width, moving them to a second nav row below `md`.

## Playground

The docs site has a live playground at `/playground`: a Monaco editor with TypeScript IntelliSense
for `@luke-ui/react`, a live preview iframe, and code shared through the `#code=` URL hash
(lz-string compressed, plus a `&shape=` param of per-line indent/length pairs so the pre-hydration
loading skeleton can mirror the shared code before any JavaScript loads). Every `<ExampleBlock>`
renders an "Open in playground" button that opens its source pre-loaded.

User code compiles in the browser with sucrase and can import `react` and any `@luke-ui/react/*`
subpath. The import map and editor types are generated by `apps/docs/scripts/`
(`generate-playground-scope.ts`, `generate-playground-types.ts`) into the gitignored
`apps/docs/src/generated/` directory as part of `docs#generate` — new component subpaths in
`@luke-ui/react`'s `exports` map are picked up automatically. The pre-hydration skeleton script
(`editor-skeleton-script.ts`) is compiled into the same directory by `vp pack` (configured under
`pack` in `apps/docs/vite.config.ts`) in the same task.

## API reference

Hosted component guide files contain prose and example blocks. Their sibling `props.mdx` files
contain `<auto-type-table>` API references generated from TypeScript types. Hidden props pages stay
in the docs source collection so direct routes, search, and full-text docs exports can include them.

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
