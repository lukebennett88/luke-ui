import type { DimensionTokenValue, DurationTokenValue, CubicBezierTokenValue } from './index.js';

export const breakpointValues = {
	xsmall: { unit: 'px', value: 0 },
	small: { unit: 'px', value: 640 },
	medium: { unit: 'px', value: 768 },
	large: { unit: 'px', value: 1024 },
	xlarge: { unit: 'px', value: 1280 },
	xxlarge: { unit: 'px', value: 1536 },
} as const satisfies Record<string, DimensionTokenValue>;

export const borderRadiusValues = {
	none: { unit: 'px', value: 0 },
	small: { unit: 'px', value: 2 },
	medium: { unit: 'px', value: 4 },
	large: { unit: 'px', value: 8 },
	xlarge: { unit: 'px', value: 16 },
	full: { unit: 'px', value: 9999 },
} as const satisfies Record<string, DimensionTokenValue>;

export const borderWidthValues = {
	thin: { unit: 'px', value: 1 },
	thick: { unit: 'px', value: 2 },
} as const satisfies Record<string, DimensionTokenValue>;

export const boxShadowValues = {
	none: 'none',
	xsmall: '0px 1px 2px rgba(0, 0, 0, 0.2)',
	small: '0px 2px 4px rgba(0, 0, 0, 0.2)',
	medium: '0px 2px 8px rgba(0, 0, 0, 0.2)',
	large: '0px 4px 16px rgba(0, 0, 0, 0.2)',
	xlarge: '-8px 8px 32px rgba(0, 0, 0, 0.2)',
} as const;

export const controlSizeValues = {
	small: { unit: 'px', value: 32 },
	medium: { unit: 'px', value: 40 },
} as const satisfies Record<string, DimensionTokenValue>;

export const fontFamilyValues = {
	sans: "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
	mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
} as const;

export const fontSizeValues = {
	xxsmall: { unit: 'px', value: 10 },
	xsmall: { unit: 'px', value: 12 },
	small: { unit: 'px', value: 14 },
	standard: { unit: 'px', value: 16 },
	medium: { unit: 'px', value: 20 },
	large: { unit: 'px', value: 40 },
	xlarge: { unit: 'px', value: 48 },
	xxlarge: { unit: 'px', value: 55 },
	h1: { unit: 'px', value: 36 },
	h2: { unit: 'px', value: 28 },
	h3: { unit: 'px', value: 24 },
	h4: { unit: 'px', value: 20 },
	h5: { unit: 'px', value: 18 },
	h6: { unit: 'px', value: 16 },
} as const satisfies Record<string, DimensionTokenValue>;

export const fontWeightValues = {
	regular: 400,
	medium: 500,
	bold: 700,
} as const;

export const iconSizeValues = {
	xsmall: { unit: 'px', value: 16 },
	small: { unit: 'px', value: 20 },
	medium: { unit: 'px', value: 24 },
	large: { unit: 'px', value: 32 },
} as const satisfies Record<string, DimensionTokenValue>;

export const lineHeightValues = {
	nospace: 1,
	tight: 1.25,
	loose: 1.5,
} as const;

export const motionDurationValues = {
	quick: { unit: 'ms', value: 120 },
	fast: { unit: 'ms', value: 150 },
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
	none: { unit: 'px', value: 0 },
	xxsmall: { unit: 'px', value: 4 },
	xsmall: { unit: 'px', value: 8 },
	small: { unit: 'px', value: 12 },
	medium: { unit: 'px', value: 16 },
	large: { unit: 'px', value: 24 },
	xlarge: { unit: 'px', value: 32 },
	xxlarge: { unit: 'px', value: 40 },
} as const satisfies Record<string, DimensionTokenValue>;
