# @luke-ui/vite

Vite integration for Luke UI applications that author `xstyle` overrides.

## Install

```sh
pnpm add @stylexjs/stylex
pnpm add -D @luke-ui/vite
```

Install `@stylexjs/stylex` because application source imports it directly. `@luke-ui/vite` provides
the compiler packages that extract StyleX CSS.

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

See the [Installation](../../../apps/docs/content/docs/docs/installation.mdx) and
[Styling](../../../apps/docs/content/docs/docs/styling.mdx) guides for usage.
