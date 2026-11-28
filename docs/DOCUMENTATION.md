# Documentation

This guide owns the rules for hosted MDX, JSDoc, code comments, READMEs, and `docs/`. A skill or
`AGENTS.md` may name a guide's rule in one line that links to the owning section, without restating
or weakening it. When a skill and a guide disagree, the guide wins.

## Authoring checklist

- Follow
  [`apps/docs/content/docs/components/actions/button.mdx`](../apps/docs/content/docs/components/actions/button.mdx)
  as the exemplar for a component guide.
- Run `pnpm run check` from the repo root. It includes `check:docs`.
- Keep docs and skills current in the same change as the code. See
  [Keeping docs current](#keeping-docs-current).
- Do not hand-edit generated output. See [Where documentation lives](#where-documentation-lives).
- Schema-owned files such as `apps/docs/PRODUCT.md` keep the headings their schema requires. Edit
  only the body.

`check:docs` enforces heading order, navigation, the API contract, and the regex prose rules in
`apps/docs/src/lib/docs-prose-rules.ts`, across hosted MDX and `docs/*.md`. A rule that needs
judgement stays editorial guidance here. One example is whether a third-person reference means
someone using an interface, which is correct, or the reader, which is not.

## Surfaces

| Surface                  | Lives in                                  | Reader                            | Purpose                           |
| ------------------------ | ----------------------------------------- | --------------------------------- | --------------------------------- |
| Public documentation     | Hosted MDX, public JSDoc, package READMEs | A developer building with Luke UI | How to use Luke UI                |
| Internal repository docs | `docs/*.md`                               | A contributor maintaining Luke UI | How to build and maintain Luke UI |

Both surfaces follow every editorial rule here and differ only in scope. Public docs explain
observable behaviour and usage. Internal docs may explain architecture, cascade layers, recipes,
generators, and implementation. On either surface, cut a detail that does not help its reader do the
work the page is for.

## Public documentation scope

Document how developers use Luke UI, including the observable behaviour they rely on. Do not
document how Luke UI is implemented.

### Implementation detail

Keep an implementation detail only when you can name the decision, constraint, or observable
behaviour it explains. Otherwise cut it.

- Keep: `Button` sizes a nested `Icon`, so an icon needs no `size` prop.
- Keep: when a field component exposes both `ref` and `inputRef`, `ref` reaches the root and
  `inputRef` reaches the input.
- Cut: `Icon` renders a `<span>` that the stylesheet paints with a CSS mask.
- Cut: which internal modules a component imports.

### Other technologies

Document the Luke UI part. For React, React Aria, CSS, TypeScript, or a form library in general,
link upstream with link text that says where it goes. Describe upstream behaviour only when Luke UI
changes or constrains it, or a developer must configure it to use Luke UI. Setting
`validationBehavior="aria"` to hand validation to a form library qualifies. The React Aria
validation model in general does not.

### The supported path

Document the ordinary, supported way to use a component. Leave out unsupported, obscure, or merely
possible usage, which crowds out the main path and becomes a support obligation. Recommend an
approach or leave it out, never "you can do this, but it is not recommended".

### Internal distinctions

Expose an internal architectural distinction only when it reaches the public API or a developer's
choice. Primitives do, because they use `@luke-ui/react/primitives/*` entrypoints when the normal
component API does not fit. See [COMPONENTS.md](COMPONENTS.md).

Document only public API exports, on every page including the home page. Show the public tokens a
theme produces, not the private 12-step colour scales behind them.

## Writing style

These rules apply to every surface.

- Write an instruction as a command: "Pass a title", not "A title should be passed".
- Keep articles. Do not drop "the" or "a" to shorten a sentence.
- Address the reader as "you". State what a thing does, not a capability the reader is granted. Use
  "you can" only to grant permission or present a real choice.
- Cut filler such as `simply` and `note that`, first-person `we`, `us`, and `let's`, and adjectives
  used only for praise.

**One term per concept.** `check:docs` rejects `users`, `the user`, `a person`, and `people` in
favour of `developer` and `someone`, and the plural of `assistive technology`. The rest of the table
is editorial.

| Term                   | Definition                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| `someone`              | Who uses an interface built with Luke UI.                                                          |
| `developer`            | Who reads public documentation.                                                                    |
| `assistive technology` | A singular, uncountable term. Write "screen reader" only for behaviour specific to screen readers. |
| `control`              | An interactive element.                                                                            |
| `field`                | A label, control, description, and validation message together.                                    |
| `set`                  | Use `set` for a boolean prop.                                                                      |
| `pass`                 | Use `pass` for a value or node prop.                                                               |
| `choose`               | Use `choose` when someone picks from options.                                                      |
| `select`               | Use `select` only for a control's selection state.                                                 |

**Spelling and punctuation.** Spell words in Australian English. Write headings in sentence case,
capitalising only proper nouns and product names. Split a sentence rather than joining two ideas
with a semicolon. Give an em dash a space on each side, as in `foo — bar`. An `<ExampleBlock title>`
uses a colon instead, in the form `<page or component>: <qualifier>`.

**Say it once.** Cut a sentence that only restates its heading, a prop name, or the example below
it, and any closing summary. Explain a shared rule on the page that owns the topic and link to it
from the others. An example appears on exactly one page, which `check:docs` enforces.

## Comments and JSDoc

JSDoc on a public type is published documentation. A guide's `## API` section renders it, so the
public documentation rules apply. When adding or changing a component:

- Write function-level JSDoc on the exported component that describes it for a developer.
- Document every public prop. Include `@default` when the component destructures a default value.
- Keep a straightforward prop description to one sentence. Add explanation when a constraint,
  choice, caveat, or non-obvious behaviour affects how the prop is used. Do not optimise JSDoc for
  line count.
- Do not restate the prop name. `endContent` needs "Non-interactive adornment shown after the
  label", not "The end content".
- Redeclare the inherited `react-aria-components` props a developer is likely to reach for, with
  useful JSDoc, using the passthrough pattern such as `isDisabled?: RacButtonProps['isDisabled']`.
  Point a long-tail inherited prop at the upstream React Aria component through the page's
  `reactAria` frontmatter link.

A code comment explains the code, not its history. Luke UI is pre-1.0, so no comment carries a prior
state.

- Do not write "previously", "used to", "no longer", "an earlier pass", or "the old X". Do not use
  an issue number to narrate why a change happened.
- Do not name another design system to justify a decision. A design system may appear as test
  reference data, as `theme/__fixtures__/radix-scales.ts` does.
- Do not narrate what the next line does.
- Keep an explanation that justifies a rule a reader would otherwise undo. When unsure, shorten it
  rather than delete it.

## Examples

Readers look for the code first, so an example carries most of the explanation.

### What to show

- Keep an example as small as it can be without becoming artificial, and make the described
  behaviour obvious.
- Use neutral or self-referential copy, such as "Example checkbox", when content exists only so the
  component renders. Use application content only when its meaning explains the behaviour. "Save
  changes" can clarify a button action. An account or workspace does not clarify a checkbox state.
  Do not invent accounts, workspaces, billing details, characters, or scenarios to fill an example.
  For extended text, choose a subject that explains why the component contains that structure.
- Do not use API terms as labels for interactive controls.
- In a comparison, put a specimen label such as "Small" in a caption beside the control, not in the
  control's own label. Use `Comparison` and `ComparisonItem` from `#docs` when repeated caption and
  layout markup would hide the component JSX. Keep each component and its prop values visible.
- Show one approach, not several interchangeable ones.
- To compare one prop, show all its values and give every other prop the same value. Combine two
  props only to show a combination that changes the result. Do not show combinations for coverage.
  The `## API` table lists every prop and value. A reference page about a scale or catalogue can
  show all of it.

### Example layout

Use layout primitives for structure, not one-off wrappers.

- `Stack` for vertical columns. Set `gap` on the stack instead of margin on children.
- `Cluster` for inline groups that wrap, such as button rows. To keep a control's intrinsic inline
  size inside a stretching `Stack`, wrap it in `Cluster` instead of stretching it.
- `Container` only when the example is about max width or container queries, not as a generic
  narrow-form wrapper.
- `Box` for grid, a flex direction other than a column, or visual chrome such as padding and
  borders. Do not add an empty `Box` just to group children.
- `ExampleItem` from `#docs` for placeholder children in a layout example, so each child's box is
  visible.
- No `inlineSize="100%"` to fill the preview. A block-level example root already fills it.

### Prose around an example

Put what the reader needs before the example. Explain what to notice only when the example does not
make it obvious. Skip lead-ins such as "The following example shows a button with an icon".

### Example files

Interactive examples live in `apps/docs/src/examples/<component>/` and default-export an anonymous
arrow function, `export default () => {...}`, so the rendered source repeats no function name.
Reference one with `<ExampleBlock src="<component>/<name>" title="Button: Icons" />`. Add or update
a section's example in the same change as the section.

- **Width.** Use `previewWidth="narrow"` when a narrow width is incidental. It is docs-only, and the
  Playground uses the available width. When the width is part of the example, such as a complete
  form, set it in the source, for example `style={{ maxInlineSize: '20rem' }}`.
- **Layout.** A block-level example fills the preview width. Pass `layout="centered"` for an
  intrinsically sized example, such as a button or an icon. Pass `layout="full-bleed"` when the
  example paints its own surface and needs no preview padding.

Every component guide opens with a focused `basic.tsx` as its primary `ExampleBlock`, which the
generator scaffolds and `component-doc-contract` enforces. An example that no page references and no
other example imports fails `example-reachability`.

Prefer a typechecked `ExampleBlock` over an inline TSX fence when a rendered preview helps. Reserve
an inline fence for non-renderable setup, partial composition, or an API detail that is clearer
outside a complete example. Samples that cannot render, such as installation, provider setup, and
configuration, live in `apps/docs/src/samples/` and appear through
`<SourceCodeBlock src="<path>" />`, which shows source with no preview.

## Instructions

- **Choose for the reader.** When a task has several valid approaches, state the criterion that
  decides it and show one approach. Mention an alternative only when the reader has to pick. "Set
  the theme's identity class on `<html>` in the root layout" beats "You can set the identity class
  in `index.html`, the root layout, or a script".
- **Move forwards.** Put a prerequisite before the step that needs it. Do not annotate a finished
  step with what the reader could have done instead.
- Write the steps a reader follows, not a narrative of what you did.
- Give a guide one outcome. Split a guide that teaches two unrelated goals.

## Review

Review the page, not the sentences, because the problem is more often the page's shape. For an
internal guide, ask these questions with a maintainer as the reader. Read the whole page, then ask:

- Does this belong on this page, in this section? Does another page already say it?
- Can someone scanning headings and examples find the important information?
- Could any section go without losing information?
- Does the page help with usage and decisions, or describe implementation that does not affect them?
- Are the examples realistic and focused? Do the instructions move forwards?
- Does prose repeat what a heading, prop name, or example already says?
- Has comprehensiveness made the page worse?
- Is context missing because the author already knew the system?

The last question pulls against the others, and an author is least likely to catch it. Cut words and
phrases, not ideas and context. Adding the missing step often makes a page feel shorter.

## Where documentation lives

The hosted docs app in `apps/docs` is the primary docs surface. Authored guides live under
`apps/docs/content/docs/docs/`, at `/docs/<slug>`. Component guides live under
`apps/docs/content/docs/components/`, at `/components/<group>/<name>`.

The docs `generate` script in `apps/docs/package.json` writes generated files. Do not hand-edit
them. Walking the page tree, parsing frontmatter, extracting `<ExampleBlock>` `src` values, and
mapping page URLs to files each have one owner in `apps/docs/src/lib/`. Do not add generated package
docs or `*.docs.md` files under `packages/@luke-ui/react/src/`. The
[docs app README](../apps/docs/README.md) covers the app's architecture.

## Component docs

The `/components` landing page lists every component guide by category. `generate` builds it from
the guides, so a new guide appears with no further edit.

Primitives are public API. Document every primitive export path in the "Primitives" section, which
stays at the end of the Components area. A component page may link to its primitive pages for when
the normal component API does not fit.

`apps/docs/content/docs/components/meta.json` sets component category and order. Each category
`meta.json` mirrors its slice. A guide's `source` names the `packages/@luke-ui/react/src/exports/`
module for a public entry point. `check:docs` enforces all of this.

## MDX page structure

`<group>/<name>.mdx` is the component's only hosted page, at `/components/<group>/<name>`. There is
no separate Props route. Order a component guide as follows, and follow
[`button.mdx`](../apps/docs/content/docs/components/actions/button.mdx) when heading names or order
are unclear.

1. Frontmatter.
2. Short usage lead-in.
3. Primary example.
4. `## Best practices`, when the component needs explicit guidance.
5. Feature sections, ordered by importance to a consumer. Primitive guides may include `## Anatomy`.
6. `## Accessibility`. Required for actions, forms, and feedback. Optional elsewhere.
7. `## API`, the last section on every guide that declares `source:`.

Feature section headings are free. Link to another component or primitive inline where it is
relevant, not in a dedicated section. Add only sections that help a developer use the component.
`check:docs` fails on leftover scaffold placeholders.

Authored guides under `/docs` are free-form apart from a closing `## Continue learning` section that
contains `<Cards>`. Component guides do not use it.

## API reference

Write the `## API` section by hand. Add a `<component-props-table path="…" name="…" />` tag for each
exported prop type, where `path` is the repo-relative file that exports it and `name` is the type
name, for example `ButtonProps`. `remarkAutoTypeTable` expands it at MDX compile time, and `vp dev`
refreshes it when the documented file or its relative imports change. With several tables, add a
`### <TypeName>` heading above each. `check:docs` enforces the section's position and tag placement.

The table's prose comes from JSDoc where each prop is declared. The generator adds the notice that a
type accepts arbitrary DOM and ARIA attributes and event handlers, and the `#### Type definitions`
list in the page's Markdown. Do not write either by hand.

## Keeping docs current

Comments, JSDoc, hosted MDX, READMEs, `docs/`, and `.agents/skills/` keep no stale path, command,
script, export, type, snippet, or cross-reference.

- Update or delete docs and skills that describe code in the same change as the code.
- When you move, rename, or remove a file, script, command, export, or symbol, search docs for old
  references.
- When you rename or remove a heading in `docs/`, search `.agents/skills/` for links to it.
- Prefer generated or source-owned content over hand-maintained lists that mirror code.
- Reference stable paths, commands, and headings. Do not pin docs to line numbers, generated class
  names, or exact command output.
- Do not add content that only explains one editing session.
