`Numeral` formats numbers with `Intl.NumberFormat`. It respects locale from React Aria's
`I18nProvider`.

```tsx
<Numeral value={12_345.67} />
```

## Formats

`Numeral` infers `format` from `currency` or `unit` when omitted. Pass `format` explicitly for
`'percent'` or `'decimal'`, or when you want to be direct about currency and unit formatting.

```tsx
<Numeral value={3_500} format="percent" />
```

```tsx
<Numeral value={98.76} currency="AUD" />
```

```tsx
<Numeral value={98} unit="kilometer-per-hour" />
```

```tsx
<Numeral value={12_345} format="decimal" />
```

## Compact notation

Use `abbreviate` for compact notation.

```tsx
<Numeral value={12_345} abbreviate />
```

```tsx
<Numeral value={12_345} abbreviate="long" />
```

## Precision

Pass a number for fixed fraction digits, or a `[min, max]` tuple for a range.

```tsx
<Numeral value={98.7654} precision={2} />
```

```tsx
<Numeral value={1_234.5678} precision={[0, 2]} />
```

## Constraints

`Numeral` throws in development when:

- both `currency` and `unit` are provided.
- `format="currency"` is used without a `currency` code.
- `format="unit"` is used without a `unit` value.
- `precision` is not a non-negative integer or valid `[min, max]` tuple.
