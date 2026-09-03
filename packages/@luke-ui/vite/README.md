# @luke-ui/vite

Vite integration for Luke UI applications that author `xstyle` overrides.

## Install

```sh
pnpm add @stylexjs/stylex
pnpm add -D @luke-ui/vite
```

Install `@stylexjs/stylex` because application source imports it directly. `@luke-ui/vite` owns the
compiler packages used to extract StyleX CSS.

## Setup

```ts
import { lukeUi } from '@luke-ui/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [lukeUi()],
});
```

Import the stylesheet before Luke UI's stylesheet:

```ts
import '@luke-ui/vite/stylesheet.css';
import '@luke-ui/react/stylesheet.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
```

See the [Installation](https://lukebennett88.github.io/luke-ui/docs/installation) and
[Styling](https://lukebennett88.github.io/luke-ui/docs/styling) guides for usage.
