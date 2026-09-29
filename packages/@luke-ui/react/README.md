# @luke-ui/react

Luke UI is a React design system built on `react-aria-components` and Vanilla Extract. Consumers
import the shipped CSS and do not need the Vanilla Extract compiler.

## Install

```sh
pnpm add @luke-ui/react react-aria-components
```

Luke UI expects the application to provide a compatible shared `react-aria-components` instance.

## Setup

Import the component stylesheet and one bundled theme stylesheet. The shared stylesheet applies the
reset document-wide and base typography on `body`. Importing a theme stylesheet themes the document
from `:root`, so no identity class is needed for a single theme.

The shared stylesheet uses the layer order `reset → base → recipes → utilities`. The `base` layer is
reserved for application defaults such as Tailwind Preflight. Luke UI declares it empty so it stays
below `recipes`.

```tsx
import '@luke-ui/react/stylesheet.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';

export function App() {
	return <main>{/* your app */}</main>;
}
```

Loading more than one theme stylesheet in the same document needs an explicit identity class so one
theme wins. Import it from that theme's own entrypoint, for example
`@luke-ui/react/themes/tactile`'s `themeClassName`.

## Components and docs

Component documentation, interactive examples, and API reference live in this repo under
`apps/docs/content/docs`.

Start with the normal component API. Use primitives from `@luke-ui/react/primitives/*` when you need
a custom composition the component API does not cover. Import a colocated recipe such as
`buttonRecipe` from the same component entrypoint when you own the element and need that visual
treatment. There is no `@luke-ui/react/recipes` barrel.

## License

MIT
