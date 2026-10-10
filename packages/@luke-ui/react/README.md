# @luke-ui/react

Luke UI is a React design system built on `react-aria-components` and Vanilla Extract. Consumers
import the shipped CSS and do not need the Vanilla Extract compiler.

## Install

Install Luke UI, React Aria Components, and a theme. This example uses Tactile.

```sh
pnpm add @luke-ui/react @luke-ui/theme-tactile react-aria-components
```

Luke UI expects the application to provide a compatible shared `react-aria-components` instance.

## Setup

Import the component stylesheet and the theme's stylesheet, plus its `fonts.css` to load the font it
uses. Set the theme's identity class on `<html>`. No root class is needed: the shared stylesheet
paints `<body>` with the theme's surface, text colour, and body font, and keeps native HTML
presentation otherwise.

```tsx
import '@luke-ui/react/stylesheet.css';
import '@luke-ui/theme-tactile/stylesheet.css';
import '@luke-ui/theme-tactile/fonts.css';
import { themeClassName } from '@luke-ui/theme-tactile';

export function RootLayout() {
	return (
		<html className={themeClassName} lang="en">
			<body>{/* your app */}</body>
		</html>
	);
}
```

The shared stylesheet declares `@layer base, luke-ui;` and puts all its rules inside `luke-ui`. The
`base` layer is reserved for application defaults and ranks below Luke UI. With Tailwind CSS,
declare `@layer theme, base, luke-ui, components, utilities;` before any import.

Without `data-color-mode` on `<html>`, the theme follows the system colour mode.

## Custom themes

Compile your own theme at build time with `defineTheme` from `@luke-ui/react/theme/compiler`, in
Node 24 or later. It returns a stylesheet to load in place of a theme package's.

## Components and docs

Component documentation, interactive examples, and API reference live in this repo under
`apps/docs/content/docs`.

Start with the normal component API. Use primitives from `@luke-ui/react/primitives/*` when you need
a custom composition the component API does not cover. Import a colocated recipe such as
`buttonRecipe` from the same component entrypoint when you own the element and need that visual
treatment. There is no `@luke-ui/react/recipes` barrel.

## License

MIT
