Formatting is done via `Intl.NumberFormat` and respects the locale from React
Aria's `I18nProvider`.

```tsx
<Numeral value={12_345.67} />
```

## Formats

`format` is derived from `currency` and `unit` when omitted. Pass it explicitly
for `'percent'` or `'decimal'` without a currency or unit.

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

- `currency` and `unit` are both provided.
- `format="currency"` is used without a `currency` code.
- `format="unit"` is used without a `unit` value.
- `precision` is not a non-negative integer or valid `[min, max]` tuple.
