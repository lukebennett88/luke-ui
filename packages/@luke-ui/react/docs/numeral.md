# Numeral

> Formats a number and renders it with `Text`.

## Import

```ts
import { Numeral } from '@luke-ui/react/numeral';
```

## Usage

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

## Props

| Prop            | Type                                            | Default | Description                                                        |
| --------------- | ----------------------------------------------- | ------- | ------------------------------------------------------------------ |
| `abbreviate`    | `NumeralAbbreviation`                           | —       | Enables compact notation (`1.2K`, `1.2 thousand`).                 |
| `textAlign`     | `"start" \| "center" \| "end"`                  | `'end'` | Text alignment.                                                    |
| `currency`      | `string`                                        | —       | Currency code such as `USD`.                                       |
| `format`        | `NumeralFormat`                                 | —       | Number format style. Inferred from `currency`/`unit` when omitted. |
| `formatOptions` | `Intl.NumberFormatOptions`                      | —       | Extra options passed to `Intl.NumberFormat`.                       |
| `locale`        | `Intl.LocalesArgument`                          | —       | Locale used for formatting. Defaults to locale context.            |
| `precision`     | `NumeralPrecision`                              | —       | Precision as fixed digits or `[min, max]` digits.                  |
| `unit`          | `NonNullable<Intl.NumberFormatOptions['unit']>` | —       | Unit name when `format` is `unit`, e.g. `kilometer`.               |
| `value`         | `number`                                        | —       | Number to format.                                                  |
| `variant`       | `Extract<                                       |

    	TextProps['variant'],
    	'diagonal-fractions' \| 'ordinal' \| 'slashed-zero' \| 'tabular-nums'
    >` | `'tabular-nums'` | Numeric glyph rendering mode. |
