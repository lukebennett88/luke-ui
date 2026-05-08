# Tokens

## Import

```ts
import {
	borderRadiusValues,
	borderWidthValues,
	boxShadowValues,
	Breakpoint,
	breakpointValues,
	colorToCssString,
	ColorTokenValue,
	ControlSizeToken,
	controlSizeValues,
	CubicBezierTokenValue,
	cubicBezierToString,
	DesignToken,
	DesignTokenGroup,
	DimensionTokenValue,
	dimensionToRemString,
	DurationTokenValue,
	durationToString,
	FontFamilyToken,
	fontFamilyValues,
	FontSizeToken,
	fontSizeValues,
	FontWeightToken,
	fontWeightValues,
	ForegroundColorToken,
	IconSizeToken,
	iconSizeValues,
	LineHeightToken,
	lineHeightValues,
	minMediaQueries,
	motionDurationValues,
	motionEasingValues,
	spaceValues,
	tokenKeys,
	TokenName,
	tokens,
	Tokens,
	toTokenGroup,
} from '@luke-ui/react/tokens';
```

## Exports

### `borderRadiusValues`

Token values for border radius.

### `borderWidthValues`

Token values for border width.

### `boxShadowValues`

Token values for box shadow.

### `Breakpoint`

```ts
type Breakpoint = keyof typeof breakpointValues;
```

The available breakpoint names (e.g. `'small' | 'medium' | ...`).

### `breakpointValues`

Token values for responsive breakpoints.

### `colorToCssString`

```ts
function colorToCssString(value: ColorTokenValue): string;
```

Converts a `ColorTokenValue` to a CSS color string.

### `ColorTokenValue`

Structured value for a color token with optional alpha and color-space components.

### `ControlSizeToken`

```ts
type ControlSizeToken = TokenName<Tokens['controlSize']>;
```

Union of valid control-size token names.

### `controlSizeValues`

Token values for control (interactive element) sizes.

### `CubicBezierTokenValue`

```ts
type CubicBezierTokenValue = readonly [number, number, number, number];
```

Structured value for a cubic-bezier easing token as a 4-number tuple.

### `cubicBezierToString`

```ts
function cubicBezierToString(value: CubicBezierTokenValue): string;
```

Converts a `CubicBezierTokenValue` to a `cubic-bezier(...)` CSS string.

### `DesignToken`

```ts
type DesignToken = {
	$value: TValue;
};
```

A single design token wrapping a typed value.

### `DesignTokenGroup`

```ts
type DesignTokenGroup = {
	$type: TType;
} & {
	[Key in keyof TValues]: DesignToken<TValues[Key]>;
};
```

A group of design tokens sharing a common `$type`, keyed by token name.

### `DimensionTokenValue`

Structured value for a dimension token, expressed in px or rem.

### `dimensionToRemString`

```ts
function dimensionToRemString(value: DimensionTokenValue, base: number): string;
```

Converts a `DimensionTokenValue` to a rem string.

### `DurationTokenValue`

Structured value for a duration token, expressed in ms or s.

### `durationToString`

```ts
function durationToString(value: DurationTokenValue): string;
```

Converts a `DurationTokenValue` to a CSS time string.

### `FontFamilyToken`

```ts
type FontFamilyToken = TokenName<Tokens['fontFamily']>;
```

Union of valid font-family token names.

### `fontFamilyValues`

Token values for font family.

### `FontSizeToken`

```ts
type FontSizeToken = TokenName<Tokens['fontSize']>;
```

Union of valid font-size token names.

### `fontSizeValues`

Token values for font size.

### `FontWeightToken`

```ts
type FontWeightToken = TokenName<Tokens['fontWeight']>;
```

Union of valid font-weight token names.

### `fontWeightValues`

Token values for font weight.

### `ForegroundColorToken`

```ts
type ForegroundColorToken = TokenName<Tokens['foregroundColor']>;
```

Union of valid foreground-color token names.

### `IconSizeToken`

```ts
type IconSizeToken = TokenName<Tokens['iconSize']>;
```

Union of valid icon-size token names.

### `iconSizeValues`

Token values for icon size.

### `LineHeightToken`

```ts
type LineHeightToken = TokenName<Tokens['lineHeight']>;
```

Union of valid line-height token names.

### `lineHeightValues`

Token values for line height.

### `minMediaQueries`

Prebuilt `@media (width >= ...)` query strings keyed by breakpoint name.

### `motionDurationValues`

Token values for motion (animation) duration.

### `motionEasingValues`

Token values for motion easing curves.

### `spaceValues`

Token values for spacing.

### `tokenKeys`

```ts
function tokenKeys(group: TGroup): TokenName<TGroup>[];
```

Returns the token names from a `DesignTokenGroup`, excluding the `$type` key.

### `TokenName`

```ts
type TokenName = Extract<Exclude<keyof TGroup, '$type'>, string>;
```

Extracts the string token names from a `DesignTokenGroup`, excluding `$type`.

### `tokens`

The complete design-token object, grouped by category, ready to use in vanilla-extract themes.

### `Tokens`

```ts
type Tokens = typeof tokens;
```

The full type of the `tokens` object.

### `toTokenGroup`

```ts
function toTokenGroup(type: TType, values: TValues): DesignTokenGroup<TType, TValues>;
```

Constructs a typed `DesignTokenGroup` from a type string and a values record.
