# Icon

> Provides the icon spritesheet URL for `Icon`.

## Import

```ts
import { Icon } from '@luke-ui/react/icon';
```

## Usage

## Setup

`Icon` requires one setup step: wrap your app with `IconSpritesheetProvider`.

- Source asset: `@luke-ui/react/spritesheet.svg` (exports `./dist/spritesheet.svg`)
- Runtime lookup: `<configured-sprite-href>#<icon-name>`

Example:

```tsx
<IconSpritesheetProvider href="/assets/spritesheet.svg">
	<App />
</IconSpritesheetProvider>
```

Vite / Storybook setup (recommended):

```ts
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';

<IconSpritesheetProvider href={spriteSheetHref}>
	<App />
</IconSpritesheetProvider>;
```

`no-inline` avoids `data:` URLs, which can break `<use href="...#icon-id">` rendering.

When developing `@luke-ui/react`, icons are generated from `packages/@luke-ui/react/icons/*.svg` into `packages/@luke-ui/react/dist/spritesheet.svg`.

```bash
pnpm --dir packages/@luke-ui/react run generate:icons
```

## How It Works

`Icon` renders an `<svg>` that references a symbol in the generated spritesheet using `<use href="..." />`.

- `name` picks the symbol id
- sprite URL comes from `IconSpritesheetProvider`
- `viewBox` defaults to the generated viewBox for that icon
- icon fill color follows `currentColor`
- if `title` is provided, the icon is exposed to assistive tech (`role="img"`)
- if `title` is omitted, `aria-hidden` defaults to `true`

## Usage

```tsx
<Icon name="add" title="Add" size="xsmall" />
```

```tsx
<Icon name="close" aria-hidden size="medium" />
```

```tsx
<Icon name="add" className="myIcon" style={{ color: 'tomato' }} />
```

## Create your own icon

When you need a one-off icon that is not in the generated spritesheet, use
`createIcon`.

```tsx
import { createIcon } from '@luke-ui/react/icon';

const HeartIcon = createIcon({
	path: (
		<path d="M12 21a1 1 0 0 1-.7-.3L5 14.5a5 5 0 1 1 7-6 5 5 0 1 1 7 6l-6.3 6.2a1 1 0 0 1-.7.3Z" />
	),
});

<HeartIcon title="Favorite" size="small" />;
```

## Props

| Prop       | Type        | Default | Description                             |
| ---------- | ----------- | ------- | --------------------------------------- |
| `href`     | `string`    | —       | URL to the generated sprite sheet file. |
| `children` | `ReactNode` | —       |                                         |
