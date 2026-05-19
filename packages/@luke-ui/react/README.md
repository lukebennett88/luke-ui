# @luke-ui/react

A React design system built on `react-aria-components` and `vanilla-extract`.

## Install

```sh
pnpm add @luke-ui/react
```

## Setup

Apply the theme class at your app root and import the stylesheet:

```tsx
import '@luke-ui/react/stylesheet.css';
import { themeRootClassName } from '@luke-ui/react/theme';

export function App() {
	return <div className={themeRootClassName}>{/* your app */}</div>;
}
```

## Components and docs

This package ships per-export documentation under `docs/`. The full index is in [`docs/llms.txt`](./docs/llms.txt) — readable by humans and by AI agents.

Components fall into a [three-tier taxonomy](https://github.com/lukebennett88/luke-ui/blob/main/docs/adr/0001-component-tier-taxonomy.md):

- **Atoms** — single units (`Text`, `Icon`, `Heading`, …)
- **Composed** — opinionated combinations (`Button`, `TextField`, …)
- **Primitives** — building blocks for library authors (`button/primitive`, `field/primitive`, …)

Atoms and composed components are app-developer-facing. Primitives are documented under `docs/` for library authors but excluded from the primary index.

## License

MIT
