# Conventions

## TypeScript

Strict mode. Use `import type`. Explicit `.js` extensions for local imports.

## Formatting

Managed by `oxfmt`. Tabs, 2 width, 80 width, single quotes (TS), double quotes (JSX).

## Naming

- **Components**: `PascalCase` (`Button.tsx`)
- **Props**: `PascalCaseProps` (`ButtonProps`)
- **Files**: `kebab-case` (`close-button.tsx`)
- **CSS**: `*.css.ts`
- **Stories**: `*.stories.tsx`

## Testing

Use the smallest test surface that proves the behavior.

- **Unit tests**: pure logic, generators, scripts, docs tooling, package metadata, and non-React utilities. Put these in `src/**/__tests__/**/*.test.ts`.
- **Storybook play tests**: React component behavior that belongs in a real story. For `@luke-ui/react` components, stories are the component tests; do not add separate `*.test.tsx` component tests unless Storybook cannot exercise the behavior cleanly.
- **Storybook visual tests**: public UI states and visual variants worth reviewing for regressions.
- **Browser Vitest tests**: non-component DOM logic that needs real browser APIs and does not fit a story.

## Component Pattern

Wrap `react-aria-components`. Use `composeRenderProps` for styling.

Components follow a three-tier taxonomy (see `CONTEXT.md` for full definitions):

- **Atom** — single conceptual unit used directly by app devs (`Text`, `Link`, `Icon`, `Heading`,
  `Numeral`, `Emoji`, `LoadingSpinner`). Gets a doc page.
- **Composed** — combines atoms/primitives into a ready-to-drop-in pattern (`Button`, `IconButton`,
  `CloseButton`, `TextField`, `ComboboxField`). Gets a doc page.
- **Primitive** — building block for library authors only; documented in package docs but not in
  hosted docs. May be a single file (e.g. `text-input`) or a multi-file kit (e.g. `combobox/*`,
  `field/*`).

## Package paths

Composed components are exported at their bare name (`@luke-ui/react/button`). Primitive kits that
underpin a composed component are exported at `[composed]/primitive`
(`@luke-ui/react/text-field/primitive`, `@luke-ui/react/combobox-field/primitive`,
`@luke-ui/react/field/primitive`). The `button/primitive` path follows the same pattern.

## Testing

Tests colocate with the source file they cover; no `__tests__` directories except for suites that
don't map to a single file (e.g. e2e). Never add DOM shims (happy-dom, jsdom) — DOM-dependent tests
run in a real browser (`*.browser.test.{ts,tsx}`, see `vitest.config.ts`), preferring real APIs over
stubs.

## Exports

Managed by `tsdown` entry globs. Do not hand-edit `package.json#exports`. Create files in paths the
package build already discovers.

## Docs

`.docs.md` structure and section order are defined in
[ADR-0006](adr/0006-docs-md-structure-standard.md). Docs are read by both humans and coding agents —
write for clarity, not just brevity. Don't compress a sentence to the point it's hard to parse, and
don't add content whose only value is illustrating a point from one particular editing session.
`CONTEXT.md` stays a terse index that links to ADRs; if a section there starts restating an ADR's
content in full, that content belongs in the ADR only.

## Fumadocs stories

Each component's interactive demo on the hosted docs site is a single file,
`apps/docs/src/<component>/<component>.story.tsx`, built on `@fumadocs/story/vite/client` (registered
as a Vite plugin in `apps/docs/vite.config.ts`). It defines a narrow `<Component>StoryProps` type —
`Pick<<Component>Props, 'a' | 'b' | ...>` — listing only the props a control can meaningfully show:
drop event handlers, refs, and other escape hatches (`className`, `style`, `onPress`, obscure ARIA
props). `Pick` orders the resulting controls by the order keys are listed in the pick, not by their
declaration order in `<Component>Props` — `@fumadocs/story` reads properties off the resolved type via
`ts-morph`, which preserves the pick's key order — so list the keys in the order they should appear in
the panel. A small `<Component>Playground` wrapper renders the real component inside the shared
`StoryWrapper` (from `../lib/story-wrapper`) and is passed directly to
`defineStory({ Component, args: { initial } })`. A generic component (e.g. `ComboboxField<T>`) fixes
`T` to one concrete sample type in its Playground rather than staying generic — see
`combobox-field.story.tsx`.

Order the picked props to match the `.docs.md` feature-section order, and keep every prop with its own
`##` feature section represented here — when you add a feature section to `.docs.md`, add the prop to
the story's `Pick` in the same pass. `initial` values stay short and legible, same bar as `.docs.md`
code examples — no lorem ipsum.

`.mdx` pages import the story directly — `import { story } from '.../<component>.story'` and
`<story.WithControl />` — there is no separate client file to wire up.
