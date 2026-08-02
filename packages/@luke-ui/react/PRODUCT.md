# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

React developers building UI, with no priority between two audiences: Luke's own current and future
projects, and outside developers who install `@luke-ui/react` in their own production apps.

## Product Purpose

`@luke-ui/react` is a themable, accessible React component library. It gives developers a genuine
choice of abstraction level rather than one fixed API, so they can use ready-made components or drop
down for more control as their needs demand.

## Positioning

The library is layered, and each layer is modeled on a different well-known API precedent instead of
inventing its own conventions:

- **Composed components** (`Button`, `TextField`) follow a HeroUI-style API: opinionated, styled
  components consumers compose together.
- **Primitives** (`button/primitive`, `field/primitive`) follow a React Spectrum-style API:
  lower-level, composable building blocks that primitives and composed components are built from.
- **React Aria Components + recipes** sit beneath that, for consumers who want RAC's behavior with
  this system's styling layer.
- **`react-aria` / `react-stately` hooks** are the floor, for consumers who need full control over
  markup and state.

Behavior and accessibility internals come from React Aria Components and its underlying libraries at
every layer. Styling is a type-safe, statically compiled API built on vanilla-extract. No neighboring
component library (Radix Themes, HeroUI, Spectrum, Polaris) offers this combination: one system,
multiple honest levels of control, each matching a precedent developers already know.

## Operating Context

Installed as an npm package (`pnpm add @luke-ui/react`). Consumers import the shared stylesheet, one
bundled theme stylesheet, and apply the theme-root and theme-identity classes to the same element.
From there they build with atoms and composed components, or drop to primitives, RAC + recipes, or
raw `react-aria`/`react-stately` hooks when they need more control.

Component source doubles as its own test suite: each component directory pairs `index.tsx` with
`*.stories.tsx`, and stories are exercised as tests rather than duplicated into separate test files.
AI agents can also consume the library's documentation directly via `llms.txt` and `llms-full.txt`.

## Capabilities and Constraints

- Pre-1.0. Public API instability is deliberate — do not treat backwards compatibility as a
  constraint yet; change immature contracts when a better design requires it.
- Accessibility must hold at every abstraction layer and across every theme; see Accessibility &
  Inclusion.
- Components are generated with `pnpm generate:component` and are not hand-authored; the generator
  wires group barrels, the styles index, and docs.
- React Compiler is enabled; `useCallback`/`useMemo` are avoided unless the compiler specifically
  cannot handle a case.

## Brand Commitments

No fixed visual identity yet. Themes are expected to look substantially different from one another
by design, not just recolor the same look.

## Evidence on Hand

Two bundled themes, per-component Storybook stories, automated unit/browser/visual checks, and a
hosted docs site with a playground. `llms.txt`/`llms-full.txt` serve the docs to AI agents. Do not
claim external customer adoption without evidence.

## Product Principles

- Give developers a genuine, honest choice of abstraction level — never force a drop to a lower
  layer just to reach a capability the higher layer should expose.
- Model each layer on the API precedent it borrows from (HeroUI-style composed, Spectrum-style
  primitives) rather than drifting into new, unfamiliar conventions.
- Treat accessibility as non-negotiable, independent of theme or abstraction layer.
- Keep the statically-compiled styling API type-safe end to end, with no hand-maintained variant
  types.
- Change immature pre-1.0 contracts when a better design requires it, rather than preserving a
  weaker one for compatibility's sake.

## Accessibility & Inclusion

Every component must remain fully accessible at every abstraction layer and in every theme. This
overrides visual preference when the two conflict — a theme cannot ship a look that breaks
accessible behavior inherited from React Aria Components.
