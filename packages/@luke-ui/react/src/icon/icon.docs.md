`Icon` renders a symbol from the Luke UI spritesheet. It requires an `IconSpritesheetProvider`
ancestor. See Setup below.

```tsx
<Icon name="add" title="Add" size="xsmall" />
```

```tsx
<Icon name="close" aria-hidden size="medium" />
```

## Best practices

| Guidance | Practices                                                                                                 |
| -------- | --------------------------------------------------------------------------------------------------------- |
| Do       | Pass `title` when the icon conveys meaning without adjacent text, such as a standalone status icon.       |
| Don't    | Pass both `aria-hidden` and `title`. A titled icon should be exposed to assistive technology, not hidden. |

## Setup

Wrap your app with `IconSpritesheetProvider`.

- Source asset: `@luke-ui/react/spritesheet.svg`, exported from `./dist/spritesheet.svg`
- Runtime lookup: `<configured-sprite-href>#<icon-name>`

```tsx
<IconSpritesheetProvider href="/assets/spritesheet.svg">
	<App />
</IconSpritesheetProvider>
```

Vite and Storybook should import the spritesheet as a URL.

```ts
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';

<IconSpritesheetProvider href={spriteSheetHref}>
	<App />
</IconSpritesheetProvider>;
```

The `no-inline` query avoids `data:` URLs, which can break `<use href="...#icon-id">` rendering.

When developing `@luke-ui/react`, generate icons from `packages/@luke-ui/react/icons/*.svg` into
`packages/@luke-ui/react/dist/spritesheet.svg`.

```bash
pnpm --dir packages/@luke-ui/react run generate:icons
```

## How it works

`Icon` renders an `<svg>` that references a symbol in the generated spritesheet with
`<use href="..." />`.

- `name` chooses the symbol id.
- The sprite URL comes from `IconSpritesheetProvider`.
- `viewBox` defaults to the generated icon viewBox.
- Icon fill follows `currentColor`.

```tsx
<Icon name="add" className="myIcon" style={{ color: 'tomato' }} />
```

## Create your own icon

Use `createIcon` for a one-off icon that is not in the generated spritesheet.

```tsx
import { createIcon } from '@luke-ui/react/icon';

const HeartIcon = createIcon({
	path: (
		<path d="M12 21a1 1 0 0 1-.7-.3L5 14.5a5 5 0 1 1 7-6 5 5 0 1 1 7 6l-6.3 6.2a1 1 0 0 1-.7.3Z" />
	),
});

<HeartIcon title="Favorite" size="small" />;
```

## Accessibility

If `title` is provided, the icon is exposed to assistive technology with `role="img"`. If `title` is
omitted, `aria-hidden` defaults to `true`.
