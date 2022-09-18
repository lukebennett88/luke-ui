import type { Breakpoint } from './breakpoints';

const fontSizeScale = [12, 14, 16, 18, 20, 28, 40, 64] as const;
const fontWeightScale = [400, 500, 700] as const;

const textSizes = {
	xsmall: { fontSize: fontSizeScale[0], rows: 5 },
	small: { fontSize: fontSizeScale[1], rows: 5 },
	standard: { fontSize: fontSizeScale[2], rows: 6 },
	large: { fontSize: fontSizeScale[3], rows: 7 },
} as const;

/** font-size tokens */
const fontSizes = {
	small: fontSizeScale[1],
	base: fontSizeScale[2],
	body: fontSizeScale[3],
	large: fontSizeScale[4],
};

/** font-weight tokens */
const fontWeights = {
	regular: fontWeightScale[0],
	medium: fontWeightScale[1],
	bold: fontWeightScale[2],
};

/** font-family tokens */
const fontFamily = {
	body: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
	heading:
		'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
	mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
};

type TextDefinition = {
	fontSize: number;
	rows: number;
};

type TextBreakpoint = Extract<Breakpoint, 'none' | 'medium'>;
type ResponsiveTextDefinition = Record<TextBreakpoint, TextDefinition>;

////////////////////////////////////////////////////////////////////////////////

export { fontFamily, fontSizes, fontWeights, textSizes };
export type { ResponsiveTextDefinition, TextDefinition };
