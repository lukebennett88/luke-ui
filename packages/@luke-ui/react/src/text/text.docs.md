`Text` expects the Luke UI theme class to be applied at app/root level. See [Getting Started](/docs/getting-started).

```tsx
<Text>The quick brown fox jumps over the lazy dog.</Text>
```

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

```tsx
<Text textTransform="uppercase" textDecoration="underline">
	Emphasized text
</Text>
```

```tsx
<Text shouldDisableTrim>Untrimmed text spacing</Text>
```

```tsx
<Text textAlign="end" variant="tabular-nums">
	12121.21
</Text>
```

```tsx
<Text lineClamp={2}>Long content that should be line clamped.</Text>
```

```tsx
<Text lineClamp>Long content truncated to one line.</Text>
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
