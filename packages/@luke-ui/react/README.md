# @luke-ui/react

Luke UI is a React design system built on `react-aria-components` and `vanilla-extract`.

## Install

```sh
pnpm add @luke-ui/react
```

## Setup

Import the component stylesheet and one bundled theme stylesheet. Importing a theme stylesheet
themes the whole document from `:root`, so no identity class is needed for a single theme. Apply
`rootClassName` to an element you own for the reset and base typography.

The shared stylesheet owns reset, theme-root, recipe, and utility rules in `reset`, `theme`,
`recipes`, `utilities` order.

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
[lukebennett88.github.io/luke-ui/docs](https://lukebennett88.github.io/luke-ui/docs).

AI agents can fetch documentation at:

- [llms.txt](https://lukebennett88.github.io/luke-ui/llms.txt): component index.
- [llms-full.txt](https://lukebennett88.github.io/luke-ui/llms-full.txt): full docs.
- Any docs URL with `.md` appended: per-page Markdown.

Components follow three tiers:

- Atoms: single units such as `Text`, `Icon`, and `Heading`.
- Composed components: opinionated combinations such as `Button` and `TextField`.
- Primitives: lower-level public APIs for library authors, such as `button/primitive` and
  `field/primitive`.

Atoms and composed components are app-developer-facing. Primitives are documented in hosted docs for
library authors, separate from the primary component path.

## License

MIT
