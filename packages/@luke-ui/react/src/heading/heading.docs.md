```tsx
<Heading>Section title</Heading>
```

```tsx
<Heading level={2}>Explicit h2</Heading>
```

## Best Practices

| Guidance | Practices                                                                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Do       | Rely on automatic leveling for nested sections instead of hardcoding `level`.                                                                                |
| Don't    | Skip heading levels (e.g. an h2 followed directly by an h4) — screen reader users navigate by heading level, and a skipped level reads as a missing section. |

## Automatic leveling

`Heading` reads its level from `HeadingLevels` context and increments
automatically when headings are nested. Set `base` on the context root; each
nested `HeadingLevels` advances to the next level.

```tsx
import { Heading, HeadingLevels } from '@luke-ui/react/heading';

<HeadingLevels base={1}>
	<Heading>h1</Heading>
	<HeadingLevels>
		<Heading>h2 — nested automatically</Heading>
		<HeadingLevels>
			<Heading>h3 — nested again</Heading>
		</HeadingLevels>
	</HeadingLevels>
</HeadingLevels>;
```

The `level` prop overrides context for a single heading without affecting the
nesting depth for siblings or children.

## Typography

`Heading` accepts all `Text` props except `fontSize` (controlled internally by
level). By default it applies `fontWeight="bold"` and `lineHeight="tight"`.

```tsx
<Heading level={3} color="informative">
	Informative heading
</Heading>
```

```tsx
<Heading level={4} fontWeight="regular">
	Light-weight heading
</Heading>
```
