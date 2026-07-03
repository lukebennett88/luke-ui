# Standard structure for `.docs.md` prose files

Every `src/<component>/<component>.docs.md` file follows the same section shape and order. A reader —
human or agent — can then predict where to find something regardless of which component they're
reading. This extends [ADR-0003](0003-package-docs-surface.md), which established the two-surface
split and the "prose only" rule but not the internal shape of that prose.

We considered leaving the shape as tribal knowledge — copy a sibling file and match its style. We
rejected this because an unwritten convention can't catch drift: `button.docs.md` had no headings at
all while every other component used one `##` per feature, and nothing flagged it.

## Section order

1. **Usage lead-in** — unheaded prose and/or minimal code examples. Do not write an explicit
   `## Usage` heading; `render-page.ts` injects one when assembling the generated package doc, so an
   authored heading would render as a duplicate.
2. **`## Best Practices`** — a two-column `| Guidance | Practices |` table: `Guidance` holds a plain
   `Do` or `Don't`, `Practices` holds the sentence. This isn't a `| Do | Don't |` pairing, which would
   force every row to carry both a positive and a negative example and pad rows when a topic only
   warrants one. Rows aren't paired — list as many `Do`s and `Don't`s as useful, in any order and
   count. No colour/pill styling for now — plain text in the `Guidance` column. Scaffolded by default
   for every new component; delete it only if there's no useful guidance to give.
3. **Feature sections** — one `##` heading per prop or concept (e.g. `## Size`, `## Tone`,
   `## Validation`). Order these by importance to a typical consumer — required or most-frequently-used
   props first, niche/advanced ones last. This is an editorial judgment call, not a mechanical rule:
   do not sort alphabetically and do not default to the order props happen to be declared in the
   TypeScript interface.
4. **`## Accessibility`** — scaffolded by default for every new component. Delete it if the component
   has nothing beyond default semantics to call out (e.g. `text.docs.md` has none because `Text`
   renders plain text with default semantics).
5. **Cross-reference sections, always last** —
   - `## Primitive {Name}` when a composed component has a same-subpath single-component primitive
     counterpart, where `{Name}` is the primitive's own exported name (e.g. `## Primitive Button` in
     `button.docs.md`, pointing at `button/primitive`; `## Primitive TextInput` in `text-field.docs.md`,
     since `text-field/primitive` exports `TextInput`, not `TextField`).
   - `## Primitive kit` when the same-subpath primitive is a multi-export kit rather than a single
     component (e.g. `combobox-field/primitive`, which exports `ComboboxInput`, `ComboboxControl`, and
     others).
   - `## When to use vs {Name}` when a component is easily confused with a sibling composed component
     (e.g. `## When to use vs Button` in `icon-button.docs.md`).

This order and the heading names apply to every component doc in the package — atoms, composed
components, and any component or utility documented under the same subpath export.

## Docs are authored in the package, not in `apps/docs`

All prose content is authored in `packages/@luke-ui/react/src/<component>/<component>.docs.md`,
co-located with the component's source. `apps/docs` MDX files (e.g.
`apps/docs/content/docs/components/actions/button.mdx`) never contain hand-authored prose — they are
wiring only: frontmatter (`title`/`description`), an interactive `<story.WithControl />` demo,
and an `<include>` of the generated package doc. This was already true in practice; this ADR makes it
an explicit rule so it doesn't regress.

## Consequences

- The component-creation generator (`packages/turbo-generators/src/component-creation-plan.ts`,
  `renderPackageDocs()`) scaffolds `## Best Practices` and `## Accessibility` placeholders for every
  new component, and no longer writes an explicit `## Usage` heading — `render-page.ts` already injects
  one, so the old scaffold produced a duplicate.
- Placeholder/unfinished content in `.docs.md` must be plain visible text (e.g. italicized), never an
  HTML comment (`<!-- -->`). This content gets included in Fumadocs MDX pages. MDX doesn't support HTML
  comments, only `{/* ... */}` JS-style ones, and those would render as literal text on the
  plain-markdown surface (npm/agents). A visible placeholder works on both surfaces, and it's the safer
  failure mode too: a hidden comment left behind by accident renders an empty section with no trace,
  where a visible one is easy to spot.
- This standard applies to atom and composed components, the only tiers with a `.docs.md` file.
  Primitives (e.g. `button/primitive`) have no `.docs.md` and no `## Usage` heading at all, per
  ADR-0003.
- This ADR doesn't retroactively rewrite existing components other than Button; auditing them against
  this standard is separate follow-up work.
