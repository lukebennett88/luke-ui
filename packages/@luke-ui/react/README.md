# @luke-ui/react

Luke UI is a React design system built on `react-aria-components` and `vanilla-extract`.

## Install

```sh
pnpm add @luke-ui/react react-aria-components
```

Luke UI expects the application to provide a compatible shared `react-aria-components` instance.

## Setup

Import the component stylesheet and one bundled theme stylesheet. Importing a theme stylesheet
themes the whole document from `:root`, so no identity class is needed for a single theme. Apply
`rootClassName` to an element you own for the reset and base typography.

The shared stylesheet owns reset, theme-root, StyleX component styles, structural rules, and utility
rules in `reset`, `theme`, `luke.sx.priorityN`, `structural`, `utilities` order.

```tsx
import '@luke-ui/react/stylesheet.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { rootClassName } from '@luke-ui/react/theme';

export function App() {
	return <div className={rootClassName}>{/* your app */}</div>;
}
```

Loading more than one theme stylesheet in the same document needs an explicit identity class so one
theme wins. Import it from that theme's own entrypoint, for example
`@luke-ui/react/themes/tactile`'s `themeClassName`.

## Components and docs

Full component documentation, interactive examples, and API reference are at
[lukebennett88.github.io/luke-ui](https://lukebennett88.github.io/luke-ui).

AI agents can fetch documentation at:

- [llms.txt](https://lukebennett88.github.io/luke-ui/llms.txt): component index.
- [llms-full.txt](https://lukebennett88.github.io/luke-ui/llms-full.txt): full docs.
- Any docs URL with `.md` appended: per-page Markdown.

Start with the normal component API. Use primitives from `@luke-ui/react/primitives/*` when you need
a custom composition the component API does not cover. Import a colocated recipe such as
`buttonRecipe` from the same component entrypoint when you own the element and need that visual
treatment. There is no `@luke-ui/react/recipes` barrel.

## License

MIT
