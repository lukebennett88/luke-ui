`Text` expects the Luke UI theme class to be applied at app/root level. See [Getting Started](/docs/getting-started).

```tsx
<Text>The quick brown fox jumps over the lazy dog.</Text>
```

## Best Practices

| Guidance | Practices                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| Do       | Use `fontSize` tokens (e.g. `'h2'`) instead of arbitrary values, so text stays consistent with the rest of the app. |
| Don't    | Use `Text` for section headings — use `Heading`, which manages semantic level automatically.                        |

## Typography

```tsx
<Text fontSize="h2" lineHeight="tight">
	Heading-like text
</Text>
```

```tsx
<Text color="critical" fontFamily="mono" fontWeight="bold">
	Alert-like inline text
</Text>
```

See Token reference below for every valid `color`, `fontFamily`, `fontSize`,
`lineHeight`, and `fontWeight` value.

## Text transform and decoration

```tsx
<Text textTransform="uppercase" textDecoration="underline">
	Emphasized text
</Text>
```

## Truncation

```tsx
<Text lineClamp={2}>Long content that should be line clamped.</Text>
```

```tsx
<Text lineClamp>Long content truncated to one line.</Text>
```

```tsx
<Text shouldDisableTrim>Untrimmed text spacing</Text>
```

## Alignment and numeric glyphs

```tsx
<Text textAlign="end" variant="tabular-nums">
	12121.21
</Text>
```

## Token reference

### `color` tokens

`neutralSubtle`, `neutralBold`, `neutralDisabled`, `neutralBoldInverted`, `positive`, `informative`, `caution`, `critical`, `inherit`

### `fontFamily` tokens

`sans`, `mono`

### `fontSize` tokens

`xxsmall`, `xsmall`, `small`, `standard`, `medium`, `large`, `xlarge`, `xxlarge`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6`

### `lineHeight` tokens

`nospace`, `tight`, `loose`

### `fontWeight` tokens

`regular`, `medium`, `bold`, `inherit`

### `textDecoration` values

`none`, `underline`, `line-through`, `inherit`

### `textTransform` values

`none`, `capitalize`, `uppercase`, `lowercase`, `inherit`

## When to use vs Heading

Use `Heading` for actual section headings — it manages semantic level and
nesting automatically. Use `Text` with a heading-sized `fontSize` token when
the content looks like a heading but isn't semantically one (e.g. a large
stat number).
