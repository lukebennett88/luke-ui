import type { CubicBezierTokenValue, DimensionTokenValue, DurationTokenValue } from './index.js';

export const breakpointValues = {
	large: { unit: 'px', value: 1024 },
	medium: { unit: 'px', value: 768 },
	small: { unit: 'px', value: 640 },
	xlarge: { unit: 'px', value: 1280 },
	xsmall: { unit: 'px', value: 0 },
	xxlarge: { unit: 'px', value: 1536 },
} as const satisfies Record<string, DimensionTokenValue>;

export const borderRadiusValues = {
	full: { unit: 'px', value: 9999 },
	large: { unit: 'px', value: 8 },
	medium: { unit: 'px', value: 4 },
	none: { unit: 'px', value: 0 },
	small: { unit: 'px', value: 2 },
	xlarge: { unit: 'px', value: 16 },
} as const satisfies Record<string, DimensionTokenValue>;

export const borderWidthValues = {
	thick: { unit: 'px', value: 2 },
	thin: { unit: 'px', value: 1 },
} as const satisfies Record<string, DimensionTokenValue>;

export const boxShadowValues = {
	large: '0px 4px 16px rgba(0, 0, 0, 0.2)',
	medium: '0px 2px 8px rgba(0, 0, 0, 0.2)',
	none: 'none',
	small: '0px 2px 4px rgba(0, 0, 0, 0.2)',
	xlarge: '-8px 8px 32px rgba(0, 0, 0, 0.2)',
	xsmall: '0px 1px 2px rgba(0, 0, 0, 0.2)',
} as const;

export const controlSizeValues = {
	medium: { unit: 'px', value: 40 },
	small: { unit: 'px', value: 32 },
} as const satisfies Record<string, DimensionTokenValue>;

export const fontFamilyValues = {
	mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
	sans: "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
} as const;

export const fontSizeValues = {
	h1: { unit: 'px', value: 36 },
	h2: { unit: 'px', value: 28 },
	h3: { unit: 'px', value: 24 },
	h4: { unit: 'px', value: 20 },
	h5: { unit: 'px', value: 18 },
	h6: { unit: 'px', value: 16 },
	large: { unit: 'px', value: 40 },
	medium: { unit: 'px', value: 20 },
	small: { unit: 'px', value: 14 },
	standard: { unit: 'px', value: 16 },
	xlarge: { unit: 'px', value: 48 },
	xsmall: { unit: 'px', value: 12 },
	xxlarge: { unit: 'px', value: 55 },
	xxsmall: { unit: 'px', value: 10 },
} as const satisfies Record<string, DimensionTokenValue>;

export const fontWeightValues = {
	bold: 700,
	medium: 500,
	regular: 400,
} as const;

export const iconSizeValues = {
	large: { unit: 'px', value: 32 },
	medium: { unit: 'px', value: 24 },
	small: { unit: 'px', value: 20 },
	xsmall: { unit: 'px', value: 16 },
} as const satisfies Record<string, DimensionTokenValue>;

export const lineHeightValues = {
	loose: 1.5,
	nospace: 1,
	tight: 1.25,
} as const;

export const motionDurationValues = {
	fast: { unit: 'ms', value: 150 },
	quick: { unit: 'ms', value: 120 },
	slow: { unit: 's', value: 1.2 },
	slower: { unit: 's', value: 2 },
} as const satisfies Record<string, DurationTokenValue>;

export const motionEasingValues = {
	emphasized: [0.42, 0, 0.58, 1],
	exit: [0, 0, 0.58, 1],
	linear: [0, 0, 1, 1],
	standard: [0.4, 0, 0.2, 1],
} as const satisfies Record<string, CubicBezierTokenValue>;

export const spaceValues = {
	large: { unit: 'px', value: 24 },
	medium: { unit: 'px', value: 16 },
	none: { unit: 'px', value: 0 },
	small: { unit: 'px', value: 12 },
	xlarge: { unit: 'px', value: 32 },
	xsmall: { unit: 'px', value: 8 },
	xxlarge: { unit: 'px', value: 40 },
	xxsmall: { unit: 'px', value: 4 },
} as const satisfies Record<string, DimensionTokenValue>;
