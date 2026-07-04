Use `Heading` for section headings. It can infer heading level from `HeadingLevels` context, or you
can pass `level` directly.

```tsx
<Heading>Section title</Heading>
```

```tsx
<Heading level={2}>Explicit h2</Heading>
```

## Best practices

| Guidance | Practices                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| Do       | Prefer automatic leveling for nested sections instead of hardcoding every `level`.                            |
| Don't    | Skip heading levels, such as an h2 followed directly by an h4. Screen reader users navigate by heading level. |

## Automatic leveling

`Heading` reads its level from `HeadingLevels` context. Set `base` on the root context. Each nested
`HeadingLevels` advances the next heading level.

```tsx
import { Heading, HeadingLevels } from '@luke-ui/react/heading';

<HeadingLevels base={1}>
	<Heading>h1</Heading>
	<HeadingLevels>
		<Heading>h2 nested automatically</Heading>
		<HeadingLevels>
			<Heading>h3 nested again</Heading>
		</HeadingLevels>
	</HeadingLevels>
</HeadingLevels>;
```

The `level` prop overrides context for one heading without changing the nesting depth for siblings
or children.

## Typography

`Heading` accepts all `Text` props except `fontSize`, which is controlled by the heading level. By
default it applies `fontWeight="bold"` and `lineHeight="tight"`.

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
