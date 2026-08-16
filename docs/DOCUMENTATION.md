# Documentation

This is the only normative documentation guide for the repository. It covers MDX pages in the hosted
docs app, JSDoc, code comments, READMEs, and the internal guides in `docs/`. Package-level
`AGENTS.md` files must not restate these rules. Point here instead.

## Surfaces

Luke UI has two documentation audiences, and they need different content:

| Surface                  | Lives in                                  | Reader                            | Purpose                           |
| ------------------------ | ----------------------------------------- | --------------------------------- | --------------------------------- |
| Public documentation     | Hosted MDX, public JSDoc, package READMEs | A developer building with Luke UI | How to use Luke UI                |
| Internal repository docs | `docs/*.md`                               | A contributor maintaining Luke UI | How to build and maintain Luke UI |

Both surfaces follow the shared editorial rules in this guide: a clear purpose for the intended
reader, enough context, no redundancy, no session-history prose, and no detail that does not help
that reader. They differ in scope. Public docs explain observable behaviour and usage. Internal docs
deliberately explain architecture, recipes, generators, and implementation.

## What documentation is for

A section of documentation should help its reader answer at least one of these questions:

- What is this?
- When would I use it?
- How do I use it?
- How do I choose between the available options?
- What mistake does this guidance prevent?

This is an editorial test, not a page template. Do not add a heading per question. Content that
answers none of them probably does not belong.

Documentation can follow every rule in this guide and still be poor documentation. Prose that is
verbose, redundant, or obvious fails its reader even when the wording is correct.

## Public documentation scope

Public documentation helps a developer build an interface with Luke UI. Document how developers use
Luke UI, including the observable behaviour they rely on. Do not document how Luke UI is
implemented.

### Implementation detail

Include an implementation detail only when it changes what a developer writes or chooses. Before you
keep one, name the decision, constraint, or observable behaviour it explains. When you cannot name
one, cut it.

Keep the detail that changes the reader's code:

- `Button` sizes a nested `Icon`, so an icon needs no `size` prop.
- A field component takes no plain `ref`, so `inputRef` is the only way to reach the control.
- Hover and pressed colours are derived from the resting semantic colour internally, with no public
  token or function for it, so a custom control authors its own hover and pressed feedback instead
  of picking a different semantic background token per state.

Cut the detail that only explains the mechanism:

- `Icon` renders an `<svg>` that references a symbol in the generated spritesheet.
- Which internal modules a component imports.

### Other technologies

Document the Luke UI part. Do not document React, React Aria, CSS, TypeScript, or a form library in
general, because their own documentation owns that. Link upstream when the reader needs it, and
write link text that says where it goes.

Describe upstream behaviour only when Luke UI changes it, constrains it, or a developer must
configure it to use Luke UI. Setting `validationBehavior="aria"` to hand validation to a form
library qualifies. The React Aria validation model in general does not.

### The supported path

Document the ordinary, supported way to use a component. Do not catalogue usage that is unsupported,
obscure, or merely technically possible. Options crowd out the path most readers need, and a
documented obscure path becomes a support obligation.

Do not write "you can do this, but it is not recommended". Either recommend it or leave it out.

### Internal distinctions

Expose an internal architectural distinction only when it reaches the public API or a developer's
choice. Primitives do, because they use `@luke-ui/react/primitives/*` entrypoints when the normal
component API does not fit. See [COMPONENTS.md](COMPONENTS.md).

Do not document an export that is not public API.

## Internal documentation scope

Internal guides such as [COMPONENTS.md](COMPONENTS.md), [STYLING.md](STYLING.md), and
[TESTING.md](TESTING.md) explain how contributors build and maintain Luke UI. They may document
architecture, cascade layers, recipes, generators, and implementation. The public "do not document
implementation" rule does not apply to them.

They still need a clear purpose for a maintainer, enough context to act, no redundancy, and no prose
that only explains one editing session. Cut an implementation detail that does not help a
contributor do the work the guide is for.

## Writing style

These rules cover public MDX, JSDoc, code comments, and package READMEs. Internal guides in `docs/`
follow the shared editorial rules under Surfaces. They are not bound to the terminology table or
punctuation rules below.

Write short, plain sentences. Split a sentence that carries two ideas rather than trimming the words
that carry meaning.

- Write one instruction per sentence. Write an instruction as a command: "Pass a title", not "A
  title should be passed".
- Break a paragraph when it changes subject.
- Use active voice and name the actor. Passive voice is fine when Luke UI is the actor and naming it
  adds nothing, as in "The spinner is hidden from assistive technology".
- Write in the present tense. Use another tense only when the timing is the point.
- Keep articles. Do not drop "the" or "a" to shorten a sentence.
- Do not open a sentence with a participial phrase that hides the actor. A gerund is fine in a
  heading or a title, as in "Choosing a scale".
- Break up a stack of nouns when the relationship between them is unclear. Add a preposition.
- Write positively. Avoid a double negative, such as "not uncommon".
- State what a thing does. Do not write "can be used to", "allows you to", or "enables you to".
- Use "you can" only to grant permission or present a real choice. When the reader should do
  something, tell them to do it.
- Address the reader as "you". Never write "we", "us", "let's", or "I".
- Cut empty promotional filler: "simply", "just", "note that", "it is important to", and adjectives
  used only for praise, such as "powerful", "flexible", "seamless", or "robust". Keep a word when it
  names a real property. "Flexible" is fine when the point is that a value accepts more than one
  shape.

**One term per concept.** Do not use different words for the same concept. Use the same word every
time.

| Term                   | Definition                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `someone`              | The person who uses an interface built with Luke UI. Never write "a person", "people", "users", or "the user".                                   |
| `developer`            | The reader of public documentation.                                                                                                              |
| `assistive technology` | A singular, uncountable term. Never write "assistive technologies". Write "screen reader" only when the behaviour is specific to screen readers. |
| `control`              | An interactive element.                                                                                                                          |
| `field`                | A label, control, description, and validation message together.                                                                                  |
| `set`                  | Use `set` for a boolean prop.                                                                                                                    |
| `pass`                 | Use `pass` for a value or node prop.                                                                                                             |
| `choose`               | Use `choose` when someone picks from options.                                                                                                    |
| `select`               | Use `select` only for a control's selection state.                                                                                               |

**Spelling and punctuation.** Spell words in Australian English. Write headings in sentence case,
and capitalise only proper nouns and product names. Do not use a semicolon in prose. An em dash is
fine when it has a space on each side, as in `foo — bar`. Do not write `foo—bar`. The em dash inside
an `<ExampleBlock title>` already follows that form: `<page or component> — <qualifier>`.

**Say it once.** Cut a sentence whose only content restates its heading, a prop name, or the example
below it. Do not summarise a section at the end of it. When more than one page needs the same rule,
explain it on the page that owns the topic and link to it from the others.

## Comments and JSDoc

JSDoc on a public type is published documentation. The generated Props pages render it, so the
public documentation rules above apply to it. JSDoc and TypeScript types drive the docs app.

When adding or changing a component:

- Write function-level JSDoc on the exported component that describes it for a developer.
- Document every public prop. Include `@default` when the component destructures a default value.
- Keep a straightforward prop description to one concise sentence. Add explanation when a
  constraint, choice, caveat, or non-obvious behaviour affects how the prop is used. Do not optimise
  JSDoc for line count.
- Do not restate the prop name. `endIcon` needs "Icon shown after the label", not "The end icon".
- On components, redeclare important inherited `react-aria-components` props with useful JSDoc,
  using the passthrough pattern such as `isDisabled?: RacButtonProps['isDisabled']`. Redeclare only
  the props a developer is likely to reach for. Point a long-tail inherited prop at the upstream
  React Aria component through the page's `reactAria` frontmatter link.

A code comment explains the code, not its history. Luke UI is pre-1.0, so no comment carries a prior
state.

- Do not write "previously", "used to", "no longer", "an earlier pass", or "the old X".
- Do not use an issue number to narrate why a change happened.
- Do not name another design system to justify a decision. A design system may appear as test
  reference data, as `theme/__fixtures__/radix-scales.ts` does.
- Do not narrate what the next line does.
- Keep an explanation that justifies a rule a reader would otherwise undo. When unsure, shorten the
  explanation rather than delete it.

## Examples

An example carries more of the explanation than the prose around it, because most readers look for
the code first.

### What to show

- Show one realistic thing a developer might write. Use values such as "Save changes" and
  "you@example.com", never `foo`, `bar`, or lorem ipsum.
- Let the example make the behaviour obvious. A reader should see what the section describes without
  hunting for it.
- Keep the example as small as it can be without becoming artificial.
- Choose one approach and show it. Do not present several interchangeable ways to reach the same
  result.
- Do not demonstrate every value a prop accepts. Show the values a reader chooses between, and leave
  the full list to the Props page.
- Do not label example UI with prop names. A checkbox labelled "Invalid" documents the API. Label it
  "Email me a receipt" instead.

Exhaustive variant and state coverage belongs in the visual test kitchen sink, not in a docs
example. See [TESTING.md](TESTING.md).

A reference page is the exception. A token, typography, or icon page enumerates on purpose, because
the enumeration is the content.

### Prose around an example

Explain what the reader should notice when the example does not already make it obvious. Put what a
reader needs before the example, not after it.

Do not add a lead-in for its own sake. "The following example shows a button with an icon" adds
nothing beside a titled, rendered example.

### Example files

Interactive examples live in `apps/docs/src/examples/<component>/`. An example module
default-exports an anonymous arrow function, `export default () => {...}`. The module path
identifies the component and variation, so the rendered source repeats no function name.

Reference an example from an MDX page with `<ExampleBlock src="<component>/<name>" title="..." />`.
Title it `<page or component> — <qualifier>`, for example `Button — Icons`.

Every component guide opens with a focused `basic.tsx` example as its primary `ExampleBlock`, which
the generator scaffolds and `component-doc-contract` enforces. An example that no page references
and no other example imports fails `example-reachability`.

Prefer a typechecked `ExampleBlock` over an inline TSX fence whenever the code benefits from a
rendered preview. Reserve an inline fence for non-renderable setup, partial composition, or an API
detail that is clearer outside a complete example.

Samples that cannot render live in `apps/docs/src/samples/` and appear through
`<SourceCodeBlock src="<path>" />`, which shows source with no preview. Use it for installation,
provider setup, and configuration.

Keep an example aligned with the section that references it. When you add a feature section, add or
update its example in the same change.

## Instructions

### Choose for the reader

When a task has several valid approaches, the reader still needs only one.

1. State the requirement, goal, or criterion that decides the choice.
2. Choose one approach and show it.
3. Mention an alternative only when the reader has to pick between them.

"Apply `rootClassName` to an element you own that contains the Luke UI interface. This example uses
the application shell" beats "You can apply `rootClassName` to `<html>`, `<body>`, or a layout
wrapper".

### Move forwards

Instructions run in one direction. A reader on step four should never have to replay step two.

- Put a prerequisite before the step that needs it.
- Do not annotate a finished step with what the reader could have done instead.
- Write the steps a reader follows, not a narrative walkthrough of what you did.
- Give a guide one outcome. Split a guide that teaches two unrelated goals.

## Review

Review the page, not the sentences. New content anchors a reviewer to the words in front of them.
The problem is more often the shape of the page. Use this checklist for public documentation. For an
internal guide, ask the same questions with a maintainer as the reader.

Read the whole page, then ask:

- Does this belong on this page, in this section?
- Does another page already say it? Link instead of repeating.
- Can someone scanning headings and examples find the important information?
- Does each section earn its place? Could anything go without losing information?
- Is the page helping with usage and decisions, or describing implementation that does not affect
  them?
- Are the examples realistic and focused?
- Do the instructions move forwards?
- Is prose repeating what a heading, prop name, or example already says?
- Has comprehensiveness made the page worse?
- Is context missing because the author already knew the system?

The last question pulls against the others, and it is the one an author is least likely to catch.
Cutting applies to words and phrases, not to ideas and context. Adding the missing step often makes
a page feel shorter.

## Where documentation lives

The hosted docs app in `apps/docs` is the primary docs surface for developers. Authored guides live
under `apps/docs/content/docs/docs/`, at `/docs/<slug>`. Component guides live under
`apps/docs/content/docs/components/`, at `/components/<group>/<name>`. Walking that tree, parsing
frontmatter, extracting `<ExampleBlock>` `src` values, and mapping page URLs to files each have one
owner in `apps/docs/src/lib/` (`docs-mdx-files.ts`, `docs-frontmatter.ts`,
`example-block-sources.ts`, `markdown-page-path.ts`).

Do not add generated package docs or `*.docs.md` files under `packages/@luke-ui/react/src/`.

The package README links to the hosted docs. Fumadocs provides:

- `/llms.txt` for the component index.
- `/llms-full.txt` for full docs.
- Per-page Markdown by appending `.md` to a docs URL, for example `/docs/installation.md` or
  `/components/actions/button.md`.

## Component docs

Components get hosted docs pages in the primary component navigation.

The components landing page at `/components` lists every component guide, grouped by category. The
list is generated from the guides themselves. `scripts/generate-components-index.ts` reads each
guide's frontmatter and emits `src/generated/components-index.generated.ts`. The docs app renders
that file through `src/components/components-index.tsx`. A new component appears on the landing page
with no further edit. `components-index-generator.test.ts` fails when the generated file drifts from
the guides on disk.

Primitives are public API. Document every primitive export path in hosted docs. Primitive pages live
in the "Primitives" section under components.

Component pages may link to their related primitive pages when the normal component API does not
fit. Keep primitive pages at the end of the Components area.

## MDX page structure

`<group>/<name>.mdx` is the authored component guide. It keeps the `/components/<group>/<name>` URL.

`<group>/<name>/props.mdx` and `<group>/<name>/meta.json` are generated from the guide's `props`
frontmatter by `scripts/generate-props-pages.ts`. `props.mdx` is the API reference at
`/components/<group>/<name>/props`. `meta.json` uses `"pages": ["!props"]` and
`"collapsible": false` so the component stays one ordinary sidebar link. It sets
`"pagesIndex": "../<name>"` so the folder's sidebar entry points to the sibling guide. The shared
docs route remaps a Props pathname to its Guide URL for Fumadocs' sidebar tree matching, so Guide
and Props share the Components sidebar.

Keep the guide and Props frontmatter titles and descriptions identical. The component generator
leaves editorial descriptions out instead of adding placeholder copy. Add one useful description to
both pages when you write the guide.

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

Add only the sections that help a developer use the component. The generated guide ships with the
primary example and no placeholder prose, and `component-doc-contract` fails on a leftover
placeholder.

Keep cross-reference sections near the end. Put only the `## Props` section and its
`<auto-type-table>` content on `props.mdx`.

## API reference

Hosted component guide files contain prose and example blocks. Their generated `props.mdx` files
contain `<auto-type-table>` API references generated from TypeScript types. Hidden props pages stay
in the docs source collection so direct routes, search, and full-text docs exports can include them.

The prose on a Props page comes from JSDoc in the component's source, so the prop is documented
where it is declared.

## Site chrome

Every surface shares one top nav, `SiteNav` in `apps/docs/src/components/site-nav.tsx`. It carries
the wordmark, the primary destinations, search, and the appearance controls. The wordmark links to
`/`, the landing page. Docs opens `/docs/installation`. Components opens `/components`. The
destination list and its active-route matching live in `apps/docs/src/lib/site-destinations.ts`, so
the nav and the docs layout navigate to the same places. Appearance controls belong to the nav on
every surface, not to the docs sidebar footer.

The landing page at `/` renders `SiteNav` with no docs sidebar. It has no active destination.

The docs routes use Fumadocs' notebook layout with `nav.mode: 'top'`, which spans the header across
the full width and starts the sidebar beneath it. `apps/docs/src/lib/layout.shared.tsx` supplies the
nav through the layout's `header` slot as `DocsSiteNav`
(`apps/docs/src/components/docs-site-nav.tsx`), which adds the sidebar triggers. The playground and
the 404 render `SiteNav` directly.

`DocsSiteNav` passes `hasSidebarNavigation`, which hides the bar's destinations below `lg`. That is
the breakpoint where Fumadocs starts listing them in the sidebar and its mobile drawer instead, so
they never appear twice. It also keeps the bar on one row at exactly `h-14`, which the layout's
`--fd-header-height` is declared to match, so changing the bar's height means changing both.
Surfaces with no sidebar keep the destinations at every width, moving them to a second nav row below
`md`.

## Playground

The docs site has a live playground at `/playground`: a Monaco editor with TypeScript IntelliSense
for `@luke-ui/react`, a live preview iframe, and code shared through the `#code=` URL hash
(lz-string compressed, plus a `&shape=` param of per-line indent/length pairs so the pre-hydration
loading skeleton can mirror the shared code before any JavaScript loads). `<ExampleBlock>` renders
an "Open in playground" button when the example's imports are all in the playground runtime
specifier list (`playground-runtime-specifiers.ts`). The button opens that source pre-loaded.
Examples that import a relative module, or anything else the preview cannot `require`, omit the
button.

User code compiles in the browser with sucrase and can import `react` and any `@luke-ui/react/*`
subpath. The import map and editor types are generated by `apps/docs/scripts/`
(`generate-playground-scope.ts`, `generate-playground-types.ts`) into the gitignored
`apps/docs/src/generated/` directory as part of `docs#generate`, so new component subpaths in
`@luke-ui/react`'s `exports` map are picked up automatically. The pre-hydration skeleton script
(`editor-skeleton-script.ts`) is compiled into the same directory by `vp pack` (configured under
`pack` in `apps/docs/vite.config.ts`) in the same task. The preview iframe only accepts messages
from its parent. Readiness and replay live in `playground-handshake.ts`; compilation, the URL hash,
and debounce stay in the route and runner.

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
