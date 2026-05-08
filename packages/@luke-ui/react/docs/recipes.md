# Recipes

## Import

```ts
import {
	button,
	ButtonVariants,
	field,
	fieldLabel,
	fieldMessage,
	icon,
	iconButton,
	IconButtonVariants,
	iconSizeVariants,
	IconVariants,
	link,
	LinkVariants,
	loadingSpinner,
	LoadingSpinnerVariants,
	text,
	TextAlign,
	TextColor,
	TextDecoration,
	TextFontFamily,
	TextFontWeight,
	textInputAdornmentEnd,
	textInputAdornmentStart,
	textInputControl,
	textInputGroup,
	TextInputVariants,
	TextLineClampVariant,
	TextTransform,
	TextVariant,
	TextVariants,
} from '@luke-ui/react/recipes';
```

## Exports

### `button`

Vanilla-extract recipe for the `Button` primitive's button styles.

### `ButtonVariants`

```ts
type ButtonVariants = RecipeVariants<typeof button>;
```

Variant type for the `Button` recipe.

### `field`

Vanilla-extract recipes for the `Field` primitive's layout, label, and message styles.

### `fieldLabel`

Vanilla-extract recipes for the `Field` primitive's layout, label, and message styles.

### `fieldMessage`

Vanilla-extract recipes for the `Field` primitive's layout, label, and message styles.

### `icon`

Vanilla-extract recipe for the `Icon` primitive's styles, plus shared icon-size variant map.

### `iconButton`

Vanilla-extract recipe for the `IconButton` primitive's styles.

### `IconButtonVariants`

```ts
type IconButtonVariants = RecipeVariants<typeof iconButton>;
```

Variant type for the `IconButton` recipe.

### `iconSizeVariants`

Shared size dimensions for Icon and LoadingSpinner (icon-aligned sizing).

### `IconVariants`

```ts
type IconVariants = RecipeVariants<typeof icon>;
```

Variant type for the `Icon` recipe.

### `link`

Vanilla-extract recipe for the `Link` primitive's styles.

### `LinkVariants`

```ts
type LinkVariants = RecipeVariants<typeof link>;
```

Variant type for the `Link` recipe.

### `loadingSpinner`

Vanilla-extract recipe for the `LoadingSpinner` primitive's styles.

### `LoadingSpinnerVariants`

```ts
type LoadingSpinnerVariants = RecipeVariants<typeof spinner>;
```

Variant type for the `LoadingSpinner` recipe.

### `text`

Vanilla-extract recipe for the `Text` primitive's styles.

### `TextAlign`

```ts
type TextAlign = (typeof textAlignKeys)[number];
```

Text alignment variant values.

### `TextColor`

```ts
type TextColor = ForegroundColorToken | 'inherit';
```

Text color variant values.

### `TextDecoration`

```ts
type TextDecoration = (typeof textDecorationKeys)[number];
```

Text decoration variant values.

### `TextFontFamily`

```ts
type TextFontFamily = FontFamilyToken;
```

Text font-family variant values.

### `TextFontWeight`

```ts
type TextFontWeight = FontWeightToken | 'inherit';
```

Text font-weight variant values.

### `textInputAdornmentEnd`

Vanilla-extract recipes for the `TextInput` group, control, and adornment styles.

### `textInputAdornmentStart`

Vanilla-extract recipes for the `TextInput` group, control, and adornment styles.

### `textInputControl`

Vanilla-extract recipes for the `TextInput` group, control, and adornment styles.

### `textInputGroup`

Vanilla-extract recipes for the `TextInput` group, control, and adornment styles.

### `TextInputVariants`

```ts
type TextInputVariants = RecipeVariants<typeof textInputGroup>;
```

Variant type for the `TextInput` recipe.

### `TextLineClampVariant`

```ts
type TextLineClampVariant = keyof typeof lineClampVariants;
```

Text line-clamp variant values.

### `TextTransform`

```ts
type TextTransform = (typeof textTransformKeys)[number];
```

Text transform variant values.

### `TextVariant`

```ts
type TextVariant = (typeof textVariantKeys)[number];
```

Text style-variant values.

### `TextVariants`

```ts
type TextVariants = RecipeVariants<typeof text>;
```

Aggregate variant type for the `Text` recipe.
